import path from 'node:path'
import chalk from 'chalk'
import fs from 'fs-extra'
import prompts from 'prompts'
import { readConfig, resolveAliasPath } from '../lib/config'
import { computeDiff, formatDiff, formatDiffSummary } from '../lib/diff'
import type { FileDiff } from '../lib/diff'
import { createSpinner, logger } from '../lib/logger'
import { fetchFileContent, fetchUtilsRegistry } from '../lib/registry'
import { getComponentNames, resolveComponents } from '../lib/resolver'
import { generateUtilsBarrel, transformImports } from '../lib/transform'

interface UpdateOptions {
  dryRun: boolean
  all: boolean
}

export async function updateCommand(
  componentNames: string[],
  cwd: string,
  options: UpdateOptions,
): Promise<void> {
  logger.break()

  const config = await readConfig(cwd)
  const componentsDir = resolveAliasPath(config.aliases.components, cwd)
  const libDir = resolveAliasPath(config.aliases.lib, cwd)

  // Find installed components
  const spinner = createSpinner('Checking installed components...')
  spinner.start()

  let targetNames: string[]

  if (options.all) {
    // Update all installed components
    const installed = await getInstalledComponents(componentsDir)

    if (installed.length === 0) {
      spinner.fail('No components installed')
      return
    }

    targetNames = installed
  } else if (componentNames.length > 0) {
    // Update specific components
    targetNames = componentNames

    // Verify they are installed
    const missing = []
    for (const name of targetNames) {
      const dir = path.join(componentsDir, name)
      if (!(await fs.pathExists(dir))) {
        missing.push(name)
      }
    }

    if (missing.length > 0) {
      spinner.fail(
        `Not installed: ${missing.join(', ')}. Use "rootnative add" instead.`,
      )
      return
    }
  } else {
    spinner.fail('Specify component names or use --all to update everything.')
    return
  }

  spinner.succeed(`Found ${targetNames.length} component(s) to check`)

  // Resolve full dependency graph for these components
  const resolveSpinner = createSpinner('Fetching latest from registry...')
  resolveSpinner.start()

  const resolution = await resolveComponents(config, targetNames)
  const allComponentNames = getComponentNames(resolution)
  const utilsRegistry = await fetchUtilsRegistry(config)

  resolveSpinner.succeed('Registry fetched')

  // Compare each component file against local version
  const componentDiffs: {
    name: string
    diffs: FileDiff[]
    hasChanges: boolean
  }[] = []

  for (const { entry } of resolution.components) {
    const componentDir = path.join(componentsDir, entry.name)

    if (!(await fs.pathExists(componentDir))) {
      // Transitive dependency not installed locally — skip diff, will be added
      componentDiffs.push({
        name: entry.name,
        diffs: [],
        hasChanges: true,
      })
      continue
    }

    const diffs: FileDiff[] = []

    for (const filePath of entry.files) {
      const fileName = path.basename(filePath)
      const localPath = path.join(componentDir, fileName)

      // Fetch remote and transform
      const remoteContent = await fetchFileContent(config, filePath)
      const transformed = transformImports(remoteContent, {
        config,
        componentName: entry.name,
        installedComponents: allComponentNames,
      })

      // Read local
      let localContent = ''
      if (await fs.pathExists(localPath)) {
        localContent = await fs.readFile(localPath, 'utf-8')
      }

      diffs.push(computeDiff(localContent, transformed, fileName))
    }

    const hasChanges = diffs.some((d) => d.hasChanges)
    componentDiffs.push({ name: entry.name, diffs, hasChanges })
  }

  // Also check utility files
  const utilDiffs: FileDiff[] = []

  for (const utilName of resolution.utils) {
    const utilEntry = utilsRegistry[utilName]
    if (!utilEntry) continue

    const fileName = path.basename(utilEntry.file)
    const localPath = path.join(libDir, fileName)

    const remoteContent = await fetchFileContent(config, utilEntry.file)
    let localContent = ''
    if (await fs.pathExists(localPath)) {
      localContent = await fs.readFile(localPath, 'utf-8')
    }

    utilDiffs.push(computeDiff(localContent, remoteContent, `lib/${fileName}`))
  }

  // Check barrel file
  const utilExports: Record<string, string[]> = {}
  for (const utilName of resolution.utils) {
    const utilEntry = utilsRegistry[utilName]
    if (utilEntry) {
      utilExports[utilName] = utilEntry.exports
    }
  }
  const newBarrel = generateUtilsBarrel(resolution.utils, utilExports)
  const barrelPath = path.join(libDir, 'rootnative-utils.ts')
  let oldBarrel = ''
  if (await fs.pathExists(barrelPath)) {
    oldBarrel = await fs.readFile(barrelPath, 'utf-8')
  }
  utilDiffs.push(computeDiff(oldBarrel, newBarrel, 'lib/rootnative-utils.ts'))

  // Display results
  const changedComponents = componentDiffs.filter((c) => c.hasChanges)
  const changedUtils = utilDiffs.filter((d) => d.hasChanges)
  const totalChanges =
    changedComponents.length + (changedUtils.length > 0 ? 1 : 0)

  if (totalChanges === 0) {
    logger.break()
    logger.success('All components are up to date!')
    logger.break()
    return
  }

  logger.break()
  console.log(
    chalk.bold(`${changedComponents.length} component(s) with updates:`),
  )
  logger.break()

  for (const comp of componentDiffs) {
    if (!comp.hasChanges) {
      console.log(chalk.dim(`  ${comp.name}: up to date`))
      continue
    }

    if (comp.diffs.length === 0) {
      // New transitive dep — not installed locally
      console.log(
        `  ${chalk.yellow(comp.name)}: ${chalk.yellow('new dependency (will be added)')}`,
      )
      continue
    }

    console.log(chalk.bold.yellow(`  ${comp.name}:`))
    console.log(formatDiffSummary(comp.diffs))

    for (const diff of comp.diffs) {
      if (diff.hasChanges) {
        console.log(formatDiff(diff))
      }
    }

    logger.break()
  }

  if (changedUtils.length > 0) {
    console.log(chalk.bold('Utility updates:'))
    for (const diff of changedUtils) {
      if (diff.hasChanges) {
        console.log(formatDiff(diff))
      }
    }
    logger.break()
  }

  if (options.dryRun) {
    logger.info('Dry run complete. No files were written.')
    return
  }

  // Prompt for confirmation
  const { proceed } = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: `Apply updates to ${changedComponents.length} component(s)?`,
    initial: true,
  })

  if (!proceed) {
    logger.info('Cancelled.')
    return
  }

  // Apply updates
  const applySpinner = createSpinner('Applying updates...')
  applySpinner.start()

  for (const comp of changedComponents) {
    const componentDir = path.join(componentsDir, comp.name)
    await fs.ensureDir(componentDir)

    if (comp.diffs.length === 0) {
      // New transitive dep — fetch and write all files
      const entry = resolution.components.find(
        (c) => c.entry.name === comp.name,
      )
      if (!entry) continue

      for (const filePath of entry.entry.files) {
        const content = await fetchFileContent(config, filePath)
        const fileName = path.basename(filePath)
        const transformed = transformImports(content, {
          config,
          componentName: comp.name,
          installedComponents: allComponentNames,
        })
        await fs.writeFile(
          path.join(componentDir, fileName),
          transformed,
          'utf-8',
        )
      }
      continue
    }

    for (const diff of comp.diffs) {
      if (!diff.hasChanges) continue

      // Reconstruct the new content from diff lines
      const newContent = diff.lines
        .filter((l) => l.type !== 'remove')
        .map((l) => l.content)
        .join('\n')

      await fs.writeFile(
        path.join(componentDir, diff.fileName),
        newContent,
        'utf-8',
      )
    }
  }

  // Apply util updates
  await fs.ensureDir(libDir)

  for (const diff of changedUtils) {
    if (!diff.hasChanges) continue

    const newContent = diff.lines
      .filter((l) => l.type !== 'remove')
      .map((l) => l.content)
      .join('\n')

    const filePath = path.join(
      libDir,
      // diff.fileName is like "lib/color.ts" — strip the "lib/" prefix
      diff.fileName.replace(/^lib\//, ''),
    )
    await fs.writeFile(filePath, newContent, 'utf-8')
  }

  applySpinner.succeed('Updates applied')

  logger.break()
  logger.success(
    `Updated ${changedComponents.length} component(s): ${changedComponents.map((c) => c.name).join(', ')}`,
  )
  logger.break()
}

async function getInstalledComponents(
  componentsDir: string,
): Promise<string[]> {
  if (!(await fs.pathExists(componentsDir))) {
    return []
  }

  const entries = await fs.readdir(componentsDir)
  const components: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(componentsDir, entry)
    const stat = await fs.stat(fullPath)
    if (stat.isDirectory()) {
      // Verify it has an index.ts
      const indexPath = path.join(fullPath, 'index.ts')
      if (await fs.pathExists(indexPath)) {
        components.push(entry)
      }
    }
  }

  return components
}
