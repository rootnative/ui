import { ThemeProvider, darkTheme } from '@rootnative/core'
import type { IconResolver, Theme } from '@rootnative/core'
import { render, type RenderOptions } from '@testing-library/react-native'
import type { ReactElement } from 'react'

interface RenderWithThemeOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Pass a custom theme or `'dark'` for the built-in dark theme. Defaults to light. */
  theme?: Theme | 'dark'
  /** Optional icon resolver wired into `ThemeProvider` for the render. */
  iconResolver?: IconResolver
}

export function renderWithTheme(
  ui: ReactElement,
  options?: RenderWithThemeOptions,
) {
  const { theme, iconResolver, ...renderOptions } = options ?? {}
  const themeValue = theme === 'dark' ? darkTheme : theme

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={themeValue} iconResolver={iconResolver}>
      {children}
    </ThemeProvider>
  )

  return render(ui, {
    wrapper,
    ...renderOptions,
  })
}
