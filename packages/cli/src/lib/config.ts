import path from 'node:path'
import fs from 'fs-extra'
import type { RootNativeConfig } from './types'

const CONFIG_FILE = 'rootnative.json'

export const DEFAULT_CONFIG: RootNativeConfig = {
  $schema: 'https://rootnative.github.io/ui/schema.json',
  aliases: {
    components: '@/components/ui',
    lib: '@/lib',
  },
  registryUrl: 'https://raw.githubusercontent.com/rootnative/ui',
  registryVersion: 'main',
}

export function getConfigPath(cwd: string): string {
  return path.resolve(cwd, CONFIG_FILE)
}

export async function configExists(cwd: string): Promise<boolean> {
  return fs.pathExists(getConfigPath(cwd))
}

export async function readConfig(cwd: string): Promise<RootNativeConfig> {
  const configPath = getConfigPath(cwd)
  const exists = await fs.pathExists(configPath)

  if (!exists) {
    throw new Error('rootnative.json not found. Run "rootnative init" first.')
  }

  const raw = await fs.readJSON(configPath)
  return raw as RootNativeConfig
}

export async function writeConfig(
  cwd: string,
  config: RootNativeConfig,
): Promise<void> {
  const configPath = getConfigPath(cwd)
  await fs.writeJSON(configPath, config, { spaces: 2 })
}

export function resolveAliasPath(alias: string, cwd: string): string {
  // Convert alias like @/components/ui to actual filesystem path
  // Assumes @/ maps to src/ (most common convention)
  const resolved = alias.replace(/^@\//, 'src/')
  return path.resolve(cwd, resolved)
}
