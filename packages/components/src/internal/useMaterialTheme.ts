import { lightTheme, useTheme } from '@rootnative/core'
import type { BaseTheme, MaterialTheme } from '@rootnative/core'
import { warnOnce } from './warnOnce'

const MD3_GROUPS = [
  'shape',
  'spacing',
  'stateLayer',
  'elevation',
  'motion',
] as const

const resolved = new WeakMap<BaseTheme, MaterialTheme>()

function isMaterialTheme(theme: BaseTheme): boolean {
  return (
    MD3_GROUPS.every((group) => {
      const value = theme[group]
      return typeof value === 'object' && value !== null
    }) &&
    typeof theme.colors?.primary === 'string' &&
    typeof theme.typography?.bodyLarge === 'object'
  )
}

/**
 * The theme of the nearest `ThemeProvider`, as the MD3 theme that every
 * component in this package reads. Use this, not `useTheme`, in a component.
 *
 * `ThemeProvider` takes any theme, and a theme with its own role names is
 * valid for the app's own components. `useTheme()` casts it to the MD3 type,
 * so a component that got such a theme threw on the first token it read
 * (`Cannot read property 'cornerFull' of undefined`), and the error didn't
 * name the theme.
 *
 * So a theme that isn't MD3 gives one warning in development, and the
 * component gets the default MD3 light theme with the tokens of the given
 * theme on top. The result is cached for each theme object, so its identity
 * is stable across renders.
 */
export function useMaterialTheme(): MaterialTheme {
  const theme = useTheme<BaseTheme>()

  const known = resolved.get(theme)
  if (known) return known

  if (isMaterialTheme(theme)) {
    resolved.set(theme, theme as MaterialTheme)
    return theme as MaterialTheme
  }

  warnOnce(
    'theme-without-md3-tokens',
    'A component of this library got a theme that is not a Material Design ' +
      '3 theme. The components read the MD3 color roles, typography roles, ' +
      'and token groups, so this component uses the default MD3 light theme ' +
      'for each token that the theme does not have. Give the component an ' +
      'MD3 theme: keep the MD3 role names and add your own tokens beside ' +
      'them, or put a ThemeProvider with an MD3 theme around it. See ' +
      'https://rootnative.github.io/ui/theming#custom-design-systems',
  )

  const completed = {
    ...lightTheme,
    ...theme,
    colors: { ...lightTheme.colors, ...theme.colors },
    typography: { ...lightTheme.typography, ...theme.typography },
  } as MaterialTheme
  resolved.set(theme, completed)
  return completed
}
