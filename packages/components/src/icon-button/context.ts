import { createContext, useContext } from 'react'

// `AppBar` provides this context, but the file lives here: `IconButton` reads
// it, and `appbar` already imports `icon-button`. Do not move it to
// `internal/`. The CLI copies an `internal/` file into each component that
// imports it, so the bar and the button would each get their own context.
export const AppBarContentColorContext = createContext<string | undefined>(
  undefined,
)

/**
 * The icon color of the `AppBar` slot that holds the caller, from the MD3
 * top app bar tokens. In `leading` it is the title color. In `trailing` it is
 * `onSurfaceVariant` on the surface schemes, and the title color on
 * `'primary'` and `'primaryContainer'`. The bar's `contentColor` replaces
 * both. `undefined` outside the two slots, and in content that a `Portal`
 * renders, such as an open `Menu`.
 *
 * A standard `IconButton` in a slot takes this color with no prop. Read it
 * for other custom content, such as an `Icon` or a text.
 */
export function useAppBarContentColor(): string | undefined {
  return useContext(AppBarContentColorContext)
}
