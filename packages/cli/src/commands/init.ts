import chalk from 'chalk'
import { execa } from 'execa'
import prompts from 'prompts'
import { configExists, DEFAULT_CONFIG, writeConfig } from '../lib/config'
import { detectProject, getInstallCommand } from '../lib/detector'
import { ensureLlmDocsPointer } from '../lib/llm-docs'
import { createSpinner, logger } from '../lib/logger'
import type { RootNativeConfig, PackageManager } from '../lib/types'

export interface InitOptions {
  yes?: boolean
  componentsAlias?: string
  libAlias?: string
  packageManager?: PackageManager
}

export async function initCommand(
  cwd: string,
  options: InitOptions = {},
): Promise<void> {
  logger.break()

  // Check if already initialized
  if (await configExists(cwd)) {
    if (options.yes) {
      logger.info('Overwriting existing rootnative.json')
    } else {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'rootnative.json already exists. Overwrite?',
        initial: false,
      })

      if (!overwrite) {
        logger.info('Init cancelled.')
        return
      }
    }
  }

  // Detect project
  const spinner = createSpinner('Detecting project...')
  spinner.start()
  const project = await detectProject(cwd)
  spinner.stop()

  if (project.type === 'unknown') {
    logger.error('No React Native or Expo project detected.')
    logger.info(
      'Make sure you are in a project with react-native or expo in package.json.',
    )
    process.exit(1)
  }

  logger.info(
    `Detected ${chalk.bold(project.type)} project using ${chalk.bold(project.packageManager)}`,
  )

  if (!project.hasTypeScript) {
    logger.warn(
      'TypeScript not detected. RootNative components use TypeScript.',
    )
  }

  // Determine default alias based on detected tsconfig paths
  let defaultComponentsAlias = DEFAULT_CONFIG.aliases.components
  let defaultLibAlias = DEFAULT_CONFIG.aliases.lib

  if (project.aliases?.['@']) {
    // User has @/* → src/* configured
    defaultComponentsAlias = '@/components/ui'
    defaultLibAlias = '@/lib'
  } else if (project.aliases?.['~']) {
    // User has ~/* → src/* configured
    defaultComponentsAlias = '~/components/ui'
    defaultLibAlias = '~/lib'
  }

  // Resolve aliases — use explicit flags, then defaults, skip prompts with --yes
  let componentsAlias: string
  let libAlias: string

  if (options.yes) {
    componentsAlias = options.componentsAlias ?? defaultComponentsAlias
    libAlias = options.libAlias ?? defaultLibAlias
  } else {
    const answers = await prompts([
      {
        type: 'text',
        name: 'componentsAlias',
        message: 'Where should components be installed?',
        initial: options.componentsAlias ?? defaultComponentsAlias,
      },
      {
        type: 'text',
        name: 'libAlias',
        message: 'Where should utility files be placed?',
        initial: options.libAlias ?? defaultLibAlias,
      },
    ])

    if (!answers.componentsAlias || !answers.libAlias) {
      logger.info('Init cancelled.')
      return
    }

    componentsAlias = answers.componentsAlias
    libAlias = answers.libAlias
  }

  // Write config
  const config: RootNativeConfig = {
    ...DEFAULT_CONFIG,
    aliases: {
      components: componentsAlias,
      lib: libAlias,
    },
  }

  await writeConfig(cwd, config)
  logger.success('Created rootnative.json')

  // Point AI agents at the LLM docs via CLAUDE.md
  let addLlmDocs = options.yes

  if (!options.yes) {
    const answer = await prompts({
      type: 'confirm',
      name: 'addLlmDocs',
      message: 'Add RootNative LLM docs pointer to CLAUDE.md (for AI agents)?',
      initial: true,
    })
    addLlmDocs = answer.addLlmDocs
  }

  if (addLlmDocs) {
    const result = await ensureLlmDocsPointer(cwd)
    if (result === 'created') {
      logger.success('Created CLAUDE.md with LLM docs pointer')
    } else if (result === 'appended') {
      logger.success('Added LLM docs pointer to CLAUDE.md')
    } else {
      logger.info('CLAUDE.md already points to the RootNative LLM docs')
    }
  }

  // Install @rootnative/core
  let installCore = options.yes

  if (!options.yes) {
    const answer = await prompts({
      type: 'confirm',
      name: 'installCore',
      message: 'Install @rootnative/core?',
      initial: true,
    })
    installCore = answer.installCore
  }

  if (installCore) {
    const pm = options.packageManager ?? project.packageManager
    const command = getInstallCommand(pm, ['@rootnative/core'])
    const [cmd, ...args] = command.split(' ')

    logger.break()
    logger.info('Installing @rootnative/core...')
    logger.break()

    try {
      await execa(cmd, args, { cwd, stdio: 'inherit' })
      logger.break()
      logger.success('Installed @rootnative/core')
    } catch {
      logger.break()
      logger.error('Failed to install @rootnative/core')
      logger.info(`Run manually: ${chalk.bold(command)}`)
    }
  }

  logger.break()
  logger.success('Project initialized!')
  logger.info(
    `Add components with: ${chalk.bold('npx rootnative add <component>')}`,
  )
  logger.break()
}
