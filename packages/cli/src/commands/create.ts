import path from 'node:path'
import chalk from 'chalk'
import { execa } from 'execa'
import fs from 'fs-extra'
import prompts from 'prompts'
import { DEFAULT_CONFIG } from '../lib/config'
import { createSpinner, logger } from '../lib/logger'
import type { PackageManager } from '../lib/types'

export interface CreateOptions {
  yes?: boolean
  template?: string
  packageManager?: PackageManager
}

type TemplateName = 'blank' | 'with-router'

interface TemplateSource {
  baseUrl: string
  pinnedVersion: string | null
}

const NPM_REGISTRY = 'https://registry.npmjs.org'
/**
 * Packages that version together with the release being scaffolded, so they can
 * all be pinned to the single `pinnedVersion` resolved from npm.
 *
 * `@rootnative/inertia` is deliberately NOT in this list. It versions on its own
 * ladder — `0.0.5` while core is on `0.0.0-alpha.4` — so pinning it to the core
 * version would ask npm for a release that does not exist. The templates pin it
 * directly instead, and that pin has to satisfy the `@rootnative/inertia` peer
 * range in `packages/components/package.json`. Bumping inertia is the multi-file
 * checklist in CLAUDE.md; the template pins are part of it.
 */
const ROOTNATIVE_PACKAGES = ['@rootnative/core', '@rootnative/components']

/**
 * Resolves the template source by checking the latest published npm version.
 * Fetches templates from the matching git tag to ensure template code is
 * compatible with the installed packages. Falls back to `main` if the tag
 * doesn't include templates yet or npm is unreachable.
 */
async function resolveTemplateSource(): Promise<TemplateSource> {
  const fallback: TemplateSource = {
    baseUrl: `${DEFAULT_CONFIG.registryUrl}/${DEFAULT_CONFIG.registryVersion}/templates`,
    pinnedVersion: null,
  }

  try {
    const res = await fetch(`${NPM_REGISTRY}/@rootnative/core`)
    if (!res.ok) return fallback

    const data = (await res.json()) as {
      'dist-tags'?: Record<string, string>
    }
    const version = data['dist-tags']?.latest
    if (!version) return fallback

    // Check if the release tag has templates
    const tagBaseUrl = `${DEFAULT_CONFIG.registryUrl}/v${version}/templates`
    const probe = await fetch(`${tagBaseUrl}/blank/package.json`)

    if (probe.ok) {
      return { baseUrl: tagBaseUrl, pinnedVersion: version }
    }

    // Tag exists but has no templates yet — use main with pinned version
    return { baseUrl: fallback.baseUrl, pinnedVersion: version }
  } catch {
    return fallback
  }
}

const TEMPLATE_CONFIGS: Record<
  TemplateName,
  { textFiles: string[]; dirs: string[] }
> = {
  blank: {
    textFiles: [
      'package.json',
      'app.json',
      'tsconfig.json',
      'babel.config.js',
      '.gitignore',
      'index.js',
      'App.tsx',
    ],
    dirs: ['assets'],
  },
  'with-router': {
    textFiles: [
      'package.json',
      'app.json',
      'tsconfig.json',
      'babel.config.js',
      '.gitignore',
      'app/_layout.tsx',
      'app/index.tsx',
    ],
    dirs: ['assets', 'app'],
  },
}

const TEMPLATE_BINARY_FILES = [
  'assets/icon.png',
  'assets/splash.png',
  'assets/adaptive-icon.png',
  'assets/favicon.png',
]

// Fetched with graceful skip — older release tags don't include these yet
const TEMPLATE_OPTIONAL_TEXT_FILES = ['CLAUDE.md', 'README.md']

