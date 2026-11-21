/**
 * DOM-level regression net for **layout direction on web**.
 *
 * Why this file exists: react-native-web ships `I18nManager` as a hardcoded
 * stub — `getConstants()` returns `{isRTL: false}` and `forceRTL` is a no-op
 * (`react-native-web/dist/cjs/exports/I18nManager/index.js`). It is wired to
 * nothing, so it reports LTR forever regardless of how the page is laid out.
 *
 * That is not a cosmetic gap, because the browser mirrors part of the layout
 * without it: a flex row runs from the right under the inherited `direction`.
 * The result was a page whose rows mirrored under `dir="rtl"` while every JS
 * `isRTL` branch still answered "LTR" — a back arrow pointing the wrong way
 * inside a mirrored app bar, a Slider whose drag maths ran backwards, and
 * Menu/Tooltip `align="start"` resolving to the wrong physical edge.
 *
 * react-native-web doesn't mirror a logical style key, such as `paddingStart`.
 * It resolves the key in JavaScript from its locale context, which is LTR
 * unless a `View` has a `dir` or `lang` prop, and it writes the physical
 * property (`padding-left`). A `StyleSheet.create` class gets the same result.
 * So a one-sided inset takes its key from `resolveLogicalKey`.
 *
 * The fix reads the browser's real direction on web (`packages/utils/src/rtl.ts`),
 * so these tests set `dir` on the document and read the outcome back. The native
 * half of the same seam is covered by `packages/utils/src/__tests__/rtl.test.ts`,
 * which stubs `I18nManager` directly — it cannot see this, and this cannot see
 * that.
 *
 * **jsdom caveat.** jsdom doesn't lay out, and it computes `direction` as
 * `''`. So the mirroring of a row isn't observable here; it is checked in
 * Chromium. These tests assert the JS branches that pick an icon, an edge, a
 * direction sign, or the physical key that reaches the element.
 */
import {
  ThemeProvider,
  defaultTopAppBarTokens,
  lightTheme,
} from '@rootnative/core'
import {
  isRTLDirection,
  resolveLogical,
  resolveLogicalKey,
  selectRTL,
  transformOrigin,
} from '@rootnative/utils'
import { act, screen } from '@testing-library/react'
import { createRef, useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppBar } from '../../appbar'
import { Badge } from '../../badge'
import { BottomAppBar } from '../../bottom-app-bar'
import { Button } from '../../button'
import { ButtonGroup } from '../../button-group'
import { Carousel } from '../../carousel'
import type { CarouselItemInfo, CarouselRef } from '../../carousel'
import { buildStrategy } from '../../carousel/strategy'
import { Chip } from '../../chip'
import { Dialog } from '../../dialog'
import { Divider } from '../../divider'
import { FAB } from '../../fab'
import { resolveAnimatedInsetKey } from '../../internal/resolveAnimatedInsetKey'
import { resolveAnchorPosition } from '../../internal/useAnchorPosition'
import { Box } from '../../layout/Box'
import { Layout } from '../../layout/Layout'
import { ListHeadline, ListItem } from '../../list'
import { Menu } from '../../menu'
import { NavigationDrawer } from '../../navigation-drawer'
import { PortalHost } from '../../portal/PortalHost'
import { LinearProgress } from '../../progress/LinearProgress'
import { physicalLeftStyle } from '../../safe-area'
import { SearchBar } from '../../search-bar'
import { SearchView } from '../../search-view'
import { SideSheet } from '../../side-sheet'
import { SnackbarProvider, useSnackbar } from '../../snackbar'
import { Switch } from '../../switch'
import {
  SWITCH_STATE_LAYER_SIZE,
  SWITCH_TRACK_BORDER_WIDTH,
  SWITCH_TRACK_HEIGHT,
} from '../../switch/styles'
import { Tabs } from '../../tabs'
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
 * The back arrow of a `SearchView` points at the start edge. Its default was a
 * fixed `arrow-left`, so under `dir="rtl"` it pointed away from the start.
 */
describe('SearchView back arrow points the right way', () => {
  function renderSearchView() {
    return renderWeb(
      <PortalHost>
        <SearchView visible onDismiss={() => {}} placeholder="Search mail" />
      </PortalHost>,
    )
  }

  it('points left in LTR', () => {
    const { container } = renderSearchView()
    expect(container.innerHTML).toContain('arrow-left')
    expect(container.innerHTML).not.toContain('arrow-right')
  })

  it('points right under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const { container } = renderSearchView()
    expect(container.innerHTML).toContain('arrow-right')
    expect(container.innerHTML).not.toContain('arrow-left')
  })
})

/**
 * react-native-web gives each input `dir="auto"`, so Latin text in an RTL
 * page aligns left. Each input of the library sets a physical `textAlign`
 * from the document direction, so the value and the placeholder start at
 * the start edge of the page.
 */
describe('the inputs align with the start edge of the document', () => {
  const INPUTS: [string, () => React.ReactElement][] = [
    ['TextField', () => <TextField label="Email" />],
    ['SearchBar', () => <SearchBar placeholder="Search mail" />],
    [
      'SearchView',
      () => (
        <PortalHost>
          <SearchView visible onDismiss={() => {}} placeholder="Search mail" />
        </PortalHost>
      ),
    ],
  ]

  function textAlignOfInput(container: HTMLElement) {
    const input = container.querySelector('input')
    if (input === null) throw new Error('no input')
    return input.style.textAlign
  }

  it.each(INPUTS)('aligns the %s input left in LTR', (_name, render) => {
    const { container } = renderWeb(render())
    expect(textAlignOfInput(container)).toBe('left')
  })

  it.each(INPUTS)(
    'aligns the %s input right under dir="rtl"',
    (_name, render) => {
      document.documentElement.setAttribute('dir', 'rtl')
      const { container } = renderWeb(render())
      expect(textAlignOfInput(container)).toBe('right')
    },
  )
})

/**
 * react-native-web resolves a logical key in JavaScript, from a locale context
 * that defaults to LTR and that the document `dir` never updates. That's true
 * for an inline style object and for a `StyleSheet.create` class. So
 * `{ start: 56 }` is `left: 56px` under `dir="rtl"`. `resolveLogical` writes the
 * physical key under `dir="rtl"` instead, and jsdom shows which key reached the
 * element. In LTR it keeps the logical key, which react-native-web resolves
 * to the correct side.
 */
