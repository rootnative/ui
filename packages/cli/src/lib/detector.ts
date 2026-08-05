import path from 'node:path'
import fs from 'fs-extra'
import { stripJsonComments } from './tsconfig-paths'
import type { PackageManager, ProjectInfo, ProjectType } from './types'

async function detectProjectType(cwd: string): Promise<ProjectType> {
  const pkgPath = path.resolve(cwd, 'package.json')
  const hasPackageJson = await fs.pathExists(pkgPath)

  if (!hasPackageJson) {
    return 'unknown'
  }

  const pkg = await fs.readJSON(pkgPath)
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  }

  if (allDeps.expo) {
    return 'expo'
  }

  if (allDeps['react-native']) {
    return 'react-native'
  }

  return 'unknown'
}

async function detectPackageManager(cwd: string): Promise<PackageManager> {
  const lockFiles: [string, PackageManager][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['bun.lock', 'bun'],
    ['package-lock.json', 'npm'],
  ]

  for (const [file, manager] of lockFiles) {
    if (await fs.pathExists(path.resolve(cwd, file))) {
      return manager
    }
  }

  return 'npm'
}

async function detectTypeScript(cwd: string): Promise<boolean> {
  return fs.pathExists(path.resolve(cwd, 'tsconfig.json'))
}

async function detectSrcDir(cwd: string): Promise<string | null> {
  const candidates = ['src', 'app']

  for (const dir of candidates) {
    const dirPath = path.resolve(cwd, dir)
    if (await fs.pathExists(dirPath)) {
      return dir
    }
  }

  return null
}

async function detectAliases(
  cwd: string,
): Promise<Record<string, string> | null> {
  const tsconfigPath = path.resolve(cwd, 'tsconfig.json')

  if (!(await fs.pathExists(tsconfigPath))) {
    return null
  }

  try {
    const raw = await fs.readFile(tsconfigPath, 'utf-8')
    // Strip comments (tsconfig allows them). Shared with the patcher in
    // `tsconfig-paths.ts` — it has to be string-aware, or the `/*` inside a
    // glob like `"**/*.ts"` reads as a comment opener.
    const tsconfig = JSON.parse(stripJsonComments(raw))
    const paths = tsconfig.compilerOptions?.paths

    if (!paths) {
      return null
    }

    // Convert tsconfig paths to alias map
    // e.g. { "@/*": ["./src/*"] } → { "@": "src" }
    const aliases: Record<string, string> = {}

    for (const [alias, targets] of Object.entries(paths)) {
      if (!Array.isArray(targets) || targets.length === 0) continue

      const cleanAlias = alias.replace(/\/\*$/, '')
      const cleanTarget = (targets[0] as string)
        .replace(/\/\*$/, '')
        .replace(/^\.\//, '')

      aliases[cleanAlias] = cleanTarget
    }

    return Object.keys(aliases).length > 0 ? aliases : null
  } catch {
    return null
  }
}

export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const [type, packageManager, hasTypeScript, srcDir, aliases] =
    await Promise.all([
      detectProjectType(cwd),
      detectPackageManager(cwd),
      detectTypeScript(cwd),
      detectSrcDir(cwd),
      detectAliases(cwd),
    ])

  return { type, packageManager, hasTypeScript, srcDir, aliases }
}

export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
): string {
  const pkgs = packages.join(' ')

  switch (pm) {
    case 'pnpm':
      return `pnpm add ${pkgs}`
    case 'yarn':
      return `yarn add ${pkgs}`
    case 'bun':
      return `bun add ${pkgs}`
    default:
      return `npm install ${pkgs}`
  }
}
