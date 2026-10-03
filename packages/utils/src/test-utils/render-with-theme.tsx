import { ThemeProvider, darkTheme } from '@rootnative/core'
import type { IconResolver, Theme } from '@rootnative/core'
import { render, type RenderOptions } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import { testMdiResolver } from './mdi-resolver'

export interface RenderWithThemeOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Pass a custom theme or `'dark'` for the built-in dark theme. Defaults to light. */
  theme?: Theme | 'dark'
  /**
   * Icon resolver wired into `ThemeProvider` for the render. Defaults to the
   * MDI resolver, as in an Expo app. Pass `null` to render with no resolver.
   */
  iconResolver?: IconResolver | null
}

export function renderWithTheme(
  ui: ReactElement,
  options?: RenderWithThemeOptions,
) {
  const { theme, iconResolver, ...renderOptions } = options ?? {}
  const themeValue = theme === 'dark' ? darkTheme : theme
  const resolver =
    iconResolver === undefined ? testMdiResolver : (iconResolver ?? undefined)

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={themeValue} iconResolver={resolver}>
      {children}
    </ThemeProvider>
  )

  return render(ui, {
    wrapper,
    ...renderOptions,
  })
}