describe('resolveLogical writes a key for the document direction', () => {
  it('keeps the logical key in LTR', () => {
    expect(resolveLogicalKey('start')).toBe('start')
    expect(resolveLogical('end', 8)).toEqual({ end: 8 })
    expect(resolveLogical('marginStart', 8)).toEqual({ marginStart: 8 })
    expect(resolveLogical('paddingEnd', 8)).toEqual({ paddingEnd: 8 })
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

  it('swaps the menu group label insets between the edges under dir="rtl"', () => {
    const menu = (
      <PortalHost>
        <Menu anchor={null} visible onDismiss={() => {}} variant="vertical">
          <Menu.Group label="Sort by">
            <Menu.Item label="Name" />
          </Menu.Group>
          <Menu.Group>
            <Menu.Item label="Archive" />
          </Menu.Group>
        </Menu>
      </PortalHost>
    )
    const insets = () => {
      const row = screen.getByText('Sort by').parentElement as HTMLElement
      return [row.style.paddingLeft, row.style.paddingRight]
    }

    const ltr = renderWeb(menu)
    expect(insets()).toEqual(['12px', '4px'])
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(menu)
    expect(insets()).toEqual(['4px', '12px'])
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

const TAB_ITEMS = [
  { value: 'flights', label: 'Flights' },
  { value: 'trips', label: 'Trips' },
  { value: 'explore', label: 'Explore' },
]

/**
 * jsdom has no `ResizeObserver`, so react-native-web never fires `onLayout`
 * here. This calls the handler that react-native-web keeps on the node for its
 * observer, with the layout a browser would report.
 */
function fireLayout(node: Element, width: number) {
  const handler = (node as Element & { __reactLayoutHandler?: unknown })
    .__reactLayoutHandler
  if (typeof handler !== 'function') {
    throw new Error('react-native-web set no layout handler on the node')
  }
  act(() => {
    handler({ nativeEvent: { layout: { x: 0, y: 0, width, height: 48 } } })
  })
}

/**
 * `Tabs` places its indicator from the physical left, so in RTL it counts each
 * tab offset back from the right edge of the row. The native suite covers the
 * same geometry with `I18nManager.isRTL` stubbed, which does nothing on web.
 */
describe('Tabs places the indicator for the document direction', () => {
  function renderLaidOutTabs() {
    renderWeb(
      <Tabs
        items={TAB_ITEMS}
        testID="tabs"
        scrollable
        edgePadding={16}
        defaultValue="trips"
      />,
    )
    const tabs = screen.getAllByRole('tab')
    for (const [index, tab] of tabs.entries()) {
      fireLayout(tab, 120)
      const label = screen.getByText(TAB_ITEMS[index]?.label ?? '')
      fireLayout(label.parentElement as HTMLElement, 40)
    }
    fireLayout(tabs[0]?.parentElement as HTMLElement, 500)
    return screen.getByTestId('tabs-indicator')
  }

  it('counts from the left edge in LTR', () => {
    // 16 + 120 + (120 - 40) / 2.
    expect(renderLaidOutTabs().style.transform).toBe('translateX(176px)')
  })

  it('counts from the right edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    // 500 - 16 - 240 + (120 - 40) / 2.
    expect(renderLaidOutTabs().style.transform).toBe('translateX(284px)')
  })
})

/**
 * A browser in RTL counts the scroll offset down from 0 at the right edge, and
 * clamps a positive value to 0. `Tabs` passed the offset from the left edge,
 * so under `dir="rtl"` the row didn't scroll to a selected tab out of view.
 */
describe('Tabs scrolls to the selected tab for the document direction', () => {
  const scroll = jest.fn()
  beforeEach(() => {
    scroll.mockClear()
    Object.defineProperty(HTMLElement.prototype, 'scroll', {
      configurable: true,
      value: scroll,
    })
  })
  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scroll
  })

  // 16 + 200 + 120 + 120 + 16 = 472 wide in a 200 viewport.
  function scrollLeftForTrips() {
    renderWeb(
      <Tabs
        items={TAB_ITEMS}
        testID="tabs"
        scrollable
        edgePadding={16}
        defaultValue="trips"
      />,
    )
    const tabs = screen.getAllByRole('tab')
    const row = tabs[0]?.parentElement as HTMLElement
    const content = row.parentElement as HTMLElement
    fireLayout(content.parentElement as HTMLElement, 200)
    fireLayout(content, 472)
    for (const [index, tab] of tabs.entries()) {
      fireLayout(tab, index === 0 ? 200 : 120)
      const label = screen.getByText(TAB_ITEMS[index]?.label ?? '')
      fireLayout(label.parentElement as HTMLElement, 40)
    }
    fireLayout(row, 472)
    return scroll.mock.lastCall?.[0]?.left
  }

  it('scrolls to the offset from the left edge in LTR', () => {
    // 16 + 200 + 120 / 2 - 200 / 2.
    expect(scrollLeftForTrips()).toBe(176)
  })

  it('scrolls to the negative offset from the start under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    // 96 from the left edge (472 - 16 - 200 - 120 + 120 / 2 - 200 / 2), then
    // minus the scroll range of 472 - 200.
    expect(scrollLeftForTrips()).toBe(-176)
  })
})

/**
 * react-native-web keeps `left` physical under `dir="rtl"`, so `LinearProgress`
 * mirrors each part of the bar itself on the web. Before, the bar filled from
 * the left edge of an RTL page, and the stop dot sat at the right edge.
 */
describe('LinearProgress mirrors the bar for the document direction', () => {
  /** The parts of the bar, in render order, in a 200 wide root. */
  function partsOf(bar: React.ReactElement) {
    renderWeb(bar)
    const root = screen.getByTestId('linear')
    fireLayout(root, 200)
    return Array.from(root.children) as HTMLElement[]
  }

  // At 25%: 200 - 4 (stop dot) - 4 (gap) = 192 for the bar, so the active
  // part is 0.25 * (192 - 4) = 47 wide and the inactive part 192 - 47 - 4.
  it('fills the determinate bar from the left edge in LTR', () => {
    const [active, inactive, stop] = partsOf(
      <LinearProgress progress={0.25} testID="linear" />,
    )
    expect([active?.style.left, active?.style.width]).toEqual(['0px', '47px'])
    expect([inactive?.style.left, inactive?.style.width]).toEqual([
      '51px',
      '141px',
    ])
    expect([stop?.style.left, stop?.style.right]).toEqual(['', '0px'])
  })

  it('fills the determinate bar from the right edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const [active, inactive, stop] = partsOf(
      <LinearProgress progress={0.25} testID="linear" />,
    )
    expect([active?.style.left, active?.style.width]).toEqual(['153px', '47px'])
    expect([inactive?.style.left, inactive?.style.width]).toEqual([
      '8px',
      '141px',
    ])
    expect([stop?.style.left, stop?.style.right]).toEqual(['0px', ''])
  })

  // The slide of the indeterminate segment changes its sign on the same flag.
  // The mocked `Motion.View` doesn't write its keyframes to the DOM, so this
  // case is the web witness for both.
  it('flips the wave under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const [wave] = partsOf(
      <LinearProgress progress={0.5} wavy testID="linear" />,
    )
    expect(wave?.style.transform).toBe('scaleX(-1)')
  })

  it('starts the indeterminate segment at the right edge under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const [, segment] = partsOf(<LinearProgress testID="linear" />)
    // The segment is 40% of 200 wide.
    expect(segment?.style.left).toBe('120px')
  })
})

