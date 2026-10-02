import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { NavigationDrawer } from '../navigation-drawer'
import { PortalHost } from '../portal/PortalHost'

function Items() {
  return (
    <>
      <NavigationDrawer.Section headline="Mail">
        <NavigationDrawer.Item
          value="inbox"
          label="Inbox"
          icon="inbox"
          badge={24}
          testID="inbox"
        />
        <NavigationDrawer.Item
          value="outbox"
          label="Outbox"
          icon="send-outline"
          testID="outbox"
        />
      </NavigationDrawer.Section>
      <NavigationDrawer.Divider testID="divider" />
      <NavigationDrawer.Section headline="Labels">
        <NavigationDrawer.Item value="family" label="Family" />
        <NavigationDrawer.Item value="archive" label="Archive" disabled />
      </NavigationDrawer.Section>
    </>
  )
}

function renderModal(
  props?: Partial<React.ComponentProps<typeof NavigationDrawer>>,
) {
  return renderWithTheme(
    <PortalHost>
      <NavigationDrawer
        visible
        onDismiss={jest.fn()}
        defaultValue="inbox"
        testID="drawer"
        {...props}
      >
        <Items />
      </NavigationDrawer>
    </PortalHost>,
  )
}

function renderStandard(
  props?: Partial<React.ComponentProps<typeof NavigationDrawer>>,
) {
  return renderWithTheme(
    <NavigationDrawer
      variant="standard"
      defaultValue="inbox"
      testID="drawer"
      {...props}
    >
      <Items />
    </NavigationDrawer>,
  )
}

