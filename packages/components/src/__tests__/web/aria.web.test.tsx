/**
 * DOM-level regression net for accessibility **state** on web.
 *
 * Why this file exists: for the whole life of the library the components
 * announced their state through RN's nested `accessibilityState={{ ... }}`
 * object. react-native-web 0.21 doesn't read that object at all — it reads
 * `aria-*`, or the flattened legacy `accessibilityChecked` / `accessibilitySelected`
 * spellings — so it silently discarded every bit of state on the way to the
 * DOM. A screen reader on web could not tell which tab was active or whether
 * a checkbox was checked, across 19 call sites in 16 components.
 *
 * Nothing caught it. RN core still honours `accessibilityState`, so the
 * on-device passes were unaffected, and the rest of the suite runs against the
 * `react-native` preset where RNTL asserts on the React prop — which was
 * always correct. Both green, both blind.
 *
 * So: these tests read `getAttribute` off real DOM nodes. Asserting on props
 * here would reproduce exactly the blindness the file is here to remove.
 */
import { screen } from '@testing-library/react'
import { Text } from 'react-native'
import { Avatar } from '../../avatar'
import { Button } from '../../button'
import { ButtonGroup } from '../../button-group'
import { Card } from '../../card'
import { Checkbox } from '../../checkbox'
import { Chip } from '../../chip'
import { FAB } from '../../fab'
import { IconButton } from '../../icon-button'
import { ListItem } from '../../list'
import { LoadingIndicator } from '../../loading-indicator'
import { NavigationBar } from '../../navigation-bar'
import { CircularProgress, LinearProgress } from '../../progress'
import { Radio } from '../../radio'
import { Slider } from '../../slider'
import { Switch } from '../../switch'
import { Tabs } from '../../tabs'
import { TextField } from '../../text-field'
import { renderWeb } from './render-web'

