/**
 * Space presses a control whose role is `checkbox`, `switch`, `radio` or
 * `tab` on web.
 *
 * react-native-web presses a `Pressable` on Enter for each role, but on Space
 * only for the `button` role. Each control here renders a `div` with one of
 * the other four roles, so a keyboard user pressed Space and nothing changed,
 * while a screen reader announced a checkbox. The native project cannot see
 * this: native has no key events on a `Pressable`, and the rule lives in the
 * react-native-web press responder.
 */
import { fireEvent, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Text, View } from 'react-native'
import { Button } from '../../button'
import { ButtonGroup } from '../../button-group'
import { Card } from '../../card'
import { Checkbox } from '../../checkbox'
import { ListItem } from '../../list'
import { NavigationBar } from '../../navigation-bar'
import { NavigationDrawer } from '../../navigation-drawer'
import { NavigationRail } from '../../navigation-rail'
import { Radio } from '../../radio'
import { Switch } from '../../switch'
import { Tabs } from '../../tabs'
import { renderWeb } from './render-web'

/** `false` when a handler called `preventDefault`, as `fireEvent` reports. */
function space(element: Element, init?: KeyboardEventInit) {
  return fireEvent.keyDown(element, { key: ' ', ...init })
}

const TAB_ITEMS = [
  { value: 'flights', label: 'Flights' },
  { value: 'trips', label: 'Trips' },
]

const NAV_ITEMS = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'search', label: 'Search', icon: 'magnify' },
]

const GROUP_ITEMS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
]

/**
 * Each case presses the last element with the role, which is not selected
 * yet: a selected radio or tab ignores a press by design.
 */
const SPACE_CASES: [string, string, (onChange: jest.Mock) => ReactElement][] = [
  ['Checkbox', 'checkbox', (fn) => <Checkbox onValueChange={fn} />],
  ['Switch', 'switch', (fn) => <Switch onValueChange={fn} />],
  ['Radio', 'radio', (fn) => <Radio onValueChange={fn} />],
  [
    'ButtonGroup, single selection',
    'radio',
    (fn) => (
      <ButtonGroup
        items={GROUP_ITEMS}
        selectionMode="single"
        onValueChange={fn}
      />
    ),
  ],
  [
    'ButtonGroup, multiple selection',
    'checkbox',
    (fn) => (
      <ButtonGroup
        items={GROUP_ITEMS}
        selectionMode="multiple"
        onValueChange={fn}
      />
    ),
  ],
  ['Tabs', 'tab', (fn) => <Tabs items={TAB_ITEMS} onValueChange={fn} />],
  [
    'NavigationBar',
    'tab',
    (fn) => <NavigationBar items={NAV_ITEMS} onValueChange={fn} />,
  ],
  [
    'NavigationRail',
    'tab',
    (fn) => <NavigationRail items={NAV_ITEMS} onValueChange={fn} />,
  ],
  [
    'NavigationDrawer.Item',
    'tab',
    (fn) => (
      <NavigationDrawer variant="standard" onValueChange={fn}>
        <NavigationDrawer.Item value="home" label="Home" />
        <NavigationDrawer.Item value="search" label="Search" />
      </NavigationDrawer>
    ),
  ],
  // A role that the consumer passes counts too.
  [
    'Card with role="checkbox"',
    'checkbox',
    (fn) => (
      <Card role="checkbox" aria-checked={false} onPress={fn}>
        <Text>Film</Text>
      </Card>
    ),
  ],
  [
    'ListItem with role="switch"',
    'switch',
    (fn) => (
      <ListItem
        headlineText="Wi-Fi"
        role="switch"
        aria-checked={false}
        onPress={fn}
      />
    ),
  ],
]

describe('Space presses a control whose role is not button', () => {
  it.each(SPACE_CASES)('%s', (_, role, render) => {
    const onChange = jest.fn()
    renderWeb(render(onChange))
    const controls = screen.getAllByRole(role)

    // Claimed, so the page does not scroll.
    expect(space(controls[controls.length - 1])).toBe(false)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('presses once for a held key, and claims each repeat', () => {
    const onChange = jest.fn()
    renderWeb(<Checkbox onValueChange={onChange} />)
    const checkbox = screen.getByRole('checkbox')

    space(checkbox)
    expect(space(checkbox, { repeat: true })).toBe(false)
    expect(space(checkbox, { repeat: true })).toBe(false)

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  // A `Card` gives the consumer's `onPress` to the `Pressable` as it is. A
  // `Checkbox` checks `disabled` in its own handler, so it cannot fail here.
  it('does not press a disabled control', () => {
    const onPress = jest.fn()
    renderWeb(
      <Card role="checkbox" aria-checked={false} disabled onPress={onPress}>
        <Text>Film</Text>
      </Card>,
    )

    space(screen.getByRole('checkbox'))

    expect(onPress).not.toHaveBeenCalled()
  })

  // A `TextInput` stops its own key events, so a focusable view is the case
  // that reaches the control.
  it('does not press for a key from a focused descendant', () => {
    const onPress = jest.fn()
    renderWeb(
      <Card role="checkbox" aria-checked={false} onPress={onPress}>
        <View focusable testID="detail" />
      </Card>,
    )

    expect(space(screen.getByTestId('detail'))).toBe(true)
    expect(onPress).not.toHaveBeenCalled()
  })

  /**
   * An app that handles Space itself, as a workaround for this defect, calls
   * `preventDefault`. A second press would undo its toggle.
   */
  it('does not press when an onKeyDown of the consumer claimed the key', () => {
    const onChange = jest.fn()
    const onKeyDown = jest.fn((event: { preventDefault?: () => void }) =>
      event.preventDefault?.(),
    )
    renderWeb(<Checkbox onValueChange={onChange} onKeyDown={onKeyDown} />)

    space(screen.getByRole('checkbox'))

    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  /**
   * react-native-web renders the `button` role as a `<button>`, and the
   * browser clicks it on the key up of Space. jsdom does not click, so this
   * checks that the key down stays with the browser: a press here, or a
   * claimed key, would press twice or stop the click.
   */
  it('leaves Space on a button to the browser', () => {
    const onPress = jest.fn()
    renderWeb(<Button onPress={onPress}>Save</Button>)

    expect(space(screen.getByRole('button'))).toBe(true)
    expect(onPress).not.toHaveBeenCalled()
  })
})
