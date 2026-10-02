/**
 * The web half of the safe-area wrapper.
 *
 * `safe-area.test.tsx` proves the native split: the package's `SafeAreaView`
 * outside a provider, padding from context inside one. On web the package has
 * no native view. Its `SafeAreaView.web` calls `useSafeAreaInsets()`, which
 * throws without a provider, so the documented three-provider root rendered a
 * blank page in a browser. The mock in `jest.setup.web.cjs` throws the same
 * way, and the first test here guards that, so the rest cannot pass against a
 * mock that is softer than the real package.
 */
import { screen } from '@testing-library/react'
import { Text } from 'react-native'
import {
  SafeAreaProvider,
  SafeAreaView as PackageSafeAreaView,
} from 'react-native-safe-area-context'
import { PortalHost } from '../../portal'
import { SafeAreaView } from '../../safe-area'
import { SnackbarProvider } from '../../snackbar'
import { renderWeb } from './render-web'

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

function silenceReactErrorLog() {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  return () => spy.mockRestore()
}

describe('SafeAreaView on web', () => {
  it("the package's own SafeAreaView throws without a provider", () => {
    const restore = silenceReactErrorLog()
    expect(() => renderWeb(<PackageSafeAreaView />)).toThrow(
      /No safe area value available/,
    )
    restore()
  })

  it('renders a plain View with zero insets without a provider', () => {
    renderWeb(
      <SafeAreaView testID="area" edges={['top']} style={{ paddingTop: 8 }}>
        <Text>content</Text>
      </SafeAreaView>,
    )
    const node = screen.getByTestId('area')
    expect(node.tagName).toBe('DIV')
    expect(getComputedStyle(node).paddingTop).toBe('8px')
    expect(screen.getByText('content')).toBeTruthy()
  })

  it('pads from context inside a provider', () => {
    renderWeb(
      withProvider(
        <SafeAreaView
          testID="area"
          edges={['top', 'bottom']}
          style={{ paddingTop: 8 }}
        />,
      ),
    )
    const node = screen.getByTestId('area')
    expect(getComputedStyle(node).paddingTop).toBe('55px')
    expect(getComputedStyle(node).paddingBottom).toBe('34px')
  })

  it('the documented root mounts without a provider', () => {
    renderWeb(
      <PortalHost>
        <SnackbarProvider>
          <Text>app</Text>
        </SnackbarProvider>
      </PortalHost>,
    )
    expect(screen.getByText('app')).toBeTruthy()
  })
})
