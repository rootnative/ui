import { fetchComponentEntry, fetchUtilsRegistry } from './registry'
import type {
  ComponentRegistryEntry,
  RootNativeConfig,
  ResolutionResult,
  ResolvedComponent,
  UtilsRegistry,
} from './types'

export async function resolveComponents(
  config: RootNativeConfig,
  requestedNames: string[],
): Promise<ResolutionResult> {
  const resolved = new Map<string, ResolvedComponent>()
  const utilsRegistry = await fetchUtilsRegistry(config)

  // Recursively resolve all component dependencies
  async function resolve(name: string, isDirect: boolean): Promise<void> {
    if (resolved.has(name)) return

    const entry = await fetchComponentEntry(config, name)

    // Mark as resolved early to prevent cycles
    resolved.set(name, { entry, isDirectRequest: isDirect })

    // Resolve transitive component dependencies
    for (const dep of entry.componentDependencies) {
      await resolve(dep, false)
    }
  }

  for (const name of requestedNames) {
    await resolve(name, true)
  }

  return buildResult(resolved, utilsRegistry)
}

function buildResult(
  resolved: Map<string, ResolvedComponent>,
  utilsRegistry: UtilsRegistry,
): ResolutionResult {
  const components = Array.from(resolved.values())
  const utilSet = new Set<string>()
  const npmDeps: Record<string, string> = {}
  const optionalDeps: Record<string, string> = {}

  for (const { entry } of components) {
    // Collect utils
    for (const util of entry.utils) {
      utilSet.add(util)
    }

    // Collect npm dependencies
    for (const [pkg, version] of Object.entries(entry.dependencies)) {
      npmDeps[pkg] = version
    }

    // Collect optional npm dependencies
    for (const [pkg, version] of Object.entries(entry.optionalDependencies)) {
      optionalDeps[pkg] = version
    }
  }

  // Also collect npm dependencies from utils themselves
  for (const utilName of utilSet) {
    const utilEntry = utilsRegistry[utilName]
    if (utilEntry) {
      for (const [pkg, version] of Object.entries(utilEntry.dependencies)) {
        optionalDeps[pkg] = version
      }
    }
  }

  return {
    components,
    utils: Array.from(utilSet).sort(),
    npmDependencies: npmDeps,
    optionalNpmDependencies: optionalDeps,
  }
}

export function getComponentNames(result: ResolutionResult): string[] {
  return result.components.map((c) => c.entry.name)
}

export function getDependencyComponents(
  result: ResolutionResult,
): ComponentRegistryEntry[] {
  return result.components.filter((c) => !c.isDirectRequest).map((c) => c.entry)
}
