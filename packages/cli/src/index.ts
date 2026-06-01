import { Command } from 'commander'
import { addCommand } from './commands/add'
import { createCommand } from './commands/create'
import { doctorCommand } from './commands/doctor'
import { initCommand } from './commands/init'
import { listCommand } from './commands/list'
import { updateCommand } from './commands/update'
import { upgradeCommand } from './commands/upgrade'
import { logger } from './lib/logger'
import { isValidPackageManager, PACKAGE_MANAGERS } from './lib/types'

const program = new Command()

program
  .name('rootnative')
  .description('Add RootNative UI components to your React Native project')
  .version('0.1.0')

program
  .command('create')
  .description('Create a new project with RootNative UI pre-configured')
  .argument('[name]', 'Project name')
  .option('-y, --yes', 'Skip prompts and use defaults', false)
  .option('-t, --template <name>', 'Template to use (blank, with-router)')
  .option(
    '--package-manager <pm>',
    `Package manager to use (${PACKAGE_MANAGERS.join(', ')})`,
  )
  .action(async (name: string | undefined, options) => {
    try {
      if (options.packageManager) {
        validatePackageManager(options.packageManager)
      }
      await createCommand(name, {
        yes: options.yes,
        template: options.template,
        packageManager: options.packageManager,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('init')
  .description('Initialize your project for RootNative UI')
  .option('-y, --yes', 'Skip prompts and use defaults', false)
  .option('--components-alias <alias>', 'Components install path alias')
  .option('--lib-alias <alias>', 'Utility files path alias')
  .option(
    '--package-manager <pm>',
    `Package manager to use (${PACKAGE_MANAGERS.join(', ')})`,
  )
  .action(async (options) => {
    try {
      if (options.packageManager) {
        validatePackageManager(options.packageManager)
      }
      await initCommand(process.cwd(), {
        yes: options.yes,
        componentsAlias: options.componentsAlias,
        libAlias: options.libAlias,
        packageManager: options.packageManager,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('add')
  .description('Add components to your project')
  .argument('<components...>', 'Component names to add')
  .option('-f, --force', 'Overwrite existing components', false)
  .option(
    '-d, --dry-run',
    'Show what would be installed without making changes',
    false,
  )
  .option(
    '--package-manager <pm>',
    `Package manager to use (${PACKAGE_MANAGERS.join(', ')})`,
  )
  .action(async (components: string[], options) => {
    try {
      if (options.packageManager) {
        validatePackageManager(options.packageManager)
      }
      await addCommand(components, process.cwd(), {
        force: options.force,
        dryRun: options.dryRun,
        packageManager: options.packageManager,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('update')
  .description('Update installed components to the latest version')
  .argument('[components...]', 'Component names to update')
  .option('-a, --all', 'Update all installed components', false)
  .option('-d, --dry-run', 'Show diff without applying changes', false)
  .action(async (components: string[], options) => {
    try {
      await updateCommand(components, process.cwd(), {
        all: options.all,
        dryRun: options.dryRun,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('list')
  .description('List available components')
  .action(async () => {
    try {
      await listCommand(process.cwd())
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('doctor')
  .description('Check your project for issues')
  .action(async () => {
    try {
      await doctorCommand(process.cwd())
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('upgrade')
  .description('Upgrade @rootnative/core and install new peer dependencies')
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('-a, --all', 'Also update all installed component files', false)
  .option(
    '--package-manager <pm>',
    `Package manager to use (${PACKAGE_MANAGERS.join(', ')})`,
  )
  .action(async (options) => {
    try {
      if (options.packageManager) {
        validatePackageManager(options.packageManager)
      }
      await upgradeCommand(process.cwd(), {
        yes: options.yes,
        all: options.all,
        packageManager: options.packageManager,
      })
    } catch (error) {
      handleError(error)
    }
  })

function validatePackageManager(value: string): void {
  if (!isValidPackageManager(value)) {
    logger.error(
      `Unknown package manager "${value}". Available: ${PACKAGE_MANAGERS.join(', ')}`,
    )
    process.exit(1)
  }
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    logger.error(error.message)
  } else {
    logger.error('An unexpected error occurred.')
  }
  process.exit(1)
}

program.parse()
