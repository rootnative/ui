import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppBar } from '../appbar/AppBar'
import { Layout } from '../layout/Layout'
import { SafeAreaView } from '../safe-area'
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
})
