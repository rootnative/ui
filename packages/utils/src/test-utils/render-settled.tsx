import { flushMotion } from '@rootnative/inertia/testing'
import type { render } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import {
  renderWithTheme,
  type RenderWithThemeOptions,
} from './render-with-theme'

type RenderResult = ReturnType<typeof render>

export interface RenderSettledResult extends RenderResult {
  /**
   * Flush pending animations to their settled values. Call this after any
   * interaction the helper can't see — `fireEvent.press`, a fired timer, an
   * imperative ref call. `rerender`/`update` already flush themselves.
   */
  flush: () => void
}

/**
 * `renderWithTheme` plus a motion flush, for assertions that need the value a
 * real device settles on rather than the one the Reanimated Jest mock leaves
 * behind.
 *
 * Reach for it in exactly two situations:
 *
 * 1. **Entrance animations.** `Motion.View` with `initial`/`animate` genuinely
 *    starts away from its target, so a single-pass render captures the
 *    `initial` values — a visible `Dialog` reads `opacity: 0, scale: 0.8`
 *    under `renderWithTheme` and stays there.
 * 2. **After a prop change or an interaction.** Progress values seeded by
 *    `useAnimation` are already at their target on mount, so mount is *not*
 *    blind. The stale read appears afterwards: the render that carries the new
 *    prop runs the `useAnimatedStyle` worklet *before* the effect writes the
 *    new shared value, so the assertion sees the pre-change number.
 *
 * Plain `renderWithTheme` is still correct — and cheaper — for the static
 * style props (background, radius, disabled colors) that most of the suite
 * asserts on. No shared value feeds those, so the mock's staleness can't
 * reach them.
 *
 * @example
 * // Entrance: settled on arrival.
 * renderSettled(<Dialog visible onDismiss={noop} testID="dialog">…</Dialog>)
 *
 * @example
 * // Interaction: flush once the event has been dispatched.
 * const { flush } = renderSettled(<Switch />)
 * fireEvent.press(screen.getByRole('switch'))
 * flush()
 */
export function renderSettled(
  ui: ReactElement,
  options?: RenderWithThemeOptions,
): RenderSettledResult {
  // What's currently mounted, so `flush()` re-renders that rather than
  // reverting to the element originally passed in.
  let current = ui
  const rendered = renderWithTheme(ui, options)

  // What a settle costs is exactly one render pass *after* the pass that
  // committed the change — the committing pass runs the `useAnimatedStyle`
  // worklet before its own effect writes the new shared value, so it can only
  // ever see the old one.
  //
  // This is why `flushMotion` alone can't be used to change props:
  // `flushMotion(rendered, nextUi)` is a single `rerender`, so it *is* the
  // committing pass and lands on the pre-change value. Here the two roles are
  // separated — `rerender` commits, `flush` settles — so one pass each is
  // right, and re-rendering the same element is idempotent.
  const flush = () => {
    flushMotion(rendered, current)
  }

  const rerender = (next: ReactElement) => {
    current = next
    rendered.rerender(next)
    flush()
  }

  flush()

  return { ...rendered, rerender, update: rerender, flush }
}
