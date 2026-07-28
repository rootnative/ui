/**
 * The API-freeze pass settled a split that had grown by accident: 16 components
 * extended RN's `ViewProps`/`PressableProps` while the 11 newest declared closed
 * interfaces, so `<Card onLayout={fn}/>` type-checked and `<Tabs onLayout={fn}/>`
 * did not. The decision was to extend everywhere.
 *
 * These tests pin the *runtime* half of that — that `...rest` actually reaches
 * the addressable root node, which is the part a type change alone doesn't
 * guarantee. Each component below was widened, and for each one `rest` had to be
 * threaded to a different node: a row container for Tabs/NavigationBar/
 * ButtonGroup, the surface inside a portal for Dialog/Menu/Tooltip/BottomSheet,
 * the outlet view for a named PortalHost, both root branches for AppBar.
 *
 * `nativeID` is the probe because nothing in the library sets it, so a hit can
 * only have come from the spread.
 */
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AppBar } from '../appbar'
import { BottomSheet } from '../bottom-sheet'
import { ButtonGroup } from '../button-group'
import { Dialog } from '../dialog'
import { KeyboardAvoidingWrapper } from '../keyboard-avoiding-wrapper'
import { Menu } from '../menu'
import { NavigationBar } from '../navigation-bar'
import { PortalHost } from '../portal'
import { Tabs } from '../tabs'
import { Tooltip } from '../tooltip'

const ITEMS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]

/** NavigationBarItem requires an icon. */
const NAV_ITEMS = [
  { value: 'a', label: 'A', icon: 'home-outline' },
  { value: 'b', label: 'B', icon: 'magnify' },
]

/** Renders inside a host, since four of these mount through a Portal. */
function renderHosted(ui: React.ReactElement) {
  return renderWithTheme(<PortalHost>{ui}</PortalHost>)
}

describe('RN prop passthrough reaches the root node', () => {
  it('Tabs', () => {
    renderWithTheme(<Tabs items={ITEMS} testID="tabs" nativeID="probe" />)
    expect(screen.getByTestId('tabs').props.nativeID).toBe('probe')
  })

  it('NavigationBar', () => {
    renderWithTheme(
      <NavigationBar items={NAV_ITEMS} testID="nav" nativeID="probe" />,
    )
    expect(screen.getByTestId('nav').props.nativeID).toBe('probe')
  })

  it('ButtonGroup', () => {
    renderWithTheme(
      <ButtonGroup items={ITEMS} testID="group" nativeID="probe" />,
    )
    expect(screen.getByTestId('group').props.nativeID).toBe('probe')
  })

  it('AppBar', () => {
    renderWithTheme(<AppBar title="Title" testID="bar" nativeID="probe" />)
    expect(screen.getByTestId('bar').props.nativeID).toBe('probe')
  })

  it('KeyboardAvoidingWrapper', () => {
    renderWithTheme(
      <KeyboardAvoidingWrapper testID="wrap" nativeID="probe">
        <Text>Body</Text>
      </KeyboardAvoidingWrapper>,
    )
    expect(screen.getByTestId('wrap').props.nativeID).toBe('probe')
  })

  it('PortalHost', () => {
    renderWithTheme(
      <PortalHost testID="host" nativeID="probe">
        <Text>Body</Text>
      </PortalHost>,
    )
    expect(screen.getByTestId('host').props.nativeID).toBe('probe')
  })

  it('Dialog — lands on the surface, not the scrim', () => {
    renderHosted(
      <Dialog visible onDismiss={jest.fn()} testID="dialog" nativeID="probe">
        <Dialog.Content>Body</Dialog.Content>
      </Dialog>,
    )
    expect(screen.getByTestId('dialog').props.nativeID).toBe('probe')
  })

  it('Menu', () => {
    renderHosted(
      <Menu
        visible
        onDismiss={jest.fn()}
        anchor={<Text>Open</Text>}
        testID="menu"
        nativeID="probe"
      >
        <Menu.Item label="One" />
      </Menu>,
    )
    expect(screen.getByTestId('menu').props.nativeID).toBe('probe')
  })

  it('Tooltip', () => {
    renderHosted(
      <Tooltip
        visible
        onDismiss={jest.fn()}
        anchor={<Text>Anchor</Text>}
        testID="tip"
        nativeID="probe"
      >
        Label
      </Tooltip>,
    )
    expect(screen.getByTestId('tip').props.nativeID).toBe('probe')
  })

  it('BottomSheet', () => {
    renderHosted(
      <BottomSheet
        visible
        onDismiss={jest.fn()}
        testID="sheet"
        nativeID="probe"
      >
        <Text>Body</Text>
      </BottomSheet>,
    )
    expect(screen.getByTestId('sheet').props.nativeID).toBe('probe')
  })
})
