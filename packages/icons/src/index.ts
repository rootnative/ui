export {
  createLucideResolver,
  type LucideIconComponent,
  type LucideResolverOptions,
} from './createLucideResolver'
export {
  createPhosphorResolver,
  type PhosphorIconComponent,
  type PhosphorIconWeight,
  type PhosphorResolverOptions,
} from './createPhosphorResolver'
export {
  createVectorIconsResolver,
  type VectorIconSet,
  type VectorIconsResolverOptions,
} from './createVectorIconsResolver'
export {
  withLegacyMdiFallback,
  type LegacyMdiTarget,
  type WithLegacyMdiFallbackOptions,
} from './withLegacyMdiFallback'
export { mdiToLucideAliases, mdiToPhosphorAliases } from './mdi-aliases'

// Re-export the resolver types from core for convenience so consumers
// only need to depend on @rootnative/icons when wiring up an adapter.
export type { IconResolver, IconRenderProps } from '@rootnative/core'