describe('NavigationDrawer — standard', () => {
  it('renders in place with sections, items, and a divider', () => {
    renderStandard()
    expect(screen.getByText('Mail')).toBeTruthy()
    expect(screen.getByText('Labels')).toBeTruthy()
    expect(screen.getByText('Inbox')).toBeTruthy()
    expect(screen.getByText('24')).toBeTruthy()
    expect(screen.getByTestId('divider')).toBeTruthy()
  })

  it('is announced as navigation with the given name', () => {
    renderStandard({ accessibilityLabel: 'Main navigation' })
    const surface = screen.getByTestId('drawer')
    expect(surface.props.role).toBe('navigation')
    expect(surface.props.accessibilityLabel).toBe('Main navigation')
  })

  it('marks the default destination selected and the others not', () => {
    renderStandard()
    expect(
      screen.getByRole('tab', { name: 'Inbox' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(
      screen.getByRole('tab', { name: 'Outbox' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })

  it('has no active destination without defaultValue', () => {
    renderStandard({ defaultValue: undefined })
    expect(
      screen.getByRole('tab', { name: 'Inbox' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })

  it('moves the selection on press and reports the value', () => {
    const onValueChange = jest.fn()
    const onPress = jest.fn()
    renderWithTheme(
      <NavigationDrawer variant="standard" onValueChange={onValueChange}>
        <NavigationDrawer.Item value="a" label="A" onPress={onPress} />
        <NavigationDrawer.Item value="b" label="B" />
      </NavigationDrawer>,
    )
    fireEvent.press(screen.getByRole('tab', { name: 'A' }))
    expect(onValueChange).toHaveBeenCalledWith('a')
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('tab', { name: 'A' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('never moves itself when the value is driven from outside', () => {
    const onValueChange = jest.fn()
    renderStandard({ value: 'inbox', onValueChange })
    fireEvent.press(screen.getByRole('tab', { name: 'Outbox' }))
    expect(onValueChange).toHaveBeenCalledWith('outbox')
    expect(
      screen.getByRole('tab', { name: 'Inbox' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('does not respond while a destination is disabled', () => {
    const onValueChange = jest.fn()
    renderStandard({ onValueChange })
    const item = screen.getByRole('tab', { name: 'Archive' })
    expect(item.props.accessibilityState).toMatchObject({ disabled: true })
    fireEvent.press(item)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('applies the MD3 tokens', () => {
    renderStandard()
    const surface = StyleSheet.flatten(screen.getByTestId('drawer').props.style)
    expect(surface.width).toBe(360)
    expect(surface.backgroundColor).toBe(lightTheme.colors.surface)

    const row = StyleSheet.flatten(screen.getByTestId('inbox').props.style)
    expect(row.height).toBe(56)
    expect(row.borderRadius).toBe(lightTheme.shape.cornerFull)
    expect(row.paddingStart).toBe(16)
    expect(row.paddingEnd).toBe(24)

    const indicator = StyleSheet.flatten(
      screen.getByTestId('inbox-indicator').props.style,
    )
    expect(indicator.opacity).toBe(1)
    expect(indicator.backgroundColor).toBe(lightTheme.colors.secondaryContainer)
    expect(
      StyleSheet.flatten(screen.getByTestId('outbox-indicator').props.style)
        .opacity,
    ).toBe(0)

    const active = StyleSheet.flatten(screen.getByText('Inbox').props.style)
    expect(active.color).toBe(lightTheme.colors.onSecondaryContainer)
    expect(active.fontSize).toBe(lightTheme.typography.labelLarge.fontSize)
    const inactive = StyleSheet.flatten(screen.getByText('Outbox').props.style)
    expect(inactive.color).toBe(lightTheme.colors.onSurfaceVariant)

    const headline = StyleSheet.flatten(screen.getByText('Mail').props.style)
    expect(headline.fontSize).toBe(lightTheme.typography.titleSmall.fontSize)
    expect(headline.color).toBe(lightTheme.colors.onSurfaceVariant)
    expect(headline.paddingHorizontal).toBe(16)

    const divider = StyleSheet.flatten(
      screen.getByTestId('divider').props.style,
    )
    expect(divider.marginStart).toBe(16)
    expect(divider.marginEnd).toBe(16)
  })

  it('moves the indicator to the pressed destination', () => {
    const { flush } = renderSettled(
      <NavigationDrawer variant="standard" defaultValue="inbox">
        <Items />
      </NavigationDrawer>,
    )
    fireEvent.press(screen.getByRole('tab', { name: 'Outbox' }))
    flush()
    expect(
      StyleSheet.flatten(screen.getByTestId('outbox-indicator').props.style)
        .opacity,
    ).toBe(1)
    expect(
      StyleSheet.flatten(screen.getByTestId('inbox-indicator').props.style)
        .opacity,
    ).toBe(0)
  })

  it('honours the color and label overrides', () => {
    renderStandard({
      containerColor: '#101010',
      contentColor: '#202020',
      selectedContentColor: '#303030',
      indicatorColor: '#404040',
      labelStyle: { fontWeight: '700' },
    })
    expect(
      StyleSheet.flatten(screen.getByTestId('drawer').props.style)
        .backgroundColor,
    ).toBe('#101010')
    const active = StyleSheet.flatten(screen.getByText('Inbox').props.style)
    expect(active.color).toBe('#303030')
    expect(active.fontWeight).toBe('700')
    expect(
      StyleSheet.flatten(screen.getByText('Outbox').props.style).color,
    ).toBe('#202020')
    expect(StyleSheet.flatten(screen.getByText('Mail').props.style).color).toBe(
      '#202020',
    )
    expect(
      StyleSheet.flatten(screen.getByTestId('inbox-indicator').props.style)
        .backgroundColor,
    ).toBe('#404040')
  })

  it('throws when an item is rendered outside a drawer', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      renderWithTheme(<NavigationDrawer.Item value="a" label="A" />),
    ).toThrow('must be rendered inside a <NavigationDrawer>')
    error.mockRestore()
  })
})

describe('NavigationDrawer — modal', () => {
  it('renders nothing while not visible', () => {
    renderModal({ visible: false })
    expect(screen.queryByText('Inbox')).toBeNull()
  })

  it('renders through the portal with a scrim and a dialog surface', async () => {
    renderModal({ accessibilityLabel: 'Main navigation' })
    expect(await screen.findByText('Inbox')).toBeTruthy()
    expect(screen.getByTestId('drawer-scrim')).toBeTruthy()
    const surface = screen.getByTestId('drawer')
    expect(surface.props.role).toBe('dialog')
    expect(surface.props.accessibilityLabel).toBe('Main navigation')
  })

  it('applies the modal container tokens', async () => {
    renderModal()
    const surface = StyleSheet.flatten(
      (await screen.findByTestId('drawer')).props.style,
    )
    expect(surface.backgroundColor).toBe(lightTheme.colors.surfaceContainerLow)
    expect(surface.maxWidth).toBe(360)
    expect(surface.borderTopEndRadius).toBe(lightTheme.shape.cornerLarge)
    expect(surface.borderBottomEndRadius).toBe(lightTheme.shape.cornerLarge)
  })

  it('dismisses on a scrim press', async () => {
    const onDismiss = jest.fn()
    renderModal({ onDismiss })
    await screen.findByText('Inbox')
    fireEvent.press(screen.getByLabelText('Close navigation drawer'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss on a scrim press when dismissable is false', async () => {
    const onDismiss = jest.fn()
    renderModal({ onDismiss, dismissable: false })
    await screen.findByText('Inbox')
    const scrim = screen.UNSAFE_getByProps({
      accessibilityLabel: 'Close navigation drawer',
    })
    expect(scrim.props.disabled).toBe(true)
    fireEvent.press(scrim)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses after a destination press by default', async () => {
    const onDismiss = jest.fn()
    const onValueChange = jest.fn()
    renderModal({ onDismiss, onValueChange })
    fireEvent.press(await screen.findByRole('tab', { name: 'Outbox' }))
    expect(onValueChange).toHaveBeenCalledWith('outbox')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('stays open after a destination press with dismissOnSelect={false}', async () => {
    const onDismiss = jest.fn()
    renderModal({ onDismiss, dismissOnSelect: false })
    fireEvent.press(await screen.findByRole('tab', { name: 'Outbox' }))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('renders arbitrary children as is', async () => {
    renderWithTheme(
      <PortalHost>
        <NavigationDrawer visible onDismiss={jest.fn()}>
          <Text>Mail app</Text>
          <NavigationDrawer.Item value="a" label="A" />
        </NavigationDrawer>
      </PortalHost>,
    )
    expect(await screen.findByText('Mail app')).toBeTruthy()
  })
})
