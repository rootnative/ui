/**
 * DOM-level regression net for the **web-only style props**: `cursor`,
 * `outlineStyle`, and `pointerEvents`.
 *
 * Why this file exists: these three keys are inert on native. React Native
 * ignores `cursor` and `outlineStyle` entirely, and `pointerEvents` only ever
 * affects hit-testing — never anything a native assertion can read back. So
 * every one of them is, by construction, invisible to the `react-native`
 * project: a test there would assert on a style key that no native platform
 * consumes. They are load-bearing only in a browser, and only the DOM can say
 * whether they arrived.
 *
 * The `cursor` contract in particular is a hand-maintained pair repeated across
 * 16 components — `cursor: 'pointer'` on the interactive container, and
 * `cursor: 'auto'` on the disabled one. Nothing derives the second from the
 * first, so a new component (or a new disabled style) can drop the disabled
 * half and look completely correct on device, in the native suite, and in
 * review. On web it leaves a dead control still advertising itself as
 * clickable.
 *
 * Note these read `getComputedStyle`, not `node.style`. All of these come from
 * `StyleSheet.create`, which react-native-web compiles into atomic CSS classes
 * (`r-cursor-1loqt21`) rather than inline styles — reading `.style.cursor`
 * here returns `''` for every component that is behaving perfectly. That is the
 * same distinction `elevation.web.test.tsx` documents between a `useShadow`
 * carrier (dynamic, inline) and a `StyleSheet` shadow (class-based, computed).
 */
import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { Avatar } from '../../avatar'
import { BottomSheet } from '../../bottom-sheet'
import { Button } from '../../button'
import { ButtonGroup } from '../../button-group'
import { Card } from '../../card'
import { Checkbox } from '../../checkbox'
import { Chip } from '../../chip'
import { FAB } from '../../fab'
import { IconButton } from '../../icon-button'
import { ListItem } from '../../list'
import { Menu } from '../../menu'
import { NavigationBar } from '../../navigation-bar'
import { PortalHost } from '../../portal/PortalHost'
import { Radio } from '../../radio'
import { Switch } from '../../switch'
import { Tabs } from '../../tabs'
import { TextField } from '../../text-field'
import { Tooltip } from '../../tooltip'
import { renderWeb } from './render-web'

