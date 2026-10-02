import { warnOnce } from './warnOnce'

/**
 * The one size vocabulary of the library. The names are the MD3 size names,
 * and `ButtonGroup`, `FAB`, `Badge` and `AppBar` used them first. `Button`,
 * `IconButton` and `Avatar` accept the same names, and keep their old names
 * as aliases for one release.
 */
export type ExpressiveSize =
  | 'extraSmall'
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'

/** The old `Button` and `IconButton` names. */
export type LegacyShortSize = 'xs' | 's' | 'm' | 'l' | 'xl'

/** The old `Avatar` names for the two outer sizes. */
export type LegacyAvatarSize = 'xSmall' | 'xLarge'

const ALIASES: Record<LegacyShortSize | LegacyAvatarSize, ExpressiveSize> = {
  xs: 'extraSmall',
  s: 'small',
  m: 'medium',
  l: 'large',
  xl: 'extraLarge',
  xSmall: 'extraSmall',
  xLarge: 'extraLarge',
}

function isAlias(size: string): size is LegacyShortSize | LegacyAvatarSize {
  return Object.prototype.hasOwnProperty.call(ALIASES, size)
}

/** Maps an old size name to the current one. No warning. */
export function canonicalSize(
  size: ExpressiveSize | LegacyShortSize | LegacyAvatarSize,
): ExpressiveSize {
  return isAlias(size) ? ALIASES[size] : size
}

/**
 * Maps an old size name to the current one, and warns once per component and
 * old name in development. Call it once at the top of the component, so the
 * style helpers receive the current name.
 */
export function resolveSize(
  size: ExpressiveSize | LegacyShortSize | LegacyAvatarSize,
  component: string,
): ExpressiveSize {
  if (!isAlias(size)) return size
  const current = ALIASES[size]
  warnOnce(
    `${component}-size-alias-${size}`,
    `[@rootnative/components] <${component} size="${size}"> uses an old ` +
      `size name. Use size="${current}". The old names are removed in the ` +
      'next release.',
  )
  return current
}
