/**
 * DOM-level regression net for **layout direction on web**.
 *
 * Why this file exists: react-native-web ships `I18nManager` as a hardcoded
 * stub — `getConstants()` returns `{isRTL: false}` and `forceRTL` is a no-op
 * (`react-native-web/dist/cjs/exports/I18nManager/index.js`). It is wired to
 * nothing, so it reports LTR forever regardless of how the page is laid out.
 *
 * That is not a cosmetic gap, because RNW mirrors *layout* perfectly well
 * without it: it emits CSS logical properties (`padding-inline-start`, never
 * `padding-left`), which the browser resolves against the inherited
 * `direction`. The result was a page whose boxes mirrored correctly under
 * `dir="rtl"` while every JS `isRTL` branch still answered "LTR" — a back arrow
 * pointing the wrong way inside a correctly mirrored app bar, a Slider whose
 * drag maths ran backwards, and Menu/Tooltip `align="start"` resolving to the
 * wrong physical edge.
 *
 * The fix reads the browser's real direction on web (`packages/utils/src/rtl.ts`),
 * so these tests set `dir` on the document and read the outcome back. The native
 * half of the same seam is covered by `packages/utils/src/__tests__/rtl.test.ts`,
 * which stubs `I18nManager` directly — it cannot see this, and this cannot see
 * that.
 *
 * **jsdom caveat, and why these assert on behaviour rather than on CSS.** jsdom
 * does not implement logical properties or `direction` inheritance: under
 * `dir="rtl"` it still reports `padding-left` unchanged and computes
 * `direction` as `''`. So the *mirroring* itself is not observable here — only
 * a real browser resolves it, and it is Chromium-verified rather than asserted
 * in this file. What these tests do cover is the part that was actually broken:
 * the JS branches that pick an icon, an edge, or a direction sign.
 */
import {
  isRTLDirection,
  resolveLogical,
  resolveLogicalKey,
  selectRTL,
  transformOrigin,
} from '@rootnative/utils'
import { screen } from '@testing-library/react'
import { AppBar } from '../../appbar'
import { resolveAnchorPosition } from '../../internal/useAnchorPosition'
import { TextField } from '../../text-field'
import { renderWeb } from './render-web'

/**
 * The document is shared across tests in a file, so a leaked `dir` would make
 * every later test read RTL. Always clear it.
 */
afterEach(() => {
  document.documentElement.removeAttribute('dir')
})

describe('direction is read from the document, not from I18nManager', () => {
  it('reports LTR by default', () => {
    expect(isRTLDirection()).toBe(false)
  })

  it('reports RTL under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    expect(isRTLDirection()).toBe(true)
  })

  it('reports LTR again under an explicit dir="ltr"', () => {
    document.documentElement.setAttribute('dir', 'ltr')
    expect(isRTLDirection()).toBe(false)
  })

  /**
   * The whole point of reading per call rather than caching at module scope:
   * `dir` is a DOM attribute a language switcher can flip at runtime, unlike
   * the native flag which is fixed until the app relaunches. A cached read
   * would answer correctly once and then be wrong for the rest of the session.
   */
  it('follows a runtime direction change', () => {
    expect(isRTLDirection()).toBe(false)
    document.documentElement.setAttribute('dir', 'rtl')
    expect(isRTLDirection()).toBe(true)
    document.documentElement.setAttribute('dir', 'ltr')
    expect(isRTLDirection()).toBe(false)
  })
})

describe('the direction helpers follow the document', () => {
  it('selectRTL picks the LTR arm by default', () => {
    expect(selectRTL('ltr-value', 'rtl-value')).toBe('ltr-value')
  })

  it('selectRTL picks the RTL arm under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    expect(selectRTL('ltr-value', 'rtl-value')).toBe('rtl-value')
  })

  it('transformOrigin anchors left by default', () => {
    expect(transformOrigin('top')).toBe('left top')
  })

  it('transformOrigin anchors right under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    expect(transformOrigin('top')).toBe('right top')
  })
})

/**
 * The user-visible half. `getBackIcon` is the clearest case of the bug: a
 * mirrored app bar with an arrow still pointing at the LTR "back".
 *
 * Read off the rendered output rather than by calling the helper, so this
 * covers the wiring (component → `selectRTL` → DOM) and not just the helper in
 * isolation.
 */
