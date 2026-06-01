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

function isValidTemplate(value: string): value is TemplateName {
  return value in TEMPLATE_CONFIGS
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  let projectName: string

  if (name) {
    projectName = slugify(name)
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
    projectName = slugify(value)
  }

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
  const targetDir = path.resolve(process.cwd(), projectName)

  if (await fs.pathExists(targetDir)) {
    if (options.yes) {
      logger.warn(`Directory ${chalk.bold(projectName)} already exists.`)
      process.exit(1)
    }

    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory ${chalk.bold(projectName)} already exists. Overwrite?`,
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
        `Run manually: ${chalk.bold(`cd ${projectName} && ${installCmd}`)}`,
      )
    }
  }

  // --- Done ---
  logger.break()
  logger.success(`Project ${chalk.bold(displayName)} is ready!`)
  logger.break()
  logger.info('Next steps:')
  logger.info(`  cd ${projectName}`)
  if (!shouldInstall) {
    logger.info(`  ${getInstallCommand(packageManager)}`)
  }
  logger.info('  npx expo start')
  logger.break()
}
