import path from 'node:path'
import chalk from 'chalk'
import { execa } from 'execa'
import fs from 'fs-extra'
import prompts from 'prompts'
import { readConfig } from '../lib/config'
import { detectProject, getInstallCommand } from '../lib/detector'
import { createSpinner, logger } from '../lib/logger'
import type { PackageManager } from '../lib/types'
import { updateCommand } from './update'

interface NpmPackageInfo {
  version: string
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

interface PeerDepDiff {
  added: Record<string, string>
  changed: Record<string, { from: string; to: string }>
  removed: string[]
}

export interface UpgradeOptions {
  yes?: boolean
  all?: boolean
  packageManager?: PackageManager
}

async function fetchLatestFromNpm(
  packageName: string,
): Promise<NpmPackageInfo> {
  const url = `https://registry.npmjs.org/${packageName}/latest`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${packageName} from npm: ${response.status} ${response.statusText}`,
    )
  }

  return response.json() as Promise<NpmPackageInfo>
}

function getInstalledPackageInfo(
  cwd: string,
  packageName: string,
): NpmPackageInfo | null {
  const pkgPath = path.resolve(
    cwd,
    'node_modules',
    ...packageName.split('/'),
    'package.json',
  )

  if (!fs.pathExistsSync(pkgPath)) {
    return null
  }

  const pkg = fs.readJSONSync(pkgPath)
  return {
    version: pkg.version,
    peerDependencies: pkg.peerDependencies,
    peerDependenciesMeta: pkg.peerDependenciesMeta,
  }
}

function diffPeerDeps(
  current: Record<string, string> | undefined,
  latest: Record<string, string> | undefined,
): PeerDepDiff {
  const currentDeps = current ?? {}
  const latestDeps = latest ?? {}

  const added: Record<string, string> = {}
  const changed: Record<string, { from: string; to: string }> = {}
  const removed: string[] = []

  // Find added and changed
  for (const [pkg, range] of Object.entries(latestDeps)) {
    if (!(pkg in currentDeps)) {
      added[pkg] = range
    } else if (currentDeps[pkg] !== range) {
      changed[pkg] = {
        from: currentDeps[pkg],
        to: range,
      }
    }
  }

  // Find removed
  for (const pkg of Object.keys(currentDeps)) {
    if (!(pkg in latestDeps)) {
      removed.push(pkg)
    }
  }

  return { added, changed, removed }
}

function getProjectDeps(cwd: string): Record<string, string> {
  const pkgPath = path.resolve(cwd, 'package.json')

  try {
    const pkg = fs.readJSONSync(pkgPath)
    return {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }
  } catch {
    return {}
  }
}

function hasDiffChanges(diff: PeerDepDiff): boolean {
  return (
    Object.keys(diff.added).length > 0 ||
    Object.keys(diff.changed).length > 0 ||
    diff.removed.length > 0
  )
}

export async function upgradeCommand(
  cwd: string,
  options: UpgradeOptions = {},
): Promise<void> {
  logger.break()

  // 1. Read config and detect project
  await readConfig(cwd)
  const spinner = createSpinner('Detecting project...')
  spinner.start()
  const project = await detectProject(cwd)
  spinner.stop()

  if (project.type === 'unknown') {
    logger.error('No React Native or Expo project detected.')
    process.exit(1)
  }

  // 2. Check installed @rootnative/core version
  const installed = getInstalledPackageInfo(cwd, '@rootnative/core')

  if (!installed) {
    logger.error(
      '@rootnative/core is not installed. Run "rootnative init" first.',
    )
    process.exit(1)
  }

  // 3. Fetch latest from npm
  const fetchSpinner = createSpinner('Checking for updates...')
  fetchSpinner.start()
  const latest = await fetchLatestFromNpm('@rootnative/core')
  fetchSpinner.succeed('Checked npm registry')

  // 4. Compare versions
  if (installed.version === latest.version) {
    logger.break()
    logger.success(
      `Already on the latest version ${chalk.bold(`v${installed.version}`)}`,
    )
    logger.break()

    if (options.all) {
      logger.info('Updating installed components...')
      await updateCommand([], cwd, { all: true, dryRun: false })
    }

    return
  }

  logger.break()
  logger.info(`Installed: ${chalk.bold(`v${installed.version}`)}`)
  logger.info(`Latest:    ${chalk.bold(chalk.green(`v${latest.version}`))}`)

  // 5. Diff peer dependencies
  const diff = diffPeerDeps(installed.peerDependencies, latest.peerDependencies)

  if (hasDiffChanges(diff)) {
    logger.break()
    console.log(chalk.bold('Peer dependency changes:'))
    logger.break()

    for (const [pkg, range] of Object.entries(diff.added)) {
      console.log(`  ${chalk.green('+')} ${pkg} ${chalk.dim(range)}`)
    }

    for (const [pkg, { from, to }] of Object.entries(diff.changed)) {
      console.log(
        `  ${chalk.yellow('~')} ${pkg} ${chalk.dim(from)} → ${chalk.dim(to)}`,
      )
    }

    for (const pkg of diff.removed) {
      console.log(`  ${chalk.red('-')} ${pkg}`)
    }
  }

  // 6. Determine what needs to be installed
  const projectDeps = getProjectDeps(cwd)
  const toInstall: string[] = ['@rootnative/core']
  const optionalMeta = latest.peerDependenciesMeta ?? {}

  // Add new required peer deps that aren't in the project
  for (const [pkg] of Object.entries(diff.added)) {
    const isOptional = optionalMeta[pkg]?.optional === true
    if (!isOptional && !projectDeps[pkg]) {
      toInstall.push(pkg)
    }
  }

  // Also check all latest peer deps — user might be missing some
  const latestPeers = latest.peerDependencies ?? {}
  for (const [pkg] of Object.entries(latestPeers)) {
    const isOptional = optionalMeta[pkg]?.optional === true
    if (!isOptional && !projectDeps[pkg] && !toInstall.includes(pkg)) {
      toInstall.push(pkg)
    }
  }

  // 7. Show plan and prompt
  logger.break()
  console.log(chalk.bold('Upgrade plan:'))
  logger.break()
  console.log(
    `  ${chalk.cyan('upgrade')} @rootnative/core ${chalk.dim(`v${installed.version}`)} → ${chalk.green(`v${latest.version}`)}`,
  )

  const newDeps = toInstall.filter((p) => p !== '@rootnative/core')
  if (newDeps.length > 0) {
    for (const pkg of newDeps) {
      console.log(
        `  ${chalk.green('install')} ${pkg} ${chalk.dim('(new peer dependency)')}`,
      )
    }
  }

  // Show optional deps that aren't installed
  const missingOptional: string[] = []
  for (const [pkg] of Object.entries(latestPeers)) {
    const isOptional = optionalMeta[pkg]?.optional === true
    if (isOptional && !projectDeps[pkg]) {
      missingOptional.push(pkg)
    }
  }

  if (missingOptional.length > 0) {
    logger.break()
    logger.info(
      `Optional peer dependencies not installed: ${chalk.dim(missingOptional.join(', '))}`,
    )
  }

  logger.break()

  // 8. Confirm
  if (!options.yes) {
    const { proceed } = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with upgrade?',
      initial: true,
    })

    if (!proceed) {
      logger.info('Upgrade cancelled.')
      return
    }
  }

  // 9. Run install
  const pm = options.packageManager ?? project.packageManager
  const command = getInstallCommand(pm, toInstall)
  const [cmd, ...args] = command.split(' ')

  logger.break()
  logger.info('Upgrading @rootnative/core...')
  logger.break()

  try {
    await execa(cmd, args, { cwd, stdio: 'inherit' })
    logger.break()
    logger.success('Upgrade complete')
  } catch {
    logger.break()
    logger.error('Failed to upgrade')
    logger.error(`Run manually: ${chalk.bold(command)}`)
    process.exit(1)
  }

  // 10. Verify new version
  const updated = getInstalledPackageInfo(cwd, '@rootnative/core')

  logger.break()
  if (updated) {
    logger.success(
      `@rootnative/core upgraded to ${chalk.bold(`v${updated.version}`)}`,
    )
  }

  if (newDeps.length > 0) {
    logger.success(`Installed ${newDeps.length} new peer dependency(s)`)
  }

  if (diff.removed.length > 0) {
    logger.break()
    logger.info(
      `The following peer dependencies are no longer required and can be removed:`,
    )
    for (const pkg of diff.removed) {
      logger.info(`  ${pkg}`)
    }
  }

  logger.break()

  // 11. Optionally update all installed component files
  if (options.all) {
    logger.info('Updating installed components...')
    await updateCommand([], cwd, { all: true, dryRun: false })
  }
}
