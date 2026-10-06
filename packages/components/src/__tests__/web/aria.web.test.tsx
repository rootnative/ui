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
import { NavigationDrawer } from '../../navigation-drawer'
import { NavigationRail } from '../../navigation-rail'
import { CircularProgress, LinearProgress } from '../../progress'
import { Radio } from '../../radio'
import { SearchBar } from '../../search-bar'
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

  it('NavigationRail', () => {
    renderWeb(<NavigationRail items={NAV_ITEMS} value="search" />)
    expect(aria('tab', 'aria-selected', { index: 0 })).toBe('false')
    expect(aria('tab', 'aria-selected', { index: 1 })).toBe('true')
  })

  it('NavigationDrawer — standard', () => {
    renderWeb(
      <NavigationDrawer variant="standard" value="search">
        <NavigationDrawer.Item value="home" label="Home" icon="home-outline" />
        <NavigationDrawer.Item value="search" label="Search" icon="magnify" />
      </NavigationDrawer>,
    )
    expect(aria('tab', 'aria-selected', { index: 0 })).toBe('false')
    expect(aria('tab', 'aria-selected', { index: 1 })).toBe('true')
  })
})

/**
 * A toggle `button` carries `aria-pressed`, and a radio carries
 * `aria-checked`. `aria-selected` is defined on neither, so a reader
 * announced no state from it.
 */
describe('toggle states reach the DOM with the right attribute', () => {
  it('Chip — filter variant is a pressed button', () => {
    renderWeb(
      <Chip variant="filter" selected>
        Filter
      </Chip>,
    )
    expect(aria('button', 'aria-pressed')).toBe('true')
    expect(aria('button', 'aria-selected')).toBeNull()
  })

  it('Chip — a non-filter variant emits no toggle state at all', () => {
    renderWeb(<Chip variant="assist">Assist</Chip>)
    expect(aria('button', 'aria-pressed')).toBeNull()
    expect(aria('button', 'aria-selected')).toBeNull()
  })

  it('IconButton — toggle is a pressed button', () => {
    renderWeb(<IconButton icon="heart" selected accessibilityLabel="Like" />)
    expect(aria('button', 'aria-pressed')).toBe('true')
    expect(aria('button', 'aria-selected')).toBeNull()
  })

  it('ButtonGroup — single selection is a checked radio', () => {
    renderWeb(
      <ButtonGroup items={GROUP_ITEMS} selectionMode="single" value="week" />,
    )
    expect(aria('radio', 'aria-checked', { index: 0 })).toBe('false')
    expect(aria('radio', 'aria-checked', { index: 1 })).toBe('true')
    expect(aria('radio', 'aria-selected', { index: 1 })).toBeNull()
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

  it('SearchBar — the input itself, not a wrapper', () => {
    renderWeb(<SearchBar placeholder="Search" disabled />)
    expect(aria('searchbox', 'aria-disabled')).toBe('true')
  })
})

/**
 * Expo Router's `<Link href asChild>` hands its child `href`, `role="link"`
 * and a press handler. react-native-web renders an `<a>` for `href` only when
 * the role maps to no element of its own, and `button` does. So a card that
 * fixed its role after the props spread rendered `<button href>`, which a
 * crawler does not follow. The props are spread because `href` is a
 * react-native-web prop that the React Native types do not declare.
 */
describe('a consumer role reaches the DOM', () => {
  const linkProps = { href: '/movie/19404', role: 'link' as const }

  it('Card — pressable, under a Link', () => {
    renderWeb(
      <Card {...linkProps} onPress={() => {}}>
        <Text>Card</Text>
      </Card>,
    )
    const link = screen.getByRole('link')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/movie/19404')
    expect(screen.queryByRole('button')).toBeNull()
  })

  // These set `accessibilityRole`, which a `role` prop overrides, so they
  // were never affected. The cases pin that, so a move to `role` after the
  // spread fails here.
  it.each([
    ['Button', () => <Button {...linkProps}>Open</Button>],
    [
      'IconButton',
      () => (
        <IconButton
          {...linkProps}
          icon="open-in-new"
          accessibilityLabel="Open"
        />
      ),
    ],
    ['FAB', () => <FAB {...linkProps} icon="plus" accessibilityLabel="Open" />],
    [
      'ListItem',
      () => <ListItem {...linkProps} headlineText="Open" onPress={() => {}} />,
    ],
    ['Avatar', () => <Avatar {...linkProps} label="AB" onPress={() => {}} />],
    ['Chip', () => <Chip {...linkProps}>Drama</Chip>],
  ])('%s — under a Link', (_name, element) => {
    renderWeb(element())
    const link = screen.getByRole('link')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/movie/19404')
  })

  // Under `asChild`, `<Link target>` reaches the child as a plain prop that
  // react-native-web drops, so a new tab needs `hrefAttrs` on the child.
  it('Button — hrefAttrs sets the target and rel of the anchor', () => {
    renderWeb(
      <Button {...linkProps} hrefAttrs={{ target: '_blank', rel: 'noopener' }}>
        Open
      </Button>,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener')
  })

  it('SearchBar — as a trigger, the consumer role names the bar', () => {
    renderWeb(<SearchBar role="link" placeholder="Search" onPress={() => {}} />)
    expect(screen.getByRole('link', { name: 'Search' })).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('SearchBar — as a trigger, its buttons are siblings, not nested', () => {
    renderWeb(
      <SearchBar
        placeholder="Search"
        value="rain"
        onPress={() => {}}
        actions={[
          { icon: 'microphone', accessibilityLabel: 'Voice', onPress() {} },
        ]}
      />,
    )
    // A <button> inside a <button> is invalid DOM. The trigger, the clear
    // button and the action must each stand alone.
    expect(document.querySelector('button button')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('Card — pressable, with no role, stays a button', () => {
    renderWeb(
      <Card onPress={() => {}}>
        <Text>Card</Text>
      </Card>,
    )
    expect(screen.getByRole('button').tagName).toBe('BUTTON')
  })
})

/**
 * RN's `Role` union has no `search`, so the landmark is set through
 * `accessibilityRole`. Only the DOM can show that react-native-web turns it
 * into `role="search"` rather than dropping it.
 */
describe('SearchBar roles reach the DOM', () => {
  it('wraps a searchbox in a search landmark', () => {
    renderWeb(<SearchBar placeholder="Search mail" />)
    const input = screen.getByRole('searchbox')
    expect(input.getAttribute('aria-label')).toBe('Search mail')
    expect(screen.getByRole('search').contains(input)).toBe(true)
  })
})
