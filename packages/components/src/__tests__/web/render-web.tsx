import { ThemeProvider } from '@rootnative/core'
import { act, render } from '@testing-library/react'
import { cloneElement, type ReactElement, type ReactNode } from 'react'

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

export interface RenderWebSettledResult extends ReturnType<typeof renderWeb> {
  /**
   * Flush pending animations to their settled values. Call after any
   * interaction — `fireEvent.mouseEnter`, `fireEvent.focus`, a fired timer.
   */
  flush: () => void
}

/**
 * `renderWeb` plus a motion flush — the DOM counterpart of `renderSettled`.
 *
 * The web project shares the native suite's Reanimated mock, so it inherits the
 * same staleness: `useAnimatedStyle` runs its worklet once per render, and the
 * render that commits an interaction runs that worklet *before* its own effect
 * writes the new shared value. So the pass that delivers a `mouseEnter` still
 * paints the rest color, and an assertion taken right after the event reads the
 * pre-hover background and passes for the wrong reason.
 *
 * A settle is one extra render pass after the committing one. That is all this
 * does — there is no waiting involved, and it is idempotent.
 *
 * The re-render must hand React a *new element identity*, exactly as the native
 * `renderSettled` does. React bails out of re-rendering a child whose element is
 * reference-identical (`oldProps === newProps`), so `rerender(ui)` with the very
 * element already mounted is a no-op and settles nothing — the assertion then
 * reads the pre-interaction value and the test fails for a reason that has
 * nothing to do with the component. `cloneElement` allocates a fresh props
 * object, which is enough to defeat the bailout while reconciling as an update
 * rather than a remount, so shared values survive.
 *
 * A shallow clone is enough here, unlike the native helper's deep
 * `withFreshIdentity`: that one has to reach `<Portal>` content, which
 * re-registers through an effect keyed on `children`. Every state layer this
 * helper serves is in the directly-rendered tree. A web test that needs to
 * settle a portalled entrance will need the deep version.
 *
 * @example
 * const { flush } = renderWebSettled(<Button>Save</Button>)
 * fireEvent.mouseEnter(screen.getByRole('button'))
 * flush()
 * // now the hover state layer is on the node
 */
export function renderWebSettled(ui: ReactElement): RenderWebSettledResult {
  const rendered = renderWeb(ui)
  const flush = () => {
    act(() => {
      rendered.rerender(cloneElement(ui))
    })
  }
  flush()
  return { ...rendered, flush }
}