/**
 * A browser counts an RTL scroll offset down from 0 and clamps a positive one
 * to 0. `Carousel.scrollToIndex` passed the positive offset, so under
 * `dir="rtl"` its Next and Back buttons did not move the carousel.
 */
describe('Carousel scrolls to an index for the document direction', () => {
  const PLACES = ['Cabin', 'Shore', 'Ridge', 'Dunes', 'Falls', 'Harbor']
  const renderPlace = ({ item }: CarouselItemInfo<string>) => (
    <Text>{item}</Text>
  )
  const { snapOffsets } = buildStrategy({
    viewport: 380,
    itemWidth: 186,
    gap: 8,
    padding: 16,
    count: PLACES.length,
    layout: 'multi-browse',
  }) ?? { snapOffsets: [] }

  const scroll = jest.fn()
  beforeEach(() => {
    scroll.mockClear()
    Object.defineProperty(HTMLElement.prototype, 'scroll', {
      configurable: true,
      value: scroll,
    })
  })
  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scroll
  })

  function scrollLeftForIndex(index: number) {
    const ref = createRef<CarouselRef>()
    renderWeb(
      <Carousel
        ref={ref}
        items={PLACES}
        renderItem={renderPlace}
        contentPadding={16}
        testID="carousel"
      />,
    )
    const handler = (
      screen.getByTestId('carousel') as Element & {
        __reactLayoutHandler?: (event: unknown) => void
      }
    ).__reactLayoutHandler
    act(() => {
      handler?.({
        nativeEvent: { layout: { x: 0, y: 0, width: 380, height: 205 } },
      })
    })
    scroll.mockClear()
    act(() => ref.current?.scrollToIndex(index, false))
    return scroll.mock.lastCall?.[0]?.left
  }

  it('scrolls to the positive offset in LTR', () => {
    expect(snapOffsets[3]).toBeGreaterThan(0)
    expect(scrollLeftForIndex(3)).toBe(snapOffsets[3])
  })

  it('scrolls to the negative offset under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    expect(scrollLeftForIndex(3)).toBe(-snapOffsets[3])
  })
})

// The native side swaps the left and right insets in RTL, because React Native
// applies `paddingLeft` to the start edge there. react-native-web keeps an
// inline `paddingLeft` on the left under `dir="rtl"`, so the web must not
// swap. A swap that reads `isRTLDirection()` would fail here.
describe('the safe-area side insets stay physical on web', () => {
  it('pads and bleeds on the side of the inset under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, right: 0, bottom: 0, left: 54 },
          frame: { x: 0, y: 0, width: 923, height: 411 },
        }}
      >
        <Layout>
          <AppBar title="About" testID="bar" />
        </Layout>
      </SafeAreaProvider>,
    )
    const bar = screen.getByTestId('bar')
    expect(bar.style.marginLeft).toBe('-54px')
    expect(bar.style.marginRight).toBe('0px')
    expect(bar.parentElement?.style.paddingLeft).toBe('54px')
    expect(bar.parentElement?.style.paddingRight).toBe('0px')
  })

  // The end of a bar is the left side under `dir="rtl"`. `I18nManager` on
  // web always reports LTR, so a side picked from it would be the right.
  it('pads and bleeds an end-side bar on the left under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, right: 40, bottom: 0, left: 54 },
          frame: { x: 0, y: 0, width: 923, height: 411 },
        }}
      >
        <Layout>
          <AppBar title="About" insetSides="end" testID="bar" />
        </Layout>
      </SafeAreaProvider>,
    )
    const bar = screen.getByTestId('bar')
    expect(bar.style.marginLeft).toBe('-54px')
    expect(bar.style.marginRight).toBe('0px')
    const area = bar.firstElementChild
    if (!(area instanceof HTMLElement)) throw new Error('no safe-area view')
    expect(area.style.paddingLeft).toBe('54px')
    expect(area.style.paddingRight).toBe('0px')
  })

  it('places a measured offset with left under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    expect(physicalLeftStyle(30)).toEqual({ left: 30 })
  })
})

// A modal drawer and a modal sheet render through a portal, outside `Layout`,
// so each pads the side inset of the screen edge it sits on.
describe('the modal drawer and sheet pad the inset of their own edge', () => {
  const insets = { top: 0, right: 40, bottom: 0, left: 62 }

  function withInsets(ui: React.ReactElement) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          insets,
          frame: { x: 0, y: 0, width: 874, height: 402 },
        }}
      >
        <PortalHost>{ui}</PortalHost>
      </SafeAreaProvider>
    )
  }

  function safeAreaOf(testID: string) {
    const area = screen.getByTestId(testID).firstElementChild
    if (!(area instanceof HTMLElement)) throw new Error('no safe-area view')
    return { left: area.style.paddingLeft, right: area.style.paddingRight }
  }

  it('pads a drawer on the right under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(
      withInsets(
        <NavigationDrawer visible onDismiss={() => {}} testID="drawer">
          <NavigationDrawer.Item value="home" label="Home" />
        </NavigationDrawer>,
      ),
    )
    expect(safeAreaOf('drawer')).toEqual({ left: '0px', right: '40px' })
  })

  it('pads an end-edge sheet on the left under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(
      withInsets(
        <SideSheet visible onDismiss={() => {}} testID="sheet">
          <Text>Sheet</Text>
        </SideSheet>,
      ),
    )
    expect(safeAreaOf('sheet')).toEqual({ left: '62px', right: '0px' })
  })

  it('adds the inset to the left margin of a detached end-edge sheet under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(
      withInsets(
        <SideSheet visible onDismiss={() => {}} detached testID="sheet">
          <Text>Sheet</Text>
        </SideSheet>,
      ),
    )
    const sheet = screen.getByTestId('sheet')
    expect({
      left: sheet.style.marginLeft,
      right: sheet.style.marginRight,
    }).toEqual({ left: '78px', right: '16px' })
    expect(safeAreaOf('sheet')).toEqual({ left: '0px', right: '0px' })
  })
})

