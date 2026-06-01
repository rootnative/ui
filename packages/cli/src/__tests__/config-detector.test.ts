import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  readConfig,
  writeConfig,
  configExists,
  resolveAliasPath,
  DEFAULT_CONFIG,
} from '../lib/config'
import { detectProject, getInstallCommand } from '../lib/detector'

// Create a temp directory for each test
let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rootnative-test-'))
})

afterEach(async () => {
  await fs.remove(tmpDir)
})

describe('config', () => {
  describe('configExists', () => {
    it('returns false when no config file', async () => {
      expect(await configExists(tmpDir)).toBe(false)
    })

    it('returns true when config file exists', async () => {
      await fs.writeJSON(path.join(tmpDir, 'rootnative.json'), DEFAULT_CONFIG)
      expect(await configExists(tmpDir)).toBe(true)
    })
  })

  describe('writeConfig / readConfig', () => {
    it('writes and reads config correctly', async () => {
      await writeConfig(tmpDir, DEFAULT_CONFIG)

      const config = await readConfig(tmpDir)
      expect(config.aliases.components).toBe('@/components/ui')
      expect(config.aliases.lib).toBe('@/lib')
      expect(config.registryUrl).toBe(
        'https://raw.githubusercontent.com/rootnative/ui',
      )
    })

    it('throws when config does not exist', async () => {
      await expect(readConfig(tmpDir)).rejects.toThrow(
        'rootnative.json not found',
      )
    })
  })

  describe('resolveAliasPath', () => {
    it('resolves @/ alias to src/', () => {
      const result = resolveAliasPath('@/components/ui', '/project')
      expect(result).toBe(path.resolve('/project', 'src/components/ui'))
    })

    it('resolves ~/ alias as literal path', () => {
      const result = resolveAliasPath('~/components/ui', '/project')
      // ~/ doesn't get special treatment, resolves as-is
      expect(result).toContain('components/ui')
    })
  })
})

describe('detector', () => {
  describe('detectProject', () => {
    it('detects expo project', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0', 'react-native': '0.81.5' },
      })

      const info = await detectProject(tmpDir)
      expect(info.type).toBe('expo')
    })

    it('detects bare react-native project', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { 'react-native': '0.81.5' },
      })

      const info = await detectProject(tmpDir)
      expect(info.type).toBe('react-native')
    })

    it('returns unknown for non-RN project', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { express: '^4.0.0' },
      })

      const info = await detectProject(tmpDir)
      expect(info.type).toBe('unknown')
    })

    it('returns unknown when no package.json', async () => {
      const info = await detectProject(tmpDir)
      expect(info.type).toBe('unknown')
    })

    it('detects pnpm package manager', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })
      await fs.writeFile(path.join(tmpDir, 'pnpm-lock.yaml'), '')

      const info = await detectProject(tmpDir)
      expect(info.packageManager).toBe('pnpm')
    })

    it('detects yarn package manager', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })
      await fs.writeFile(path.join(tmpDir, 'yarn.lock'), '')

      const info = await detectProject(tmpDir)
      expect(info.packageManager).toBe('yarn')
    })

    it('detects bun package manager', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })
      await fs.writeFile(path.join(tmpDir, 'bun.lockb'), '')

      const info = await detectProject(tmpDir)
      expect(info.packageManager).toBe('bun')
    })

    it('defaults to npm when no lockfile', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })

      const info = await detectProject(tmpDir)
      expect(info.packageManager).toBe('npm')
    })

    it('detects TypeScript', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })
      await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {},
      })

      const info = await detectProject(tmpDir)
      expect(info.hasTypeScript).toBe(true)
    })

    it('detects no TypeScript', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })

      const info = await detectProject(tmpDir)
      expect(info.hasTypeScript).toBe(false)
    })

    it('detects tsconfig path aliases', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })
      await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
          paths: { '@/*': ['./src/*'] },
        },
      })

      const info = await detectProject(tmpDir)
      expect(info.aliases).toEqual({ '@': 'src' })
    })

    it('detects src directory', async () => {
      await fs.writeJSON(path.join(tmpDir, 'package.json'), {
        dependencies: { expo: '~54.0.0' },
      })
      await fs.mkdir(path.join(tmpDir, 'src'))

      const info = await detectProject(tmpDir)
      expect(info.srcDir).toBe('src')
    })
  })

  describe('getInstallCommand', () => {
    it('generates npm install command', () => {
      expect(getInstallCommand('npm', ['@rootnative/core'])).toBe(
        'npm install @rootnative/core',
      )
    })

    it('generates pnpm add command', () => {
      expect(getInstallCommand('pnpm', ['@rootnative/core'])).toBe(
        'pnpm add @rootnative/core',
      )
    })

    it('generates yarn add command', () => {
      expect(getInstallCommand('yarn', ['@rootnative/core'])).toBe(
        'yarn add @rootnative/core',
      )
    })

    it('generates bun add command', () => {
      expect(getInstallCommand('bun', ['@rootnative/core'])).toBe(
        'bun add @rootnative/core',
      )
    })

    it('joins multiple packages', () => {
      expect(
        getInstallCommand('npm', [
          '@rootnative/core',
          'react-native-safe-area-context',
        ]),
      ).toBe('npm install @rootnative/core react-native-safe-area-context')
    })
  })
})