function isValidTemplate(value: string): value is TemplateName {
  return value in TEMPLATE_CONFIGS
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface ProjectTarget {
  /** Slug used for the package name, the Expo slug and the scheme. */
  projectName: string
  /** Absolute directory the template is written into. */
  targetDir: string
  /** True when the template goes into the directory the user is already in. */
  useCurrentDir: boolean
}

export type ProjectTargetResult =
  | { ok: true; target: ProjectTarget }
  | { ok: false; reason: 'invalid-name' | 'invalid-folder-name' }

function isCurrentDirName(input: string): boolean {
  const trimmed = input.trim()
  return trimmed === '.' || trimmed === './' || trimmed === '.\\'
}

/**
 * Turns the user's name input into a target directory.
 *
 * `.` means "scaffold into the current folder and take the project name from
 * it" — the folder is kept, and only conflicting files are ever written.
 *
 * The guard on the last branch is load-bearing. `slugify` strips every
 * character that is not a letter or a digit, so `'.'` used to become `''` and
 * `path.resolve(cwd, '')` is the current directory. `create .` then took the
 * "directory already exists" path and ran `fs.remove` on the user's own working
 * directory, which deleted `.git` with it. An empty slug is now an error, and
 * anything that still resolves back to the current directory is treated as
 * current-directory mode instead of as a delete target.
 */
export function resolveProjectTarget(
  input: string,
  cwd: string,
): ProjectTargetResult {
  const currentDir = path.resolve(cwd)

  if (isCurrentDirName(input)) {
    const projectName = slugify(path.basename(currentDir))
    if (!projectName) return { ok: false, reason: 'invalid-folder-name' }
    return {
      ok: true,
      target: { projectName, targetDir: currentDir, useCurrentDir: true },
    }
  }

  const projectName = slugify(input)
  if (!projectName) return { ok: false, reason: 'invalid-name' }

  const targetDir = path.resolve(currentDir, projectName)
  return {
    ok: true,
    target: {
      projectName,
      targetDir,
      useCurrentDir: targetDir === currentDir,
    },
  }
}

/**
 * Every path the template can write, relative to the target directory.
 *
 * The optional and binary entries are included on purpose. They are fetched
 * with a graceful skip, so a listed file is not always written — over-warning
 * costs one confirmation, while under-warning overwrites a file the user keeps.
 */
export function templateFiles(templateName: TemplateName): string[] {
  return [
    ...TEMPLATE_CONFIGS[templateName].textFiles,
    ...TEMPLATE_OPTIONAL_TEXT_FILES,
    ...TEMPLATE_BINARY_FILES,
  ]
}

/** Returns the subset of `files` that already exists in `dir`. */
export async function findConflicts(
  dir: string,
  files: string[],
): Promise<string[]> {
  const conflicts: string[] = []
  for (const file of files) {
    if (await fs.pathExists(path.join(dir, file))) conflicts.push(file)
  }
  return conflicts
}

function toDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case 'pnpm':
      return 'pnpm install'
    case 'yarn':
      return 'yarn'
    case 'bun':
      return 'bun install'
    default:
      return 'npm install'
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

async function fetchTextOptional(url: string): Promise<string | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.text()
}

async function fetchBinary(url: string): Promise<Buffer | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return Buffer.from(await res.arrayBuffer())
}