// react-native-web resolves a logical key, such as `paddingStart`, as LTR under
// `dir="rtl"`, also in a `StyleSheet.create` style. In a browser, a start-edge
// sheet in RTL kept its 56dp scrim gap on the right, so it sat 56px in from the
// right edge.
describe('SideSheet places its one-sided styles for the document direction', () => {
  function sheet(props: { edge?: 'start' | 'end' } = {}) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
          frame: { x: 0, y: 0, width: 874, height: 402 },
        }}
      >
        <PortalHost>
          <SideSheet
            visible
            onDismiss={() => {}}
            headline="Filters"
            testID="sheet"
            {...props}
          >
            <Text>Sheet</Text>
          </SideSheet>
        </PortalHost>
      </SafeAreaProvider>
    )
  }

  // The corners are a `StyleSheet` class, so they are read with
  // `getComputedStyle`. The layer and the header padding are inline.
  function sides(element: HTMLElement, key: 'padding' | 'corners') {
    if (key === 'padding') {
      const { style } = element
      return { left: style.paddingLeft, right: style.paddingRight }
    }
    const computed = getComputedStyle(element)
    return {
      topLeft: computed.borderTopLeftRadius,
      bottomLeft: computed.borderBottomLeftRadius,
      topRight: computed.borderTopRightRadius,
      bottomRight: computed.borderBottomRightRadius,
    }
  }

  const layer = () => screen.getByTestId('sheet-layer')
  const header = () => screen.getByText('Filters').parentElement as HTMLElement

  it('keeps the scrim gap on the far side of an end-edge sheet', () => {
    const ltr = renderWeb(sheet())
    expect(sides(layer(), 'padding')).toEqual({ left: '56px', right: '' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(sheet())
    expect(sides(layer(), 'padding')).toEqual({ left: '', right: '56px' })
  })

  it('keeps the scrim gap on the left of a start-edge sheet under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(sheet({ edge: 'start' }))
    expect(sides(layer(), 'padding')).toEqual({ left: '56px', right: '' })
  })

  it('rounds the corners of a docked sheet on the side of the content', () => {
    const ltr = renderWeb(sheet())
    expect(sides(screen.getByTestId('sheet'), 'corners')).toEqual({
      topLeft: '16px',
      bottomLeft: '16px',
      topRight: '',
      bottomRight: '',
    })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(sheet())
    expect(sides(screen.getByTestId('sheet'), 'corners')).toEqual({
      topLeft: '',
      bottomLeft: '',
      topRight: '16px',
      bottomRight: '16px',
    })
  })

  it('gives the close button the smaller header inset, at the end', () => {
    const ltr = renderWeb(sheet())
    expect(sides(header(), 'padding')).toEqual({ left: '24px', right: '16px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(sheet())
    expect(sides(header(), 'padding')).toEqual({ left: '16px', right: '24px' })
  })

  // jsdom 20 doesn't remove a padding key that React empties, so this reads
  // the header (both keys stay) and the corners (a radius key clears). A
  // browser removes the old scrim gap too.
  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(sheet())
    expect(sides(header(), 'padding')).toEqual({ left: '24px', right: '16px' })

    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(sheet())
    expect(sides(header(), 'padding')).toEqual({ left: '16px', right: '24px' })
    expect(sides(screen.getByTestId('sheet'), 'corners')).toEqual({
      topLeft: '',
      bottomLeft: '',
      topRight: '16px',
      bottomRight: '16px',
    })
    expect(layer().style.paddingRight).toBe('56px')
  })
})