/** `aria-*` attributes are always strings in the DOM, including booleans. */
function aria(role: string, name: string, options?: { index?: number }) {
  const elements = screen.getAllByRole(role)
  return elements[options?.index ?? 0].getAttribute(name)
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

describe('aria-checked reaches the DOM', () => {
  it('Checkbox — unchecked', () => {
    renderWeb(<Checkbox />)
    expect(aria('checkbox', 'aria-checked')).toBe('false')
  })

  it('Checkbox — checked', () => {
    renderWeb(<Checkbox value />)
    expect(aria('checkbox', 'aria-checked')).toBe('true')
  })

  it('Checkbox — indeterminate announces "mixed", not a boolean', () => {
    renderWeb(<Checkbox indeterminate />)
    expect(aria('checkbox', 'aria-checked')).toBe('mixed')
  })

  it('Radio', () => {
    renderWeb(<Radio value />)
    expect(aria('radio', 'aria-checked')).toBe('true')
  })

  it('Switch', () => {
    renderWeb(<Switch value />)
    expect(aria('switch', 'aria-checked')).toBe('true')
  })

  it('ButtonGroup — multiple selection announces checked', () => {
    renderWeb(
      <ButtonGroup
        items={GROUP_ITEMS}
        selectionMode="multiple"
        value={['week']}
      />,
    )
    expect(aria('checkbox', 'aria-checked', { index: 0 })).toBe('false')
    expect(aria('checkbox', 'aria-checked', { index: 1 })).toBe('true')
  })
})

describe('aria-selected reaches the DOM', () => {
  it('Tabs — the active tab is distinguishable from the inactive one', () => {
    renderWeb(<Tabs items={TAB_ITEMS} value="trips" />)
    expect(aria('tab', 'aria-selected', { index: 0 })).toBe('false')
    expect(aria('tab', 'aria-selected', { index: 1 })).toBe('true')
  })

  it('NavigationBar', () => {
    renderWeb(<NavigationBar items={NAV_ITEMS} value="search" />)
    expect(aria('tab', 'aria-selected', { index: 0 })).toBe('false')
    expect(aria('tab', 'aria-selected', { index: 1 })).toBe('true')
  })

  it('Chip — filter variant only', () => {
    renderWeb(
      <Chip variant="filter" selected>
        Filter
      </Chip>,
    )
    expect(aria('button', 'aria-selected')).toBe('true')
  })

  it('Chip — a non-filter variant emits no selected state at all', () => {
    renderWeb(<Chip variant="assist">Assist</Chip>)
    expect(aria('button', 'aria-selected')).toBeNull()
  })

  it('IconButton — toggle only', () => {
    renderWeb(<IconButton icon="heart" selected accessibilityLabel="Like" />)
    expect(aria('button', 'aria-selected')).toBe('true')
  })

  it('ButtonGroup — single selection announces selected', () => {
    renderWeb(
      <ButtonGroup items={GROUP_ITEMS} selectionMode="single" value="week" />,
    )
    expect(aria('radio', 'aria-selected', { index: 0 })).toBe('false')
    expect(aria('radio', 'aria-selected', { index: 1 })).toBe('true')
  })
})

describe('aria-value* reaches the DOM', () => {
  it('Slider', () => {
    renderWeb(<Slider value={30} minimumValue={0} maximumValue={100} />)
    expect(aria('slider', 'aria-valuenow')).toBe('30')
    expect(aria('slider', 'aria-valuemin')).toBe('0')
    expect(aria('slider', 'aria-valuemax')).toBe('100')
  })

  it('LinearProgress — determinate', () => {
    renderWeb(<LinearProgress progress={0.25} />)
    expect(aria('progressbar', 'aria-valuenow')).toBe('25')
    expect(aria('progressbar', 'aria-valuemax')).toBe('100')
  })

  it('LinearProgress — indeterminate reports no value', () => {
    renderWeb(<LinearProgress />)
    expect(aria('progressbar', 'aria-valuenow')).toBeNull()
  })

  it('CircularProgress — determinate', () => {
    renderWeb(<CircularProgress progress={0.5} />)
    expect(aria('progressbar', 'aria-valuenow')).toBe('50')
  })

  it('LoadingIndicator — determinate', () => {
    renderWeb(<LoadingIndicator progress={0.75} />)
    expect(aria('progressbar', 'aria-valuenow')).toBe('75')
  })
})

/**
 * Weaker than the blocks above, and deliberately kept anyway.
 *
 * These pass even with the explicit `aria-disabled` prop deleted: RNW derives
 * `aria-disabled` from `Pressable`/`TextInput`'s own `disabled` prop, which
 * every one of these components also passes. So this block asserts the
 * user-facing outcome (a screen reader can tell the control is unavailable)
 * rather than guarding the prop spelling — do not read a green run here as
 * proof that `aria-disabled` is still being written by hand.
 */
describe('aria-disabled reaches the DOM', () => {
  it('Button', () => {
    renderWeb(<Button disabled>Save</Button>)
    expect(aria('button', 'aria-disabled')).toBe('true')
  })

  it('Card — pressable', () => {
    renderWeb(
      <Card onPress={() => {}} disabled>
        <Text>Card</Text>
      </Card>,
    )
    expect(aria('button', 'aria-disabled')).toBe('true')
  })

  it('FAB', () => {
    renderWeb(<FAB icon="plus" disabled accessibilityLabel="Add" />)
    expect(aria('button', 'aria-disabled')).toBe('true')
  })

  it('ListItem', () => {
    renderWeb(<ListItem headlineText="Item" onPress={() => {}} disabled />)
    expect(aria('button', 'aria-disabled')).toBe('true')
  })

  it('Avatar — pressable', () => {
    renderWeb(<Avatar label="AB" onPress={() => {}} disabled />)
    expect(aria('button', 'aria-disabled')).toBe('true')
  })

  it('Checkbox', () => {
    renderWeb(<Checkbox disabled />)
    expect(aria('checkbox', 'aria-disabled')).toBe('true')
  })

  it('Slider', () => {
    renderWeb(<Slider value={10} disabled />)
    expect(aria('slider', 'aria-disabled')).toBe('true')
  })

  it('TextField — the input itself, not a wrapper', () => {
    renderWeb(<TextField label="Name" disabled />)
    expect(aria('textbox', 'aria-disabled')).toBe('true')
  })
})