export async function createCommand(
  name: string | undefined,
  options: CreateOptions = {},
): Promise<void> {
  logger.break()

  // --- Template ---
  let templateName: TemplateName

  if (options.template) {
    if (!isValidTemplate(options.template)) {
      logger.error(
        `Unknown template "${options.template}". Available: blank, with-router`,
      )
      process.exit(1)
    }
    templateName = options.template
  } else if (options.yes) {
    templateName = 'blank'
  } else {
    const { value } = await prompts({
      type: 'select',
      name: 'value',
      message: 'Template:',
      choices: [
        { title: 'Blank', description: 'Minimal setup', value: 'blank' },
        {
          title: 'With Router',
          description: 'Includes Expo Router',
          value: 'with-router',
        },
      ],
      initial: 0,
    })
    if (value === undefined) {
      logger.info('Create cancelled.')
      return
    }
    templateName = value
  }

  // --- Project name ---
  let nameInput: string

  if (name) {
    nameInput = name
  } else {
    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: 'Project name:',
      initial: 'my-app',
      validate: (v: string) =>
        v.trim().length > 0 || 'Project name is required',
    })
    if (!value) {
      logger.info('Create cancelled.')
      return
    }
    nameInput = value
  }

  // The prompted value goes through the same resolver as the argument, so `.`
  // typed at the prompt cannot reach a different code path than `create .`.
  const resolved = resolveProjectTarget(nameInput, process.cwd())

  if (!resolved.ok) {
    if (resolved.reason === 'invalid-folder-name') {
      logger.error(
        `Cannot make a project name from the folder ${chalk.bold(
          path.basename(path.resolve(process.cwd())),
        )}.`,
      )
      logger.info(
        `Give a name instead: ${chalk.bold('npx rootnative create my-app')}`,
      )
    } else {
      logger.error(`${chalk.bold(nameInput)} is not a usable project name.`)
      logger.info('Use letters and numbers, for example my-app.')
    }
    process.exit(1)
  }

  const { projectName, targetDir, useCurrentDir } = resolved.target

  // --- Display name ---
  let displayName: string

  if (options.yes) {
    displayName = toDisplayName(projectName)
  } else {
    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: 'Display name (shown on home screen):',
      initial: toDisplayName(projectName),
    })
    if (!value) {
      logger.info('Create cancelled.')
      return
    }
    displayName = value
  }

  // --- Package manager ---
  let packageManager: PackageManager

  if (options.packageManager) {
    packageManager = options.packageManager
  } else if (options.yes) {
    packageManager = 'npm'
  } else {
    const { value } = await prompts({
      type: 'select',
      name: 'value',
      message: 'Package manager:',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'yarn', value: 'yarn' },
        { title: 'pnpm', value: 'pnpm' },
        { title: 'bun', value: 'bun' },
      ],
      initial: 0,
    })
    if (value === undefined) {
      logger.info('Create cancelled.')
      return
    }
    packageManager = value
  }

  // --- Check target directory ---
  if (useCurrentDir) {
    // Never delete the current directory. Only the files the template writes
    // are at stake, so ask about those and leave everything else alone.
    const conflicts = await findConflicts(
      targetDir,
      templateFiles(templateName),
    )

    if (conflicts.length > 0) {
      logger.warn('These files in the current directory will be overwritten:')
      for (const file of conflicts) {
        logger.info(`  ${file}`)
      }
      logger.break()

      if (options.yes) {
        logger.error('Nothing was changed.')
        logger.info('Move or delete these files, then run create again.')
        process.exit(1)
      }

      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite them?',
        initial: false,
      })

      if (!overwrite) {
        logger.info('Create cancelled.')
        return
      }
    }
  } else if (await fs.pathExists(targetDir)) {
    if (options.yes) {
      logger.warn(`Directory ${chalk.bold(projectName)} already exists.`)
      process.exit(1)
    }

    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory ${chalk.bold(projectName)} already exists. Delete it and all of its contents?`,
      initial: false,
    })

    if (!overwrite) {
      logger.info('Create cancelled.')
      return
    }

    await fs.remove(targetDir)
  }

  // --- Resolve template source ---
  const templateConfig = TEMPLATE_CONFIGS[templateName]
  const { baseUrl, pinnedVersion } = await resolveTemplateSource()
  const templateBaseUrl = `${baseUrl}/${templateName}`
  const spinner = createSpinner('Creating project...')
  spinner.start()

  try {
    for (const dir of templateConfig.dirs) {
      await fs.ensureDir(path.join(targetDir, dir))
    }

    // Text files — fetch, apply substitutions, write
    for (const file of templateConfig.textFiles) {
      let content = await fetchText(`${templateBaseUrl}/${file}`)

      if (file === 'package.json') {
        const pkg = JSON.parse(content)
        pkg.name = projectName

        // Pin @rootnative/* versions to the published version
        if (pinnedVersion) {
          for (const pkgName of ROOTNATIVE_PACKAGES) {
            if (pkg.dependencies?.[pkgName]) {
              pkg.dependencies[pkgName] = pinnedVersion
            }
          }
        }

        content = JSON.stringify(pkg, null, 2) + '\n'
      }

      if (file === 'app.json') {
        const appJson = JSON.parse(content)
        appJson.expo.name = displayName
        appJson.expo.slug = projectName
        if (appJson.expo.scheme) {
          appJson.expo.scheme = projectName
        }
        content = JSON.stringify(appJson, null, 2) + '\n'
      }

      await fs.outputFile(path.join(targetDir, file), content)
    }

    // Optional text files — skip when the template source doesn't have them
    for (const file of TEMPLATE_OPTIONAL_TEXT_FILES) {
      const content = await fetchTextOptional(`${templateBaseUrl}/${file}`)
      if (content !== null) {
        await fs.outputFile(path.join(targetDir, file), content)
      }
    }

    // Binary files (assets) — optional, skip on failure
    for (const file of TEMPLATE_BINARY_FILES) {
      const buffer = await fetchBinary(`${templateBaseUrl}/${file}`)
      if (buffer) {
        await fs.outputFile(path.join(targetDir, file), buffer)
      }
    }

    spinner.succeed('Project created')
  } catch (error) {
    spinner.fail('Failed to create project')
    throw error
  }

  // --- Install dependencies ---
  let shouldInstall = options.yes

  if (!options.yes) {
    const { value } = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Install dependencies?',
      initial: true,
    })
    shouldInstall = value
  }

  if (shouldInstall) {
    const installCmd = getInstallCommand(packageManager)
    const [cmd, ...args] = installCmd.split(' ')

    logger.break()
    logger.info('Installing dependencies...')
    logger.break()

    try {
      await execa(cmd, args, { cwd: targetDir, stdio: 'inherit' })
      logger.break()
      logger.success('Dependencies installed')
    } catch {
      logger.break()
      logger.error('Failed to install dependencies')
      logger.info(
        `Run manually: ${chalk.bold(
          useCurrentDir ? installCmd : `cd ${projectName} && ${installCmd}`,
        )}`,
      )
    }
  }

  // --- Done ---
  logger.break()
  logger.success(`Project ${chalk.bold(displayName)} is ready!`)
  logger.break()
  logger.info('Next steps:')
  if (!useCurrentDir) {
    logger.info(`  cd ${projectName}`)
  }
  if (!shouldInstall) {
    logger.info(`  ${getInstallCommand(packageManager)}`)
  }
  logger.info('  npx expo start')
  logger.break()
}
