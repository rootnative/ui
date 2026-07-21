import path from 'node:path'
import chalk from 'chalk'
import fs from 'fs-extra'
import { configExists, readConfig, resolveAliasPath } from '../lib/config'
import { detectProject } from '../lib/detector'
import { logger } from '../lib/logger'

type Status = 'pass' | 'warn' | 'fail'

function logCheck(status: Status, message: string): void {
  const icon =
    status === 'pass'
      ? chalk.green('[pass]')
      : status === 'warn'
        ? chalk.yellow('[warn]')
        : chalk.red('[fail]')

  console.log(`  ${icon} ${message}`)
}

export async function doctorCommand(cwd: string): Promise<void> {
  logger.break()
  console.log(chalk.bold('RootNative Doctor'))
  logger.break()

  let issues = 0

  // 1. Check rootnative.json
  if (await configExists(cwd)) {
    logCheck('pass', 'rootnative.json found')
  } else {
    logCheck('fail', 'rootnative.json not found. Run "rootnative init" first.')
    issues++
    logger.break()
    logger.error(`${issues} issue(s) found.`)
    return
  }

  const config = await readConfig(cwd)

  // 2. Check project type
  const project = await detectProject(cwd)

  if (project.type !== 'unknown') {
    logCheck(
      'pass',
      `${project.type} project detected (${project.packageManager})`,
    )
  } else {
    logCheck('fail', 'Not a React Native or Expo project')
    issues++
  }

  // 3. Check React Native version
  const pkgPath = path.resolve(cwd, 'package.json')

  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJSON(pkgPath)
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }
    const rnVersion = allDeps['react-native']

    if (rnVersion) {
      logCheck('pass', `react-native: ${rnVersion}`)
    } else {
      logCheck('fail', 'react-native not found in dependencies')
      issues++
    }
  }

  // 4. Check @rootnative/core
  const corePkgPath = path.resolve(
    cwd,
    'node_modules',
    '@rootnative',
    'core',
    'package.json',
  )

  if (await fs.pathExists(corePkgPath)) {
    const corePkg = await fs.readJSON(corePkgPath)
    logCheck('pass', `@rootnative/core@${corePkg.version} installed`)
  } else {
    logCheck(
      'fail',
      '@rootnative/core not installed. Run "rootnative init" to install it.',
    )
    issues++
  }

  // 5. Check TypeScript
  if (project.hasTypeScript) {
    logCheck('pass', 'TypeScript configured')
  } else {
    logCheck(
      'warn',
      'TypeScript not detected. RootNative components use TypeScript.',
    )
  }

  // 6. Check installed components integrity
  const componentsDir = resolveAliasPath(config.aliases.components, cwd)

  if (await fs.pathExists(componentsDir)) {
    const dirs = await fs.readdir(componentsDir)
    const componentDirs = []

    for (const dir of dirs) {
      const fullPath = path.join(componentsDir, dir)
      const stat = await fs.stat(fullPath)
      if (stat.isDirectory()) {
        componentDirs.push(dir)
      }
    }

    if (componentDirs.length > 0) {
      // Check each component has an index.ts
      let integrityOk = true

      for (const dir of componentDirs) {
        const indexPath = path.join(componentsDir, dir, 'index.ts')
        if (!(await fs.pathExists(indexPath))) {
          logCheck('warn', `Component ${dir} is missing index.ts`)
          integrityOk = false
        }
      }

      if (integrityOk) {
        logCheck(
          'pass',
          `${componentDirs.length} component(s) installed, all files present`,
        )
      }
    } else {
      logCheck(
        'warn',
        'No components installed yet. Run "rootnative add <component>".',
      )
    }
  } else {
    logCheck(
      'warn',
      `Components directory not found at ${config.aliases.components}`,
    )
  }

  // 7. Check utils barrel
  const libDir = resolveAliasPath(config.aliases.lib, cwd)
  const barrelPath = path.join(libDir, 'rootnative-utils.ts')

  if (await fs.pathExists(barrelPath)) {
    logCheck('pass', 'Utility barrel file present')
  } else {
    if (await fs.pathExists(componentsDir)) {
      const dirs = await fs.readdir(componentsDir)
      if (dirs.length > 0) {
        logCheck('warn', 'Utility barrel file (rootnative-utils.ts) missing')
      }
    }
  }

  // 8. Check required animation peer deps. `@rootnative/inertia` is the
  // animation layer every interactive component imports; it in turn requires
  // reanimated + worklets, so a missing install breaks all animated
  // components at require time.
  const nodeModules = path.resolve(cwd, 'node_modules')

  const inertiaPkgPath = path.join(
    nodeModules,
    '@rootnative',
    'inertia',
    'package.json',
  )
  if (await fs.pathExists(inertiaPkgPath)) {
    const inertiaPkg = await fs.readJSON(inertiaPkgPath)
    logCheck('pass', `@rootnative/inertia@${inertiaPkg.version} installed`)
  } else {
    logCheck(
      'fail',
      '@rootnative/inertia not installed (required by all animated components). Run "rootnative upgrade" or install it with react-native-reanimated and react-native-worklets.',
    )
    issues++
  }

  // 9. Check optional peer deps
  const safeAreaInstalled = await fs.pathExists(
    path.join(nodeModules, 'react-native-safe-area-context'),
  )
  if (safeAreaInstalled) {
    logCheck('pass', 'react-native-safe-area-context installed')
  } else {
    logCheck(
      'warn',
      'react-native-safe-area-context not installed (needed by: appbar, layout)',
    )
  }

  const vectorIconsInstalled = await fs.pathExists(
    path.join(nodeModules, '@expo', 'vector-icons'),
  )
  if (vectorIconsInstalled) {
    logCheck('pass', '@expo/vector-icons installed')
  } else {
    logCheck(
      'warn',
      '@expo/vector-icons not installed (needed for icon support)',
    )
  }

  logger.break()

  if (issues > 0) {
    logger.error(`${issues} issue(s) found.`)
  } else {
    logger.success('All checks passed!')
  }

  logger.break()
}
