import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { I18nManager, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ReactTestInstance } from 'react-test-renderer'
import { Button } from '../button'
import { Divider } from '../divider/Divider'
import { IconButton } from '../icon-button'
import { PortalHost } from '../portal/PortalHost'
import { SideSheet } from '../side-sheet'

type SheetProps = React.ComponentProps<typeof SideSheet>

function getStyle(node: ReactTestInstance) {
  return StyleSheet.flatten(node.props.style)
}

/** The header row is the only host view with the 72dp header height. */
function getHeaderStyle() {
  const header = screen
    .UNSAFE_getAllByType(View)
    .find((node) => getStyle(node)?.minHeight === 72)
  if (header === undefined) throw new Error('no header row')
  return getStyle(header)
}

const INSETS = { top: 47, right: 0, bottom: 34, left: 0 }

function withInsets(ui: React.ReactElement) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        insets: INSETS,
        frame: { x: 0, y: 0, width: 402, height: 874 },
      }}
    >
      {ui}
    </SafeAreaProvider>
  )
}

function paddedByInsets() {
  return screen.UNSAFE_getAllByType(View).filter((node) => {
    const style = getStyle(node)
    return (
      style?.paddingTop === INSETS.top && style?.paddingBottom === INSETS.bottom
    )
  })
}

function renderModal(
  props?: Partial<Exclude<SheetProps, { variant: 'standard' }>>,
) {
  return renderWithTheme(
    <PortalHost>
      <SideSheet
        visible
        onDismiss={jest.fn()}
        headline="Filters"
        testID="sheet"
        {...props}
      >
        <Text>Body</Text>
      </SideSheet>
    </PortalHost>,
  )
}

function renderStandard(
  props?: Partial<Extract<SheetProps, { variant: 'standard' }>>,
) {
  return renderWithTheme(
    <SideSheet variant="standard" headline="Filters" testID="sheet" {...props}>
      <Text>Body</Text>
    </SideSheet>,
  )
}

