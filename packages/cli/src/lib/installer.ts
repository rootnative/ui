import path from 'node:path'
import { execa } from 'execa'
import fs from 'fs-extra'
import { resolveAliasPath } from './config'
import { getInstallCommand } from './detector'
import { createSpinner, logger } from './logger'
import { fetchFileContent, fetchUtilsRegistry } from './registry'
import { getComponentNames } from './resolver'
import { generateUtilsBarrel, transformImports } from './transform'
import type {
  RootNativeConfig,
  PackageManager,
  ResolutionResult,
  UtilsRegistry,
} from './types'

interface InstallOptions {
  config: RootNativeConfig
  cwd: string
  resolution: ResolutionResult
  packageManager: PackageManager
  force: boolean
}

export async function installComponents(
  options: InstallOptions,
): Promise<void> {
  const { config, cwd, resolution, packageManager, force } = options

  const componentsDir = resolveAliasPath(config.aliases.components, cwd)
  const libDir = resolveAliasPath(config.aliases.lib, cwd)
  const allComponentNames = getComponentNames(resolution)

  // 1. Copy utility files
  const spinner = createSpinner('Copying utility files...')
  spinner.start()

  const utilsRegistry = await fetchUtilsRegistry(config)
  await copyUtilFiles(config, resolution, utilsRegistry, libDir)
  await generateBarrel(resolution, utilsRegistry, libDir)

  spinner.succeed('Utility files copied')

  // 2. Copy component files
  for (const { entry } of resolution.components) {
    const componentDir = path.join(componentsDir, entry.name)
    const exists = await fs.pathExists(componentDir)

    if (exists && !force) {
      logger.warn(
        `${entry.name} already exists, skipping (use --force to overwrite)`,
      )
      continue
    }

    const compSpinner = createSpinner(`Adding ${entry.name}...`)
    compSpinner.start()

    await fs.ensureDir(componentDir)

    for (const filePath of entry.files) {
      const content = await fetchFileContent(config, filePath)
      const fileName = path.basename(filePath)

      const transformed = transformImports(content, {
        config,
        componentName: entry.name,
        installedComponents: allComponentNames,
      })

      await fs.writeFile(
        path.join(componentDir, fileName),
        transformed,
        'utf-8',
      )
    }

    compSpinner.succeed(`Added ${entry.name}`)
  }

  // 3. Install npm dependencies
  const depsToInstall = collectDepsToInstall(resolution, cwd)

  if (depsToInstall.length > 0) {
    const command = getInstallCommand(packageManager, depsToInstall)
    const [cmd, ...args] = command.split(' ')

    logger.break()
    logger.info('Installing dependencies...')
    logger.break()

    try {
      await execa(cmd, args, { cwd, stdio: 'inherit' })
      logger.break()
      logger.success('Dependencies installed')
    } catch {
      logger.break()
      logger.error('Failed to install dependencies')
      logger.error(`Run manually: ${command}`)
    }
  }
}

async function copyUtilFiles(
  config: RootNativeConfig,
  resolution: ResolutionResult,
  utilsRegistry: UtilsRegistry,
  libDir: string,
): Promise<void> {
  await fs.ensureDir(libDir)

  for (const utilName of resolution.utils) {
    const utilEntry = utilsRegistry[utilName]
    if (!utilEntry) continue

    const content = await fetchFileContent(config, utilEntry.file)
    const fileName = path.basename(utilEntry.file)

    await fs.writeFile(path.join(libDir, fileName), content, 'utf-8')
  }
}

async function generateBarrel(
  resolution: ResolutionResult,
  utilsRegistry: UtilsRegistry,
  libDir: string,
): Promise<void> {
  const utilExports: Record<string, string[]> = {}
  const utilTypeExports: Record<string, string[]> = {}

  for (const utilName of resolution.utils) {
    const utilEntry = utilsRegistry[utilName]
    if (utilEntry) {
      utilExports[utilName] = utilEntry.exports
      if (utilEntry.typeExports) {
        utilTypeExports[utilName] = utilEntry.typeExports
      }
    }
  }

  const barrelContent = generateUtilsBarrel(
    resolution.utils,
    utilExports,
    utilTypeExports,
  )

  await fs.writeFile(
    path.join(libDir, 'rootnative-utils.ts'),
    barrelContent,
    'utf-8',
  )
}

function collectDepsToInstall(
  resolution: ResolutionResult,
  cwd: string,
): string[] {
  const deps: string[] = []

  // Read current package.json to avoid installing already-present deps
  const pkgPath = path.resolve(cwd, 'package.json')
  let existingDeps: Record<string, string> = {}

  try {
    const pkg = fs.readJSONSync(pkgPath)
    existingDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }
  } catch {
    // No package.json, install everything
  }

  for (const [pkg] of Object.entries(resolution.npmDependencies)) {
    if (!existingDeps[pkg]) {
      deps.push(pkg)
    }
  }

  return deps
}
