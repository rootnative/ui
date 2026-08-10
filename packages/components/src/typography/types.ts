import type { Typography } from '@rootnative/core'

/**
 * Material Design 3 type scale role.
 *
 * Derived from the theme's `Typography` map, not hand-listed — the two used to
 * drift, and the 15 `*Emphasized` styles were unreachable through the `variant`
 * prop while existing at runtime. A token added to the theme is a variant here
 * with no second edit.
 */
export type TypographyVariant = keyof Typography