describe('AppBar back affordance points the right way', () => {
  function renderBackBar() {
    return renderWeb(
      <AppBar title="Settings" canGoBack onBackPress={() => {}} />,
    )
  }

  it('points left in LTR', () => {
    const { container } = renderBackBar()
    expect(container.innerHTML).toContain('arrow-left')
    expect(container.innerHTML).not.toContain('arrow-right')
  })

  it('points right in RTL', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const { container } = renderBackBar()
    expect(container.innerHTML).toContain('arrow-right')
    expect(container.innerHTML).not.toContain('arrow-left')
  })

  it('still labels the control the same way in both directions', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderBackBar()
    // The icon mirrors; the accessible name must not.
    expect(screen.getByLabelText('Go back')).toBeTruthy()
  })
})

/**
 * A style from `StyleSheet.create` mirrors through CSS, but react-native-web
 * resolves the logical keys of an *inline* style object in JavaScript, from a
 * locale context that defaults to LTR and that `dir` never updates. So an
 * inline `{ start: 56 }` is `left: 56px` under `dir="rtl"`. `resolveLogical`
 * writes the physical key for the document direction instead. jsdom cannot
 * show the mirroring, but it does show which key reached the element.
 */
describe('resolveLogical writes the physical key for the document direction', () => {
  it('resolves to the left edge in LTR', () => {
    expect(resolveLogicalKey('start')).toBe('left')
    expect(resolveLogical('end', 8)).toEqual({ right: 8 })
    expect(resolveLogical('marginStart', 8)).toEqual({ marginLeft: 8 })
    expect(resolveLogical('paddingEnd', 8)).toEqual({ paddingRight: 8 })
  })

  it('resolves to the right edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    expect(resolveLogicalKey('start')).toBe('right')
    expect(resolveLogical('end', 8)).toEqual({ left: 8 })
    expect(resolveLogical('marginStart', 8)).toEqual({ marginRight: 8 })
    expect(resolveLogical('paddingEnd', 8)).toEqual({ paddingLeft: 8 })
  })

  /**
   * jsdom reports no layout, so the insets are the no-slot values rather than
   * the 56dp a back button gives on a device. What matters here is the swap:
   * the two insets change edges with the direction.
   */
  it('swaps the small app bar title insets between the edges under dir="rtl"', () => {
    const ltr = renderWeb(<AppBar title="Settings" />)
    const ltrLayer = screen.getByText('Settings').parentElement as HTMLElement
    const { left, right } = ltrLayer.style
    expect(left).not.toBe('')
    expect(right).not.toBe('')
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(<AppBar title="Settings" />)
    const rtlLayer = screen.getByText('Settings').parentElement as HTMLElement
    expect(rtlLayer.style.right).toBe(left)
    expect(rtlLayer.style.left).toBe(right)
  })

  it('places the text field label from the right edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(<TextField label="Name" />)
    const label = screen.getByText('Name').parentElement as HTMLElement
    expect(label.style.right).toBe('16px')
    expect(label.style.left).toBe('')
  })
})

/**
 * Overlay placement resolves a *logical* alignment (`start`/`end`) to a physical
 * edge, so it goes through `selectRTL` and inherits everything above.
 *
 * The native suite covers this geometry thoroughly — 23 cases in
 * `useAnchorPosition.test.ts`, including both RTL alignments — but it sets
 * direction by stubbing `I18nManager.isRTL`, which **on web does nothing**:
 * RNW's `I18nManager` is a dead stub and `selectRTL` reads the document instead.
 * So those RTL cases prove the maths and say nothing about the browser, and
 * without these two a Menu could resolve `align="start"` to the wrong edge on
 * every RTL web page with the whole suite green.
 *
 * The expected numbers are the same ones the native alignment tests assert, on
 * the same geometry — they have to be, since it is one shared function and only
 * the direction *source* differs.
 */
describe('overlay placement resolves logical alignment against the document', () => {
  const WIDE = {
    anchor: { x: 250, y: 300, width: 40, height: 40 },
    overlay: { width: 200, height: 150 },
    layer: { x: 0, y: 0, width: 600, height: 800 },
    windowWidth: 600,
    windowHeight: 800,
    preferredSide: 'bottom' as const,
    align: 'start' as const,
    offset: 0,
    screenMargin: 8,
    maxOverlayHeight: Infinity,
  }

  it('aligns start to the anchor left edge in LTR', () => {
    const position = resolveAnchorPosition(WIDE)
    expect(position.left).toBe(250)
    expect(position.transformOrigin).toBe('left top')
  })

  it('aligns start to the anchor right edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const position = resolveAnchorPosition(WIDE)
    expect(position.left).toBe(90)
    expect(position.transformOrigin).toBe('right top')
  })

  it('aligns end to the anchor left edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const position = resolveAnchorPosition({ ...WIDE, align: 'end' })
    expect(position.left).toBe(250)
    expect(position.transformOrigin).toBe('left top')
  })
})