describe('SideSheet — standard', () => {
  it('renders in place as a named complementary region', () => {
    renderStandard()
    expect(screen.getByText('Body')).toBeTruthy()
    const surface = screen.getByTestId('sheet')
    expect(surface.props.role).toBe('complementary')
    expect(surface.props.accessibilityLabel).toBe('Filters')
  })

  it('takes the name from accessibilityLabel before the headline', () => {
    renderStandard({ accessibilityLabel: 'Search filters' })
    expect(screen.getByTestId('sheet').props.accessibilityLabel).toBe(
      'Search filters',
    )
  })

  it('applies the MD3 standard tokens', () => {
    renderStandard()
    const surface = getStyle(screen.getByTestId('sheet'))
    expect(surface.width).toBe(256)
    expect(surface.alignSelf).toBe('stretch')
    expect(surface.backgroundColor).toBe(lightTheme.colors.surface)
    expect(surface.borderRadius).toBeUndefined()
    expect(surface.borderTopStartRadius).toBeUndefined()
    expect(surface.shadowOpacity).toBeUndefined()

    const headline = getStyle(screen.getByText('Filters'))
    expect(headline.fontSize).toBe(lightTheme.typography.titleLarge.fontSize)
    expect(headline.color).toBe(lightTheme.colors.onSurface)

    const header = getHeaderStyle()
    expect(header.paddingStart).toBe(24)
    expect(header.paddingEnd).toBe(24)
  })

  it('marks the headline as a heading, level 2 by default', () => {
    renderStandard()
    const headline = screen.getByText('Filters')
    expect(headline.props.role).toBe('heading')
    expect(headline.props['aria-level']).toBe(2)
  })

  it('follows headingLevel', () => {
    renderStandard({ headingLevel: 3 })
    expect(screen.getByText('Filters').props['aria-level']).toBe(3)
  })

  it('shows no close button without onDismiss', () => {
    renderStandard()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('shows a close button with onDismiss and calls it', () => {
    const onDismiss = jest.fn()
    renderStandard({ onDismiss })
    fireEvent.press(screen.getByRole('button', { name: 'Close' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(getHeaderStyle().paddingEnd).toBe(16)
  })

  it('shows a back button with onBack and calls it', () => {
    const onBack = jest.fn()
    renderStandard({ onBack, backAccessibilityLabel: 'Back to filters' })
    fireEvent.press(screen.getByRole('button', { name: 'Back to filters' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(getHeaderStyle().paddingStart).toBe(16)
  })

  it('keeps the close button at the end when there is no headline', () => {
    renderStandard({ headline: undefined, onDismiss: jest.fn() })
    expect(screen.queryByRole('header')).toBeNull()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
  })

  it('renders no header with nothing to put in it', () => {
    renderStandard({ headline: undefined })
    expect(screen.queryByText('Filters')).toBeNull()
    expect(
      screen
        .UNSAFE_getAllByType(View)
        .some((n) => getStyle(n)?.minHeight === 72),
    ).toBe(false)
    const body = StyleSheet.flatten(
      screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle,
    )
    expect(body.paddingTop).toBe(24)
  })

  it('pads the content on the 24dp keyline below a header', () => {
    renderStandard()
    const body = StyleSheet.flatten(
      screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle,
    )
    expect(body.paddingHorizontal).toBe(24)
    expect(body.paddingTop).toBeUndefined()
  })

  it('renders the actions below a divider', () => {
    renderStandard({ actions: <Button>Save</Button> })
    expect(screen.getByText('Save')).toBeTruthy()
    expect(screen.UNSAFE_queryAllByType(Divider)).toHaveLength(1)
  })

  it('drops the divider with showActionsDivider={false}', () => {
    renderStandard({
      actions: <Button>Save</Button>,
      showActionsDivider: false,
    })
    expect(screen.UNSAFE_queryAllByType(Divider)).toHaveLength(0)
  })

  it('renders no divider without actions', () => {
    renderStandard({ actions: false })
    expect(screen.UNSAFE_queryAllByType(Divider)).toHaveLength(0)
  })

  it('leaves the safe area to an ancestor by default', () => {
    renderWithTheme(
      withInsets(
        <SideSheet variant="standard">
          <Text>Body</Text>
        </SideSheet>,
      ),
    )
    expect(paddedByInsets()).toHaveLength(0)
  })

  it('insets and rounds a detached sheet', () => {
    renderStandard({ detached: true })
    const surface = getStyle(screen.getByTestId('sheet'))
    expect(surface.margin).toBe(16)
    expect(surface.borderRadius).toBe(lightTheme.shape.cornerLarge)
  })

  it('honours the color, width and headline overrides', () => {
    renderStandard({
      onDismiss: jest.fn(),
      containerColor: '#101010',
      contentColor: '#202020',
      headlineStyle: { fontWeight: '700' },
      width: 320,
    })
    const surface = getStyle(screen.getByTestId('sheet'))
    expect(surface.backgroundColor).toBe('#101010')
    expect(surface.width).toBe(320)
    const headline = getStyle(screen.getByText('Filters'))
    expect(headline.color).toBe('#202020')
    expect(headline.fontWeight).toBe('700')
    expect(screen.UNSAFE_getByType(IconButton).props.contentColor).toBe(
      '#202020',
    )
  })

  it('tints the header icons onSurfaceVariant by default', () => {
    renderStandard({ onDismiss: jest.fn(), onBack: jest.fn() })
    for (const button of screen.UNSAFE_getAllByType(IconButton)) {
      expect(button.props.contentColor).toBe(lightTheme.colors.onSurfaceVariant)
    }
  })

  // A standard sheet has no scrim, so the type rejects the modal props on it.
  // The expect-error directive is the assertion: it fails the build if the
  // union ever stops rejecting them.
  it('rejects modal props at the type level', () => {
    renderWithTheme(
      // @ts-expect-error - a standard sheet takes no `visible`
      <SideSheet variant="standard" visible>
        <Text>Body</Text>
      </SideSheet>,
    )
    expect(screen.getByText('Body')).toBeTruthy()
  })
})

describe('SideSheet — modal', () => {
  it('renders nothing while not visible', () => {
    renderModal({ visible: false })
    expect(screen.queryByText('Body')).toBeNull()
  })

  it('renders through the portal with a scrim and a dialog surface', async () => {
    renderModal()
    expect(await screen.findByText('Body')).toBeTruthy()
    expect(screen.getByTestId('sheet-scrim')).toBeTruthy()
    const surface = screen.getByTestId('sheet')
    expect(surface.props.role).toBe('dialog')
    expect(surface.props['aria-modal']).toBe(true)
    expect(surface.props.accessibilityViewIsModal).toBe(true)
    expect(surface.props.accessibilityLabel).toBe('Filters')
  })

  it('applies the modal container tokens at the end edge', async () => {
    renderModal()
    const surface = getStyle(await screen.findByTestId('sheet'))
    expect(surface.backgroundColor).toBe(lightTheme.colors.surfaceContainerLow)
    expect(surface.width).toBe(256)
    expect(surface.flexShrink).toBe(1)
    expect(surface.borderTopStartRadius).toBe(lightTheme.shape.cornerLarge)
    expect(surface.borderBottomStartRadius).toBe(lightTheme.shape.cornerLarge)
    expect(surface.borderTopEndRadius).toBeUndefined()

    const layer = getStyle(screen.getByTestId('sheet-layer'))
    expect(layer.justifyContent).toBe('flex-end')
    expect(layer.paddingStart).toBe(56)
  })

  it('rounds the other corners at the start edge', async () => {
    renderModal({ edge: 'start' })
    const surface = getStyle(await screen.findByTestId('sheet'))
    expect(surface.borderTopEndRadius).toBe(lightTheme.shape.cornerLarge)
    expect(surface.borderBottomEndRadius).toBe(lightTheme.shape.cornerLarge)
    expect(surface.borderTopStartRadius).toBeUndefined()

    const layer = getStyle(screen.getByTestId('sheet-layer'))
    expect(layer.justifyContent).toBe('flex-start')
    expect(layer.paddingEnd).toBe(56)
  })

  it('always shows the close button, and it dismisses', async () => {
    const onDismiss = jest.fn()
    renderModal({ onDismiss })
    fireEvent.press(await screen.findByRole('button', { name: 'Close' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses on a scrim press', async () => {
    const onDismiss = jest.fn()
    renderModal({ onDismiss })
    await screen.findByText('Body')
    fireEvent.press(screen.getByLabelText('Close side sheet'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('ignores the scrim but keeps the close button when not dismissable', async () => {
    const onDismiss = jest.fn()
    renderModal({ onDismiss, dismissable: false })
    await screen.findByText('Body')
    const scrim = screen.UNSAFE_getByProps({
      accessibilityLabel: 'Close side sheet',
    })
    expect(scrim.props.disabled).toBe(true)
    fireEvent.press(scrim)
    expect(onDismiss).not.toHaveBeenCalled()

    fireEvent.press(screen.getByRole('button', { name: 'Close' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('pads the content by the top and bottom safe area by default', async () => {
    renderWithTheme(
      withInsets(
        <PortalHost>
          <SideSheet visible onDismiss={jest.fn()}>
            <Text>Body</Text>
          </SideSheet>
        </PortalHost>,
      ),
    )
    await screen.findByText('Body')
    expect(paddedByInsets()).toHaveLength(1)
  })

  // What the first frame paints: `renderWithTheme` is a single pass, so the
  // layer reads its `initial` value, the hidden offset.
  describe('entrance', () => {
    async function hiddenTranslateX(
      props?: Partial<Exclude<SheetProps, { variant: 'standard' }>>,
    ) {
      renderModal(props)
      const layer = getStyle(await screen.findByTestId('sheet-layer'))
      return layer.transform
    }

    it('starts one width off the right edge at the end edge', async () => {
      expect(await hiddenTranslateX()).toEqual([{ translateX: 256 }])
    })

    it('starts off the left edge at the start edge', async () => {
      expect(await hiddenTranslateX({ edge: 'start' })).toEqual([
        { translateX: -256 },
      ])
    })

    it('travels the width and the detached margin', async () => {
      expect(await hiddenTranslateX({ detached: true, width: 300 })).toEqual([
        { translateX: 316 },
      ])
    })

    describe('in RTL', () => {
      const original = I18nManager.isRTL
      beforeEach(() => {
        Object.defineProperty(I18nManager, 'isRTL', {
          value: true,
          configurable: true,
        })
      })
      afterEach(() => {
        Object.defineProperty(I18nManager, 'isRTL', {
          value: original,
          configurable: true,
        })
      })

      it('enters the end edge from the left', async () => {
        expect(await hiddenTranslateX()).toEqual([{ translateX: -256 }])
      })

      it('enters the start edge from the right', async () => {
        expect(await hiddenTranslateX({ edge: 'start' })).toEqual([
          { translateX: 256 },
        ])
      })
    })

    it('settles in place', async () => {
      renderSettled(
        <PortalHost>
          <SideSheet visible onDismiss={jest.fn()} testID="sheet">
            <Text>Body</Text>
          </SideSheet>
        </PortalHost>,
      )
      const layer = getStyle(await screen.findByTestId('sheet-layer'))
      expect(layer.transform).toEqual([{ translateX: 0 }])
      expect(getStyle(screen.getByTestId('sheet-scrim')).opacity).toBe(1)
    })
  })

  it('rejects a modal sheet with no onDismiss at the type level', () => {
    renderWithTheme(
      <PortalHost>
        {/* @ts-expect-error - a modal sheet needs `onDismiss` */}
        <SideSheet visible>
          <Text>Body</Text>
        </SideSheet>
      </PortalHost>,
    )
  })
})
