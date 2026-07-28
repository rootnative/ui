import { ThemeProvider } from '@rootnative/core'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

/**
 * `renderWithTheme`'s DOM sibling. The shared helper in `@rootnative/utils/test`
 * renders through `@testing-library/react-native`, which stops at the React
 * element tree — the whole point of this project is to get past it and read the
 * DOM react-native-web actually produced.
 */
export function renderWeb(ui: ReactElement) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  )
  return render(ui, { wrapper })
}
