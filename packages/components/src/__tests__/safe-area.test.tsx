import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { I18nManager, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppBar } from '../appbar/AppBar'
import { Layout } from '../layout/Layout'
import { NavigationBar } from '../navigation-bar/NavigationBar'
import { SafeAreaView, physicalLeftStyle } from '../safe-area'
import { childrenOf, rootOf } from '../test-support/rendered-node'

const insets = { top: 47, right: 0, bottom: 34, left: 0 }

function withProvider(ui: React.ReactElement) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        insets,
        frame: { x: 0, y: 0, width: 402, height: 874 },
      }}
    >
      {ui}
    </SafeAreaProvider>
  )
}

// Landscape on a phone with a Dynamic Island: the island is on one side, and
// the home indicator inset shrinks.
const landscapeInsets = { top: 0, right: 62, bottom: 21, left: 62 }

function inLandscape(ui: React.ReactElement) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        insets: landscapeInsets,
        frame: { x: 0, y: 0, width: 874, height: 402 },
      }}
    >
      {ui}
    </SafeAreaProvider>
  )
}

const NAV_ITEMS = [
  { value: 'home', label: 'Home', icon: 'home' },
  { value: 'search', label: 'Search', icon: 'magnify' },
]

function flatStyle(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style)
}

describe('SafeAreaView', () => {
  it('renders the native SafeAreaView outside a provider', () => {
    renderWithTheme(<SafeAreaView testID="area" edges={['top']} />)
    expect(screen.getByTestId('area').props.edges).toEqual(['top'])
  })

  it('pads from context on the first render inside a provider', () => {
    renderWithTheme(
      withProvider(<SafeAreaView testID="area" edges={['top']} />),
    )
    const node = screen.getByTestId('area')
    expect(node.props.edges).toBeUndefined()
    expect(flatStyle('area')).toMatchObject({
      paddingTop: 47,
      paddingBottom: 0,
    })
  })

  it('adds the inset to the padding the style already carries', () => {
    renderWithTheme(
      withProvider(
        <SafeAreaView
          testID="area"
          edges={['top', 'bottom']}
          style={{ paddingVertical: 10, paddingTop: 4 }}
        />,
      ),
    )
    expect(flatStyle('area')).toMatchObject({
      paddingTop: 51,
      paddingBottom: 44,
      paddingLeft: 0,
      paddingRight: 0,
    })
  })

  it('pads every edge when edges is not given', () => {
    renderWithTheme(
      withProvider(<SafeAreaView testID="area" edges={undefined} />),
    )
    expect(flatStyle('area')).toMatchObject({
      paddingTop: 47,
      paddingBottom: 34,
    })
  })

  it('AppBar insetTop pads the bar by the top inset on the first paint', () => {
    const { toJSON } = renderWithTheme(
      withProvider(<AppBar title="About" insetTop testID="bar" />),
    )
    const inset = childrenOf(rootOf(toJSON()))[0]
    expect(StyleSheet.flatten(inset.props.style).paddingTop).toBe(47)
  })

  it('Layout pads the requested edges from the provider insets', () => {
    const { toJSON } = renderWithTheme(
      withProvider(<Layout edges={['top', 'bottom']}>{null}</Layout>),
    )
    expect(StyleSheet.flatten(rootOf(toJSON()).props.style)).toMatchObject({
      paddingTop: 47,
      paddingBottom: 34,
    })
  })

  it('Layout pads the sides and the bottom by default, not the top', () => {
    const { toJSON } = renderWithTheme(inLandscape(<Layout>{null}</Layout>))
    expect(StyleSheet.flatten(rootOf(toJSON()).props.style)).toMatchObject({
      paddingTop: 0,
      paddingRight: 62,
      paddingBottom: 21,
      paddingLeft: 62,
    })
  })

  describe('the bars in landscape', () => {
    it('AppBar pads its content by the side insets outside a Layout', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(<AppBar title="About" testID="bar" />),
      )
      const bar = rootOf(toJSON())
      const barStyle = StyleSheet.flatten(bar.props.style)
      expect(barStyle.marginLeft).toBeUndefined()
      expect(barStyle.marginRight).toBeUndefined()
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingTop: 0,
        paddingLeft: 62,
        paddingRight: 62,
      })
    })

    it('AppBar bleeds through the side padding of a Layout', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout>
            <AppBar title="About" testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: -62,
        marginRight: -62,
      })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 62,
        paddingRight: 62,
      })
    })

    it('AppBar bleeds only through the sides the Layout pads', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout edges={['left', 'bottom']}>
            <AppBar title="About" testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      const barStyle = StyleSheet.flatten(bar.props.style)
      expect(barStyle).toMatchObject({ marginLeft: -62, marginRight: 0 })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 62,
        paddingRight: 62,
      })
    })

    it('a Layout with no side edge adds no margin to the bar', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout edges={['bottom']}>
            <AppBar title="About" testID="bar" />
          </Layout>,
        ),
      )
      const barStyle = StyleSheet.flatten(
        childrenOf(rootOf(toJSON()))[0].props.style,
      )
      expect(barStyle.marginLeft).toBeUndefined()
      expect(barStyle.marginRight).toBeUndefined()
    })

    it('insetSides={false} turns the side padding and the bleed off', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout>
            <AppBar title="About" insetSides={false} testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      const barStyle = StyleSheet.flatten(bar.props.style)
      expect(barStyle.marginLeft).toBeUndefined()
      expect(barStyle.marginRight).toBeUndefined()
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 0,
        paddingRight: 0,
      })
    })

    // A bar beside a start-edge rail touches the screen at its end only. A
    // bleed through the start padding would pull its background over the rail.
    it('insetSides="end" pads and bleeds through the end side only', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout>
            <AppBar title="About" insetSides="end" testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: 0,
        marginRight: -62,
      })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 0,
        paddingRight: 62,
      })
    })

    it('insetSides="start" pads and bleeds through the start side only', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout>
            <AppBar title="About" insetSides="start" testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: -62,
        marginRight: 0,
      })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 62,
        paddingRight: 0,
      })
    })

    it('NavigationBar bleeds through the side padding of a Layout', () => {
      const { toJSON } = renderWithTheme(
        inLandscape(
          <Layout>
            <NavigationBar items={NAV_ITEMS} testID="nav" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: -62,
        marginRight: -62,
      })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 62,
        paddingRight: 62,
        paddingBottom: 0,
      })
    })
  })

  // An Android cutout sits on one side only, here the physical left. In RTL,
  // React Native puts a `...Right` key on the left side, so the inset of the
  // left edge must go into `paddingRight` and `marginRight`.
  describe('in RTL with a cutout on one side', () => {
    const cutoutInsets = { top: 0, right: 0, bottom: 24, left: 54 }
    const original = {
      isRTL: I18nManager.isRTL,
      doLeftAndRightSwapInRTL: I18nManager.doLeftAndRightSwapInRTL,
    }

    function setDirection(isRTL: boolean, doLeftAndRightSwapInRTL: boolean) {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: isRTL,
        configurable: true,
      })
      Object.defineProperty(I18nManager, 'doLeftAndRightSwapInRTL', {
        value: doLeftAndRightSwapInRTL,
        configurable: true,
      })
    }

    function withCutout(ui: React.ReactElement) {
      return (
        <SafeAreaProvider
          initialMetrics={{
            insets: cutoutInsets,
            frame: { x: 0, y: 0, width: 923, height: 411 },
          }}
        >
          {ui}
        </SafeAreaProvider>
      )
    }

    beforeEach(() => setDirection(true, true))
    afterEach(() =>
      setDirection(original.isRTL, original.doLeftAndRightSwapInRTL),
    )

    it('Layout writes the left inset into the key that lands on the left', () => {
      const { toJSON } = renderWithTheme(withCutout(<Layout>{null}</Layout>))
      expect(StyleSheet.flatten(rootOf(toJSON()).props.style)).toMatchObject({
        paddingLeft: 0,
        paddingRight: 54,
        paddingBottom: 24,
      })
    })

    it('AppBar bleeds and pads on the side of the cutout', () => {
      const { toJSON } = renderWithTheme(
        withCutout(
          <Layout>
            <AppBar title="About" testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: 0,
        marginRight: -54,
      })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 0,
        paddingRight: 54,
      })
    })

    // In RTL the rail sits on the right, so the end of the bar is the left
    // side, where the cutout is.
    it('insetSides="end" pads and bleeds on the left side', () => {
      const { toJSON } = renderWithTheme(
        withCutout(
          <Layout>
            <AppBar title="About" insetSides="end" testID="bar" />
          </Layout>,
        ),
      )
      const bar = childrenOf(rootOf(toJSON()))[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: 0,
        marginRight: -54,
      })
      expect(StyleSheet.flatten(childrenOf(bar)[0].props.style)).toMatchObject({
        paddingLeft: 0,
        paddingRight: 54,
      })
    })

    it('puts a physical left offset into the key that lands on the left', () => {
      expect(physicalLeftStyle(30)).toEqual({ right: 30 })
      setDirection(true, false)
      expect(physicalLeftStyle(30)).toEqual({ left: 30 })
      setDirection(false, true)
      expect(physicalLeftStyle(30)).toEqual({ left: 30 })
    })

    it('keeps the keys physical when the app turns the swap off', () => {
      setDirection(true, false)
      const { toJSON } = renderWithTheme(
        withCutout(
          <Layout>
            <AppBar title="About" testID="bar" />
          </Layout>,
        ),
      )
      const layout = rootOf(toJSON())
      expect(StyleSheet.flatten(layout.props.style)).toMatchObject({
        paddingLeft: 54,
        paddingRight: 0,
      })
      const bar = childrenOf(layout)[0]
      expect(StyleSheet.flatten(bar.props.style)).toMatchObject({
        marginLeft: -54,
        marginRight: 0,
      })
    })
  })
})