/** The computed `cursor` of the first element matching `role`. */
function cursorOfRole(role: string, index = 0) {
  const element = screen.getAllByRole(role)[index]
  return getComputedStyle(element).cursor
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
 * Every component whose container carries the interactive/disabled cursor pair.
 *
 * `role` is what the enabled and disabled renders are both looked up by, so a
 * component only belongs here when disabling it does not change its role.
 */
const CURSOR_CASES: {
  name: string
  role: string
  enabled: ReactElement
  disabled: ReactElement
}[] = [
  {
    name: 'Button',
    role: 'button',
    enabled: <Button>Save</Button>,
    disabled: <Button disabled>Save</Button>,
  },
  {
    name: 'IconButton',
    role: 'button',
    enabled: <IconButton icon="heart" accessibilityLabel="Like" />,
    disabled: <IconButton icon="heart" accessibilityLabel="Like" disabled />,
  },
  {
    name: 'FAB',
    role: 'button',
    enabled: <FAB icon="plus" accessibilityLabel="Add" />,
    disabled: <FAB icon="plus" accessibilityLabel="Add" disabled />,
  },
  {
    name: 'Chip',
    role: 'button',
    enabled: <Chip>Assist</Chip>,
    disabled: <Chip disabled>Assist</Chip>,
  },
  {
    name: 'Card — pressable',
    role: 'button',
    enabled: (
      <Card onPress={() => {}}>
        <Text>Card</Text>
      </Card>
    ),
    disabled: (
      <Card onPress={() => {}} disabled>
        <Text>Card</Text>
      </Card>
    ),
  },
  {
    name: 'ListItem — pressable',
    role: 'button',
    enabled: <ListItem headlineText="Item" onPress={() => {}} />,
    disabled: <ListItem headlineText="Item" onPress={() => {}} disabled />,
  },
  {
    name: 'Avatar — pressable',
    role: 'button',
    enabled: <Avatar label="AB" onPress={() => {}} />,
    disabled: <Avatar label="AB" onPress={() => {}} disabled />,
  },
  {
    name: 'Checkbox',
    role: 'checkbox',
    enabled: <Checkbox />,
    disabled: <Checkbox disabled />,
  },
  {
    name: 'Radio',
    role: 'radio',
    enabled: <Radio />,
    disabled: <Radio disabled />,
  },
  {
    name: 'Switch',
    role: 'switch',
    enabled: <Switch />,
    disabled: <Switch disabled />,
  },
  {
    name: 'Tabs — tab',
    role: 'tab',
    enabled: <Tabs items={TAB_ITEMS} value="flights" />,
    disabled: (
      <Tabs
        items={[{ ...TAB_ITEMS[0], disabled: true }, TAB_ITEMS[1]]}
        value="trips"
      />
    ),
  },
  {
    name: 'NavigationBar — item',
    role: 'tab',
    enabled: <NavigationBar items={NAV_ITEMS} value="home" />,
    disabled: (
      <NavigationBar
        items={[{ ...NAV_ITEMS[0], disabled: true }, NAV_ITEMS[1]]}
        value="search"
      />
    ),
  },
  {
    // No `selectionMode`, so the items are plain buttons — the
    // `radio`/`checkbox` roles only appear under an explicit selection mode
    // (covered in `aria.web.test.tsx`). The cursor pair is the same either
    // way, and the props type makes `value` meaningless without a mode.
    name: 'ButtonGroup — item',
    role: 'button',
    enabled: <ButtonGroup items={GROUP_ITEMS} />,
    disabled: (
      <ButtonGroup
        items={[{ ...GROUP_ITEMS[0], disabled: true }, GROUP_ITEMS[1]]}
      />
    ),
  },
]

describe('an enabled control advertises itself as clickable', () => {
  it.each(CURSOR_CASES)('$name', ({ role, enabled }) => {
    renderWeb(enabled)
    expect(cursorOfRole(role)).toBe('pointer')
  })
})

describe('a disabled control does not', () => {
  it.each(CURSOR_CASES)('$name', ({ role, disabled }) => {
    renderWeb(disabled)
    expect(cursorOfRole(role)).toBe('auto')
  })
})

describe('cursor on the surfaces that are not a plain container', () => {
  /**
   * The close affordance is a *sibling* Pressable, not a child — a nested one
   * would render `<button>` inside `<button>`, which is invalid DOM. So it is
   * a second, independently-hoverable target inside what reads as one control,
   * and it carries its own copy of the cursor pair.
   *
   * It only renders for `input` chips (or a selected `filter` chip), so the
   * variant here is load-bearing: a default `assist` chip renders no close
   * button at all and these would silently assert against the chip itself.
   */
  it("Chip's close button is separately clickable", () => {
    renderWeb(
      <Chip variant="input" onClose={() => {}}>
        Tag
      </Chip>,
    )
    const close = screen.getByLabelText('Remove Tag')
    expect(getComputedStyle(close).cursor).toBe('pointer')
  })

  it("a disabled Chip's close button is not", () => {
    renderWeb(
      <Chip variant="input" onClose={() => {}} disabled>
        Tag
      </Chip>,
    )
    const close = screen.getByLabelText('Remove Tag')
    expect(getComputedStyle(close).cursor).toBe('auto')
  })

  it('Menu.Item', () => {
    renderWeb(
      <PortalHost>
        <Menu anchor={<Button>Actions</Button>} visible onDismiss={() => {}}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>,
    )
    expect(
      getComputedStyle(
        screen.getByText('Edit').closest('[tabindex]') as HTMLElement,
      ).cursor,
    ).toBe('pointer')
  })

  it('a disabled Menu.Item', () => {
    renderWeb(
      <PortalHost>
        <Menu anchor={<Button>Actions</Button>} visible onDismiss={() => {}}>
          <Menu.Item label="Edit" disabled />
        </Menu>
      </PortalHost>,
    )
    expect(
      getComputedStyle(
        screen.getByText('Edit').closest('[tabindex]') as HTMLElement,
      ).cursor,
    ).toBe('auto')
  })

  it("BottomSheet's drag handle", () => {
    const { container } = renderWeb(
      <PortalHost>
        <BottomSheet visible onDismiss={() => {}}>
          <Text>Sheet</Text>
        </BottomSheet>
      </PortalHost>,
    )
    const pointers = Array.from(
      container.querySelectorAll<HTMLElement>('*'),
    ).filter((node) => getComputedStyle(node).cursor === 'pointer')
    expect(pointers.length).toBeGreaterThan(0)
  })

  /**
   * The inverse case, and the reason `cursor: 'auto'` is written by hand on a
   * node that never looks disabled: react-native-web gives *every* Pressable
   * `cursor: 'pointer'`, and Tooltip wraps its anchor in one purely to catch
   * hover above it. Without the reset the wrapper would make static anchors —
   * text, an icon, anything that is not itself a control — claim to be
   * clickable.
   */
  it("Tooltip's anchor wrapper stays non-clickable, while the anchor itself does not", () => {
    renderWeb(
      <PortalHost>
        <Tooltip anchor={<Button>Save</Button>}>Saves your changes</Tooltip>
      </PortalHost>,
    )

    const button = screen.getByRole('button')
    // The wrapper is the Pressable ancestor, not the immediate parent — the
    // anchor sits inside an intermediate alignment view.
    const wrapper = button.closest('[tabindex="-1"]') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(getComputedStyle(wrapper).cursor).toBe('auto')
    // A control anchor still paints its own cursor on top.
    expect(getComputedStyle(button).cursor).toBe('pointer')
  })

  it('a non-interactive Card claims no cursor at all', () => {
    const { container } = renderWeb(
      <Card>
        <Text>Static</Text>
      </Card>,
    )
    const root = container.firstElementChild as HTMLElement
    expect(getComputedStyle(root).cursor).toBe('')
  })
})

/**
 * `outlineStyle: 'none'` is a react-native-web-only key — RN's own types do not
 * even admit `'none'`, so `styles.ts` casts to get it through. It suppresses
 * the browser's default focus ring, which the field replaces with its own
 * active indicator. If the cast ever stops translating, the field paints both.
 */
describe('TextField suppresses the UA focus outline', () => {
  it.each([
    { name: 'filled', ui: <TextField label="Name" /> },
    { name: 'outlined', ui: <TextField label="Name" variant="outlined" /> },
  ])('$name', ({ ui }) => {
    renderWeb(ui)
    expect(getComputedStyle(screen.getByRole('textbox')).outlineStyle).toBe(
      'none',
    )
  })
})

/**
 * `pointerEvents: 'none'` on a decorative overlay is what keeps it from eating
 * the clicks meant for the control underneath. On native it changes
 * hit-testing that no assertion here can observe; on web it is a real CSS
 * declaration, so this is the only project that can confirm it arrived.
 */
describe('decorative overlays do not intercept pointer events', () => {
  it('Tabs — the sliding indicator sits over the tabs', () => {
    const { container } = renderWeb(<Tabs items={TAB_ITEMS} value="flights" />)
    const none = Array.from(
      container.querySelectorAll<HTMLElement>('*'),
    ).filter((node) => getComputedStyle(node).pointerEvents === 'none')
    expect(none.length).toBeGreaterThan(0)
  })
})