// In a browser, the icons of a TextField in RTL sat 20px too far in (the
// margins stayed on the LTR sides), so the resting label ran into the
// leading icon.
describe('TextField places its one-sided styles for the document direction', () => {
  const field = () => (
    <TextField
      label="Name"
      leadingIcon="magnify"
      trailingIcon="close-circle"
      maxLength={20}
    />
  )
  const margins = (element: HTMLElement | null) => ({
    left: element?.style.marginLeft,
    right: element?.style.marginRight,
  })
  const leadingIcon = () => screen.getByText('magnify').parentElement
  const trailingIcon = () => screen.getByText('close-circle').parentElement

  it('keeps 12dp between each icon and the field edge', () => {
    const ltr = renderWeb(field())
    expect(margins(leadingIcon())).toEqual({ left: '-4px', right: '16px' })
    expect(margins(trailingIcon())).toEqual({ left: '16px', right: '-4px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(field())
    expect(margins(leadingIcon())).toEqual({ left: '16px', right: '-4px' })
    expect(margins(trailingIcon())).toEqual({ left: '-4px', right: '16px' })
  })

  it('keeps the gap on the start side of the character counter', () => {
    const ltr = renderWeb(field())
    expect(margins(screen.getByText('0/20'))).toEqual({
      left: '16px',
      right: '',
    })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(field())
    expect(margins(screen.getByText('0/20'))).toEqual({
      left: '',
      right: '16px',
    })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(field())
    const label = () => screen.getByText('Name').parentElement as HTMLElement
    expect(label().style.left).toBe('52px')
    expect(label().style.transformOrigin).toBe('left top')

    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(field())
    expect(label().style.right).toBe('52px')
    expect(label().style.transformOrigin).toBe('right top')
    expect(margins(leadingIcon())).toEqual({ left: '16px', right: '-4px' })
  })
})

// The modal drawer sits at the start edge, so its scrim gap and its rounded
// corners are at the end, and an item pads 16dp at the start and 24dp at the
// end. Each one stayed on its LTR side under `dir="rtl"`.
describe('NavigationDrawer places its one-sided styles for the document direction', () => {
  const drawer = () => (
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
        frame: { x: 0, y: 0, width: 874, height: 402 },
      }}
    >
      <PortalHost>
        <NavigationDrawer visible onDismiss={() => {}} testID="drawer">
          <NavigationDrawer.Item value="home" label="Home" testID="home" />
        </NavigationDrawer>
      </PortalHost>
    </SafeAreaProvider>
  )
  // The layer padding is inline. The corners and the item padding are
  // `StyleSheet` classes, so they are read with `getComputedStyle`.
  const padding = (testID: string) => {
    const { style } = screen.getByTestId(testID)
    return { left: style.paddingLeft, right: style.paddingRight }
  }
  const itemPadding = () => {
    const computed = getComputedStyle(screen.getByTestId('home'))
    return { left: computed.paddingLeft, right: computed.paddingRight }
  }
  const corners = () => {
    const computed = getComputedStyle(screen.getByTestId('drawer'))
    return {
      topLeft: computed.borderTopLeftRadius,
      bottomLeft: computed.borderBottomLeftRadius,
      topRight: computed.borderTopRightRadius,
      bottomRight: computed.borderBottomRightRadius,
    }
  }
  const endCorners = {
    topLeft: '',
    bottomLeft: '',
    topRight: '16px',
    bottomRight: '16px',
  }
  const endCornersRtl = {
    topLeft: '16px',
    bottomLeft: '16px',
    topRight: '',
    bottomRight: '',
  }

  it('keeps the scrim gap at the end', () => {
    const ltr = renderWeb(drawer())
    expect(padding('drawer-layer')).toEqual({ left: '', right: '56px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(drawer())
    expect(padding('drawer-layer')).toEqual({ left: '56px', right: '' })
  })

  it('rounds the end corners', () => {
    const ltr = renderWeb(drawer())
    expect(corners()).toEqual(endCorners)
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(drawer())
    expect(corners()).toEqual(endCornersRtl)
  })

  it('pads an item 16dp at the start and 24dp at the end', () => {
    const ltr = renderWeb(drawer())
    expect(itemPadding()).toEqual({ left: '16px', right: '24px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(drawer())
    expect(itemPadding()).toEqual({ left: '24px', right: '16px' })
  })

  // jsdom 20 doesn't remove an inline padding key that React empties, so the
  // layer check reads only the new side.
  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(drawer())
    expect(itemPadding()).toEqual({ left: '16px', right: '24px' })

    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(drawer())
    expect(itemPadding()).toEqual({ left: '24px', right: '16px' })
    expect(corners()).toEqual(endCornersRtl)
    expect(padding('drawer-layer').left).toBe('56px')
  })
})

// react-native-web merges styles by key name. In LTR the library writes the
// logical key, so a consumer style with the same key replaces it. A physical
// `paddingLeft` would stay inline and win over the consumer's class.
describe('a consumer style keeps its precedence over a one-sided key in LTR', () => {
  const consumer = StyleSheet.create({
    item: { paddingStart: 4 },
    sheet: { borderTopStartRadius: 4 },
  })
  const zeroInsets = {
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    frame: { x: 0, y: 0, width: 874, height: 402 },
  }

  it('lets an item paddingStart replace the drawer item padding', () => {
    renderWeb(
      <SafeAreaProvider initialMetrics={zeroInsets}>
        <PortalHost>
          <NavigationDrawer visible onDismiss={() => {}}>
            <NavigationDrawer.Item
              value="home"
              label="Home"
              testID="home"
              style={consumer.item}
            />
          </NavigationDrawer>
        </PortalHost>
      </SafeAreaProvider>,
    )
    const computed = getComputedStyle(screen.getByTestId('home'))
    expect({
      left: computed.paddingLeft,
      right: computed.paddingRight,
    }).toEqual({ left: '4px', right: '24px' })
  })

  it('lets a borderTopStartRadius replace the sheet corner', () => {
    renderWeb(
      <SafeAreaProvider initialMetrics={zeroInsets}>
        <PortalHost>
          <SideSheet
            visible
            onDismiss={() => {}}
            testID="sheet"
            style={consumer.sheet}
          >
            <Text>Sheet</Text>
          </SideSheet>
        </PortalHost>
      </SafeAreaProvider>,
    )
    const computed = getComputedStyle(screen.getByTestId('sheet'))
    expect({
      topLeft: computed.borderTopLeftRadius,
      bottomLeft: computed.borderBottomLeftRadius,
    }).toEqual({ topLeft: '4px', bottomLeft: '16px' })
  })

  // react-native-web ranks a physical class above a logical one, and an inline
  // key above every class. So these styles stay classes, as they were with
  // logical keys, and a consumer `paddingLeft` class still wins. A direct check
  // with a consumer class would depend on rule order: the rule cache can give
  // the library class the rank of a physical rule from an earlier RTL render.
  it('keeps the item padding and the corners out of the inline style', () => {
    const view = renderWeb(
      <SafeAreaProvider initialMetrics={zeroInsets}>
        <PortalHost>
          <NavigationDrawer visible onDismiss={() => {}} testID="drawer">
            <NavigationDrawer.Item value="home" label="Home" testID="home" />
          </NavigationDrawer>
        </PortalHost>
      </SafeAreaProvider>,
    )
    const item = screen.getByTestId('home')
    expect(item.style.paddingLeft).toBe('')
    expect(getComputedStyle(item).paddingLeft).toBe('16px')
    const drawer = screen.getByTestId('drawer')
    expect(drawer.style.borderTopRightRadius).toBe('')
    expect(getComputedStyle(drawer).borderTopRightRadius).toBe('16px')
    view.unmount()

    renderWeb(
      <SafeAreaProvider initialMetrics={zeroInsets}>
        <PortalHost>
          <SideSheet visible onDismiss={() => {}} testID="sheet">
            <Text>Sheet</Text>
          </SideSheet>
        </PortalHost>
      </SafeAreaProvider>,
    )
    const sheet = screen.getByTestId('sheet')
    expect(sheet.style.borderTopLeftRadius).toBe('')
    expect(getComputedStyle(sheet).borderTopLeftRadius).toBe('16px')
  })
})

// A filled button pads 24dp, and 16dp on the side of an icon, with an 8dp gap
// between the icon and the label. In a browser in RTL, both stayed on their
// LTR sides. The container padding is a `StyleSheet` class, so it is read
// with `getComputedStyle`.
describe('Button places its one-sided styles for the document direction', () => {
  const button = (style?: object) => (
    <Button leadingIcon="check" testID="btn" style={style}>
      Save
    </Button>
  )
  const padding = () => {
    const computed = getComputedStyle(screen.getByTestId('btn'))
    return { left: computed.paddingLeft, right: computed.paddingRight }
  }
  const iconGap = () => {
    const { style } = screen.getByText('check').parentElement as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }

  it('pads the icon side 16dp and the other side 24dp', () => {
    const ltr = renderWeb(button())
    expect(padding()).toEqual({ left: '16px', right: '24px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(button())
    expect(padding()).toEqual({ left: '24px', right: '16px' })
  })

  it('puts the icon gap on the side of the label', () => {
    const ltr = renderWeb(button())
    expect(iconGap()).toEqual({ left: '', right: '8px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(button())
    expect(iconGap()).toEqual({ left: '8px', right: '' })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(button())
    expect(padding()).toEqual({ left: '16px', right: '24px' })

    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(button())
    expect(padding()).toEqual({ left: '24px', right: '16px' })
    expect(iconGap().left).toBe('8px')
  })

  // The padding was a class with a logical key before. react-native-web ranks
  // a physical key above a logical one, so a consumer `paddingLeft` won, and a
  // consumer `paddingStart` replaced the key of the same name. Both still do.
  // Trap: react-native-web caches a rule by its physical property and value,
  // so a `paddingLeft: 4` reuses the class and the rank of an earlier
  // `paddingStart: 4`. These values appear in no other test.
  it('lets a consumer padding class win in LTR', () => {
    const consumer = StyleSheet.create({
      physical: { paddingLeft: 3 },
      logical: { paddingStart: 5 },
    })
    const physical = renderWeb(button(consumer.physical))
    expect(padding().left).toBe('3px')
    physical.unmount()

    renderWeb(button(consumer.logical))
    expect(padding().left).toBe('5px')
  })
})

// A ButtonGroup item keeps 8dp between an icon and its label (size small). In
// RTL the gap stayed on the LTR side, away from the label.
describe('ButtonGroup puts the icon gap on the side of the label', () => {
  const group = () => (
    <ButtonGroup
      items={[
        { value: 'day', label: 'Day', leadingIcon: 'calendar' },
        { value: 'week', label: 'Week', trailingIcon: 'chevron-down' },
      ]}
    />
  )
  const margins = (icon: string) => {
    const { style } = screen.getByText(icon).parentElement as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }

  it('in LTR and under dir="rtl"', () => {
    const ltr = renderWeb(group())
    expect(margins('calendar')).toEqual({ left: '', right: '8px' })
    expect(margins('chevron-down')).toEqual({ left: '8px', right: '' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(group())
    expect(margins('calendar')).toEqual({ left: '8px', right: '' })
    expect(margins('chevron-down')).toEqual({ left: '', right: '8px' })
  })

  // jsdom 20 doesn't remove a margin key that React empties, so this reads
  // only the new side.
  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(group())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(group())
    expect(margins('calendar').left).toBe('8px')
    expect(margins('chevron-down').right).toBe('8px')
  })
})

// An extended FAB with an icon pads 16dp on the icon side and 20dp on the text
// side, with 12dp between the icon and the label. In RTL both stayed on their
// LTR sides. The padding is a `StyleSheet` class, read with
// `getComputedStyle`.
describe('FAB places its one-sided styles for the document direction', () => {
  const fab = () => <FAB icon="pencil" label="Compose" testID="fab" />
  const padding = () => {
    const computed = getComputedStyle(screen.getByTestId('fab'))
    return { left: computed.paddingLeft, right: computed.paddingRight }
  }
  const iconGap = () => {
    const { style } = screen.getByText('pencil').parentElement as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }

  it('pads the icon side 16dp and the text side 20dp', () => {
    const ltr = renderWeb(fab())
    expect(padding()).toEqual({ left: '16px', right: '20px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(fab())
    expect(padding()).toEqual({ left: '20px', right: '16px' })
  })

  // A class, as before, so a consumer `style` keeps its precedence: an inline
  // key would beat a consumer `paddingLeft` class.
  it('keeps the padding out of the inline style', () => {
    renderWeb(fab())
    expect(screen.getByTestId('fab').style.paddingLeft).toBe('')
  })

  it('puts the icon gap on the side of the label', () => {
    const ltr = renderWeb(fab())
    expect(iconGap()).toEqual({ left: '', right: '12px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(fab())
    expect(iconGap()).toEqual({ left: '12px', right: '' })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(fab())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(fab())
    expect(padding()).toEqual({ left: '20px', right: '16px' })
    expect(iconGap().left).toBe('12px')
  })
})

// A chip pads 8dp on a side with content and 16dp otherwise, keeps 8dp between
// the label and an icon, an avatar or the close spacer, and places its close
// target 8dp from the end edge. In RTL each stayed on its LTR side, so the
// close target sat at the right, on top of the avatar or the check icon. The
// container padding is a `StyleSheet` class, read with `getComputedStyle`.
describe('Chip places its one-sided styles for the document direction', () => {
  const assist = () => (
    <Chip variant="assist" leadingIcon="star" testID="chip">
      Favorite
    </Chip>
  )
  const input = () => (
    <Chip
      variant="input"
      avatar={<Text>JD</Text>}
      onClose={() => {}}
      testID="chip"
    >
      Ada
    </Chip>
  )
  const padding = () => {
    const computed = getComputedStyle(screen.getByTestId('chip'))
    return { left: computed.paddingLeft, right: computed.paddingRight }
  }
  const margins = (element: Element | null) => {
    const { style } = element as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }

  it('pads 8dp on the side of the icon and 16dp on the other side', () => {
    const ltr = renderWeb(assist())
    expect(padding()).toEqual({ left: '8px', right: '16px' })
    expect(screen.getByTestId('chip').style.paddingLeft).toBe('')
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(assist())
    expect(padding()).toEqual({ left: '16px', right: '8px' })
  })

  it('keeps the icon and avatar gaps on the side of the label', () => {
    const ltr = renderWeb(assist())
    expect(margins(screen.getByText('star').parentElement)).toEqual({
      left: '',
      right: '8px',
    })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    const rtl = renderWeb(assist())
    expect(margins(screen.getByText('star').parentElement)).toEqual({
      left: '8px',
      right: '',
    })
    rtl.unmount()

    renderWeb(input())
    expect(margins(screen.getByText('JD').parentElement)).toEqual({
      left: '8px',
      right: '',
    })
  })

  it('places the close target and its spacer at the end', () => {
    const ltr = renderWeb(input())
    const ltrClose = screen.getByLabelText('Remove Ada')
    expect([ltrClose.style.left, ltrClose.style.right]).toEqual(['', '8px'])
    expect(margins(screen.getByTestId('chip').lastElementChild)).toEqual({
      left: '8px',
      right: '',
    })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(input())
    const rtlClose = screen.getByLabelText('Remove Ada')
    expect([rtlClose.style.left, rtlClose.style.right]).toEqual(['8px', ''])
    expect(margins(screen.getByTestId('chip').lastElementChild)).toEqual({
      left: '',
      right: '8px',
    })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(assist())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(assist())
    expect(padding()).toEqual({ left: '16px', right: '8px' })
    expect(margins(screen.getByText('star').parentElement).left).toBe('8px')
  })
})

// MD3 pads a list item and a list headline 16dp at the start and 24dp at the
// end, and keeps 16dp between the text and the leading or trailing content.
// In RTL each stayed on its LTR side. The padding is a `StyleSheet` class, read
// with `getComputedStyle`.
describe('List places its one-sided styles for the document direction', () => {
  const list = () => (
    <>
      <ListHeadline testID="headline">Mail</ListHeadline>
      <ListItem
        headlineText="Inbox"
        leadingContent={<Text>L</Text>}
        trailingSupportingText="24"
        testID="item"
      />
    </>
  )
  const padding = (testID: string) => {
    const computed = getComputedStyle(screen.getByTestId(testID))
    return { left: computed.paddingLeft, right: computed.paddingRight }
  }
  const margins = (text: string) => {
    const { style } = screen.getByText(text).parentElement as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }

  it('pads an item and a headline 16dp at the start and 24dp at the end', () => {
    const ltr = renderWeb(list())
    expect(padding('item')).toEqual({ left: '16px', right: '24px' })
    expect(padding('headline')).toEqual({ left: '16px', right: '24px' })
    expect(screen.getByTestId('item').style.paddingLeft).toBe('')
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(list())
    expect(padding('item')).toEqual({ left: '24px', right: '16px' })
    expect(padding('headline')).toEqual({ left: '24px', right: '16px' })
  })

  it('keeps the content gaps on the side of the text', () => {
    const ltr = renderWeb(list())
    expect(margins('L')).toEqual({ left: '', right: '16px' })
    expect(margins('24')).toEqual({ left: '16px', right: '' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(list())
    expect(margins('L')).toEqual({ left: '16px', right: '' })
    expect(margins('24')).toEqual({ left: '', right: '16px' })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(list())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(list())
    expect(padding('item')).toEqual({ left: '24px', right: '16px' })
    expect(padding('headline')).toEqual({ left: '24px', right: '16px' })
    expect(margins('L').left).toBe('16px')
  })
})

// A menu item pushes its trailing text, or a trailing icon with no text, to
// the end of the row with an auto start margin. In RTL the auto margin stayed
// on the left, so the trailing content sat beside the label, not at the end.
describe('Menu pushes the trailing content to the end of the row', () => {
  const menu = () => (
    <PortalHost>
      <Menu anchor={null} visible onDismiss={() => {}} variant="vertical">
        <Menu.Group label="Edit">
          <Menu.Item label="Cut" trailingText="Ctrl+X" />
          <Menu.Item label="Share" trailingIcon="chevron-right" />
        </Menu.Group>
      </Menu>
    </PortalHost>
  )
  const margins = (element: Element | null) => {
    const { style } = element as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }
  const trailingText = () => screen.getByText('Ctrl+X')
  const trailingIcon = () => screen.getByText('chevron-right').parentElement

  it('in LTR and under dir="rtl"', () => {
    const ltr = renderWeb(menu())
    expect(margins(trailingText())).toEqual({ left: 'auto', right: '' })
    expect(margins(trailingIcon())).toEqual({ left: 'auto', right: '' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(menu())
    expect(margins(trailingText())).toEqual({ left: '', right: 'auto' })
    expect(margins(trailingIcon())).toEqual({ left: '', right: 'auto' })
  })

  // jsdom 20 doesn't remove a margin key that React empties, so this reads
  // only the new side of the trailing text. The group label keeps both keys.
  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(menu())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(menu())
    expect(trailingText().style.marginRight).toBe('auto')
    const row = screen.getByText('Edit').parentElement as HTMLElement
    expect([row.style.paddingLeft, row.style.paddingRight]).toEqual([
      '4px',
      '12px',
    ])
  })
})

// The full-screen dialog header pads 4dp before the close button and 16dp
// after the actions. In RTL both stayed on their LTR sides.
describe('Dialog places the full-screen header padding for the document direction', () => {
  const dialog = () => (
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
        frame: { x: 0, y: 0, width: 412, height: 900 },
      }}
    >
      <PortalHost>
        <Dialog visible onDismiss={() => {}} variant="fullscreen">
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Content>
            <Text>Body</Text>
          </Dialog.Content>
        </Dialog>
      </PortalHost>
    </SafeAreaProvider>
  )
  // The header is the nearest ancestor of the close button with side padding.
  const padding = () => {
    let element = screen.getByLabelText('Close') as HTMLElement | null
    while (element && !element.style.paddingLeft && !element.style.paddingRight)
      element = element.parentElement
    const style = (element as HTMLElement).style
    return { left: style.paddingLeft, right: style.paddingRight }
  }

  it('pads 4dp at the start and 16dp at the end', () => {
    const ltr = renderWeb(dialog())
    expect(padding()).toEqual({ left: '4px', right: '16px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(dialog())
    expect(padding()).toEqual({ left: '16px', right: '4px' })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(dialog())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(dialog())
    expect(padding()).toEqual({ left: '16px', right: '4px' })
  })
})

// A snackbar pads 16dp at the start, 8dp at the end before an action, and keeps
// 8dp between the message and the action. In RTL each stayed on its LTR side.
// The surface padding is a `StyleSheet` class, read with `getComputedStyle`.
describe('Snackbar places its one-sided styles for the document direction', () => {
  function ShowOnMount() {
    const snackbar = useSnackbar()
    useEffect(() => {
      snackbar.show({
        message: 'Saved',
        actionLabel: 'Undo',
        duration: 'indefinite',
      })
    }, [snackbar])
    return null
  }
  const snackbar = () => (
    <PortalHost>
      <SnackbarProvider>
        <ShowOnMount />
      </SnackbarProvider>
    </PortalHost>
  )
  const padding = (surface: HTMLElement) => {
    const computed = getComputedStyle(surface)
    return { left: computed.paddingLeft, right: computed.paddingRight }
  }
  const gap = (surface: HTMLElement) => {
    const { style } = surface.lastElementChild as HTMLElement
    return { left: style.marginLeft, right: style.marginRight }
  }

  it('pads 16dp at the start and 8dp before the action', async () => {
    const ltr = renderWeb(snackbar())
    const ltrSurface = await screen.findByRole('alert')
    expect(padding(ltrSurface)).toEqual({ left: '16px', right: '8px' })
    expect(ltrSurface.style.paddingLeft).toBe('')
    expect(gap(ltrSurface)).toEqual({ left: '8px', right: '' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(snackbar())
    const rtlSurface = await screen.findByRole('alert')
    expect(padding(rtlSurface)).toEqual({ left: '8px', right: '16px' })
    expect(gap(rtlSurface)).toEqual({ left: '', right: '8px' })
  })
  // jsdom 20 doesn't remove a margin key that React empties, so the gap check
  // reads only the new side. The padding is a class and switches cleanly.
  it('follows a change of the document dir on the next render', async () => {
    const view = renderWeb(snackbar())
    await screen.findByRole('alert')
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(snackbar())
    const surface = screen.getByRole('alert')
    expect(padding(surface)).toEqual({ left: '8px', right: '16px' })
    expect(gap(surface).right).toBe('8px')
  })
})

// An element's nearest ancestor (or itself) with an inline side padding.
function paddedAncestor(element: HTMLElement) {
  let node: HTMLElement | null = element
  while (node && !node.style.paddingLeft && !node.style.paddingRight)
    node = node.parentElement
  if (!node) throw new Error('no ancestor with a side padding')
  return node
}

// The expanded title of a medium bar pads `titleStartInset` plus
// `horizontalPadding` at the start and 16dp at the end. Both are 16dp with the
// default tokens, so the case uses a theme with a 20dp `titleStartInset`.
describe('AppBar places its one-sided styles for the document direction', () => {
  const sides = (node: HTMLElement) => ({
    left: node.style.paddingLeft,
    right: node.style.paddingRight,
  })

  it('pads the expanded title for the document direction', () => {
    const theme = {
      ...lightTheme,
      topAppBar: { ...defaultTopAppBarTokens, titleStartInset: 20 },
    }
    const bar = () => (
      <ThemeProvider theme={theme}>
        <AppBar variant="medium" title="Settings" />
      </ThemeProvider>
    )
    const title = () => paddedAncestor(screen.getByText('Settings'))
    const ltr = renderWeb(bar())
    expect(sides(title())).toEqual({ left: '24px', right: '16px' })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(bar())
    expect(sides(title())).toEqual({ left: '16px', right: '24px' })
  })

  // The overlay keeps both insets, so jsdom shows the swap on a re-render.
  it('follows a change of the document dir on the next render', () => {
    const bar = () => <AppBar title="Inbox" />
    const view = renderWeb(bar())
    const layer = () => screen.getByText('Inbox').parentElement as HTMLElement
    const { left, right } = layer().style
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(bar())
    expect([layer().style.left, layer().style.right]).toEqual([right, left])
  })

  // Reanimated writes each animated frame to `element.style` through
  // `createReactDOMStyle`, which drops a logical key, so the collapse
  // animation of a medium or large bar needs physical keys in LTR too.
  it('gives the collapse animation physical keys in both directions', () => {
    expect([
      resolveAnimatedInsetKey('start'),
      resolveAnimatedInsetKey('end'),
    ]).toEqual(['left', 'right'])
    document.documentElement.setAttribute('dir', 'rtl')
    expect([
      resolveAnimatedInsetKey('start'),
      resolveAnimatedInsetKey('end'),
    ]).toEqual(['right', 'left'])
  })
})

// A bottom app bar keeps 4dp before its first icon button and 16dp between
// the FAB and the end edge. In RTL both stayed on their LTR sides.
describe('BottomAppBar places its one-sided styles for the document direction', () => {
  const bar = () => (
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
        frame: { x: 0, y: 0, width: 412, height: 900 },
      }}
    >
      <BottomAppBar
        actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
        fab={{ icon: 'plus', accessibilityLabel: 'New' }}
      />
    </SafeAreaProvider>
  )
  const fabFrame = () => paddedAncestor(screen.getByLabelText('New'))
  const row = () => fabFrame().parentElement as HTMLElement

  it('pads the row start 4dp and the FAB end 16dp', () => {
    const ltr = renderWeb(bar())
    expect(fabFrame().style.paddingRight).toBe('16px')
    expect(row().style.paddingLeft).toBe('4px')
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(bar())
    expect(fabFrame().style.paddingLeft).toBe('16px')
    expect(fabFrame().style.paddingRight).toBe('')
    expect(row().style.paddingRight).toBe('4px')
    expect(row().style.paddingLeft).toBe('')
  })

  // jsdom 20 doesn't remove a padding key that React empties, so this reads
  // only the new side.
  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(bar())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(bar())
    expect(fabFrame().style.paddingLeft).toBe('16px')
    expect(row().style.paddingRight).toBe('4px')
  })
})

// A divider with `insetStart` keeps 56dp at the start and none at the end. In
// RTL the inset stayed on the left. The insets are a `StyleSheet` class, read
// with `getComputedStyle`.
describe('Divider places its insets for the document direction', () => {
  const divider = () => <Divider insetStart testID="divider" />
  const margins = () => {
    const computed = getComputedStyle(screen.getByTestId('divider'))
    return { left: computed.marginLeft, right: computed.marginRight }
  }

  it('in LTR and under dir="rtl"', () => {
    const ltr = renderWeb(divider())
    expect(margins()).toEqual({ left: '56px', right: '0px' })
    expect(screen.getByTestId('divider').style.marginLeft).toBe('')
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(divider())
    expect(margins()).toEqual({ left: '0px', right: '56px' })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(divider())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(divider())
    expect(margins()).toEqual({ left: '0px', right: '56px' })
  })
})

// An anchored badge sits on the top-end corner of its anchor: a zero-size
// point at the end, and the badge pulled 12dp (6dp small) back from it. In RTL
// both stayed on the LTR side, so the badge sat on the wrong corner. The pull
// is a `StyleSheet` class, read with `getComputedStyle`.
describe('Badge sits on the top-end corner for the document direction', () => {
  const badge = (label?: string) => (
    <Badge label={label} testID="badge">
      <Text>Inbox</Text>
    </Badge>
  )
  const offset = () => {
    const computed = getComputedStyle(screen.getByTestId('badge'))
    return { left: computed.left, right: computed.right }
  }
  const point = () => {
    const { style } = screen.getByTestId('badge').parentElement as HTMLElement
    return { left: style.left, right: style.right }
  }

  it('in LTR and under dir="rtl"', () => {
    const ltr = renderWeb(badge('3'))
    expect(offset().left).toBe('-12px')
    expect(point()).toEqual({ left: '', right: '0px' })
    expect(screen.getByTestId('badge').style.left).toBe('')
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    const rtl = renderWeb(badge('3'))
    expect(offset().right).toBe('-12px')
    expect(point()).toEqual({ left: '0px', right: '' })
    rtl.unmount()

    renderWeb(badge())
    expect(offset().right).toBe('-6px')
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(badge('3'))
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(badge('3'))
    expect(offset().right).toBe('-12px')
    expect(point().left).toBe('0px')
  })
})

// `Box` and `Switch` resolved their one-sided keys inside a memo, so they kept
// the direction of the first render after a runtime change of `dir`.
describe('Box and Switch follow a change of the document dir', () => {
  it('swaps the Box start and end padding on the next render', () => {
    const box = () => <Box ps={16} pe={4} testID="box" />
    const view = renderWeb(box())
    const sides = () => {
      const { style } = screen.getByTestId('box')
      return { left: style.paddingLeft, right: style.paddingRight }
    }
    expect(sides()).toEqual({ left: '16px', right: '4px' })

    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(box())
    expect(sides()).toEqual({ left: '4px', right: '16px' })
  })

  // The halo is centred on the thumb: half the track height from the start
  // edge, less the border and half the halo.
  it('moves the Switch halo to the start edge on the next render', () => {
    const halo = `${
      SWITCH_TRACK_HEIGHT / 2 -
      SWITCH_TRACK_BORDER_WIDTH -
      SWITCH_STATE_LAYER_SIZE / 2
    }px`
    const toggle = () => <Switch value={false} />
    // Only the switch is on the page, so the halo is the one node at that
    // offset.
    const haloNode = () =>
      Array.from(document.body.querySelectorAll<HTMLElement>('*')).find(
        (node) => node.style.left === halo || node.style.right === halo,
      )
    const view = renderWeb(toggle())
    expect(haloNode()?.style.left).toBe(halo)

    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(toggle())
    expect(haloNode()?.style.right).toBe(halo)
  })
})

// A connected group rounds the outer corners of its first and last items. The
// radii are physical keys: React Native swaps them in an RTL layout on native,
// and react-native-web never does. In a browser in RTL the first item sat at
// the right with its round corners on its inner side.
describe('ButtonGroup rounds the outer corners of a connected group', () => {
  const group = () => (
    <ButtonGroup
      variant="connected"
      items={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ]}
    />
  )
  // The item is the nearest ancestor of its label with inline radii.
  const corners = (label: string) => {
    let node = screen.getByText(label) as HTMLElement | null
    while (node && !node.style.borderTopLeftRadius) node = node.parentElement
    const style = (node as HTMLElement).style
    return {
      left: [style.borderTopLeftRadius, style.borderBottomLeftRadius],
      right: [style.borderTopRightRadius, style.borderBottomRightRadius],
    }
  }
  const outer = `${lightTheme.shape.cornerFull}px`
  const inner = `${lightTheme.shape.cornerExtraSmall}px`

  it('in LTR and under dir="rtl"', () => {
    const ltr = renderWeb(group())
    expect(corners('Day')).toEqual({
      left: [outer, outer],
      right: [inner, inner],
    })
    expect(corners('Month')).toEqual({
      left: [inner, inner],
      right: [outer, outer],
    })
    ltr.unmount()

    document.documentElement.setAttribute('dir', 'rtl')
    renderWeb(group())
    expect(corners('Day')).toEqual({
      left: [inner, inner],
      right: [outer, outer],
    })
    expect(corners('Month')).toEqual({
      left: [outer, outer],
      right: [inner, inner],
    })
  })

  it('follows a change of the document dir on the next render', () => {
    const view = renderWeb(group())
    document.documentElement.setAttribute('dir', 'rtl')
    view.rerender(group())
    expect(corners('Day').right).toEqual([outer, outer])
  })
})
