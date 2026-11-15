import type {
  MaterialTheme,
  Typography,
  TypographyToken,
} from '@rootnative/core'
import { warnOnce } from './warnOnce'

const FALLBACK: TypographyToken = {
  fontFamily: 'System',
  fontSize: 14,
  fontWeight: '400',
  lineHeight: 20,
  letterSpacing: 0,
}

/**
 * The token of an MD3 typography role, for a component that reads a field of
 * it (`.lineHeight`, `.fontFamily`).
 *
 * A theme with its own role names has no such token. The field read then
 * throws `Cannot read property 'lineHeight' of undefined`, which doesn't name
 * the theme as the cause. So a missing role gives a warning in development
 * and a plain token, and the component still renders.
 */
export function typographyRole(
  theme: MaterialTheme,
  role: keyof Typography,
): TypographyToken {
  const token = (theme.typography as Partial<Typography>)[role]
  if (token) return token

  warnOnce(
    'theme-without-md3-roles',
    `The theme has no MD3 typography role "${role}". The components of this ` +
      "library read the MD3 color and typography roles, so they don't draw " +
      'correctly with this theme. Keep the MD3 role names in the theme, and ' +
      'add your own tokens beside them. See ' +
      'https://rootnative.github.io/ui/theming#custom-design-systems',
  )
  return FALLBACK
}
