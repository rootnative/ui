export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

export function isValidPackageManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value)
}

export type ProjectType = 'expo' | 'react-native' | 'unknown'

export interface ProjectInfo {
  type: ProjectType
  packageManager: PackageManager
  hasTypeScript: boolean
  srcDir: string | null
  aliases: Record<string, string> | null
}

export interface RootNativeConfig {
  $schema?: string
  aliases: {
    components: string
    lib: string
  }
  registryUrl: string
  registryVersion: string
}

export interface RegistryComponentSummary {
  name: string
  description: string
}

export interface RegistryIndex {
  version: string
  components: RegistryComponentSummary[]
}

export interface ComponentRegistryEntry {
  name: string
  description: string
  files: string[]
  utils: string[]
  componentDependencies: string[]
  dependencies: Record<string, string>
  optionalDependencies: Record<string, string>
}

export interface UtilEntry {
  file: string
  exports: string[]
  /** Type-only exports — emitted as `export type { ... }` from the barrel. */
  typeExports?: string[]
  dependencies: Record<string, string>
}

export type UtilsRegistry = Record<string, UtilEntry>

export interface ResolvedComponent {
  entry: ComponentRegistryEntry
  isDirectRequest: boolean
}

export interface ResolutionResult {
  components: ResolvedComponent[]
  utils: string[]
  npmDependencies: Record<string, string>
  optionalNpmDependencies: Record<string, string>
}
