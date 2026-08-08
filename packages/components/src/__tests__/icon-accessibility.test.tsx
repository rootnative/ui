/**
 * Decorative icons must not reach the accessibility tree.
 *
 * The bug this pins was found on an Android device, not here: `renderIcon`
 * produces a `<Text>` holding a private-use-area glyph, and React Native merges
 * descendant text into an accessible ancestor's `contentDescription`. A
 * `<Button leadingIcon="plus">Add Item</Button>` was therefore announced as
 * "<U+F0415>, Add Item", and a checked `Checkbox` — which has no text of its
 * own — was announced as the check glyph *alone*. A screen reader reads a
 * private-use codepoint as nothing, or as an unknown symbol.
 *
 * **Why this asserts tree shape rather than the announced string.** The
 * `MaterialCommunityIcons` mock in `jest.setup.js` renders the icon *name*
 * ("check"), never a glyph, so a test that scanned for private-use codepoints
 * would be green no matter what the component did. The structural precondition
 * is the thing jest can actually see: an `aria-hidden` ancestor is what stops
 * the merge, on both platforms at once — RN's `View` maps `aria-hidden` onto
 * `accessibilityElementsHidden` (iOS) and
 * `importantForAccessibility="no-hide-descendants"` (Android).
 *
 * It also deliberately does not go through RNTL's `includeHiddenElements`
 * model. That treats `opacity: 0` and `display: none` as hidden too, so a
 * `Switch` icon resting at zero opacity would keep the test green after the
 * flag was deleted. Reading the prop off the ancestor chain cannot pass for
 * that reason.
 *
 * `CONTROL_CASES` at the bottom is the fault-injection guard: they assert the
 * walker returns *false* for nodes that are genuinely exposed, so a bug that
 * made `hasHiddenAncestor` always-true could not make this file pass.
 */
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { View } from 'react-native'
import { Avatar } from '../avatar'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Checkbox } from '../checkbox'
import { Chip } from '../chip'
import { Dialog } from '../dialog'
import { FAB } from '../fab'
import { IconButton } from '../icon-button'
import { Menu } from '../menu'
import { NavigationBar } from '../navigation-bar'
import { PortalHost } from '../portal/PortalHost'
import { Slider } from '../slider'
import { Switch } from '../switch'
import { Tabs } from '../tabs'
import { TextField } from '../text-field'

type Node = {
  props?: Record<string, unknown>
  children?: unknown[]
}

/** A probe stands in for whatever a resolver would render. */
const PROBE = <View testID="icon-probe" />

/**
 * Walk from the root, carrying the ancestor chain, and report whether the node
 * matching `match` sits under a node with `aria-hidden`. Returns `null` when no
 * node matched, so a case that silently stopped rendering its icon fails loudly
 * instead of passing as "hidden".
 */
function hasHiddenAncestor(
  match: (node: Node) => boolean,
  root: unknown = screen.toJSON(),
  ancestors: Node[] = [],
): boolean | null {
  if (!root || typeof root !== 'object') return null
  const self = root as Node
  if (match(self)) {
    return ancestors.some((a) => a.props?.['aria-hidden'] === true)
  }
  for (const child of self.children ?? []) {
    const found = hasHiddenAncestor(match, child, [...ancestors, self])
    if (found !== null) return found
  }
  return null
}

const byTestID = (id: string) => (node: Node) => node.props?.testID === id
/** The icon mock renders the icon name as its only text child. */
const byIconName = (name: string) => (node: Node) =>
  Array.isArray(node.children) &&
  node.children.length === 1 &&
  node.children[0] === name

const probeHidden = () => hasHiddenAncestor(byTestID('icon-probe'))

/** Components whose icon can be injected directly. */
const CASES: Array<{ name: string; render: () => void }> = [
  {
    name: 'Button — leadingIcon',
    render: () => renderWithTheme(<Button leadingIcon={PROBE}>OK</Button>),
  },
  {
    name: 'Button — trailingIcon',
    render: () => renderWithTheme(<Button trailingIcon={PROBE}>OK</Button>),
  },
  {
    name: 'Chip — leadingIcon',
    render: () => renderWithTheme(<Chip leadingIcon={PROBE}>Tag</Chip>),
  },
  {
    name: 'Checkbox — checkIcon',
    render: () => renderWithTheme(<Checkbox value checkIcon={PROBE} />),
  },
  {
    name: 'Switch — selectedIcon',
    render: () => renderWithTheme(<Switch value selectedIcon={PROBE} />),
  },
  {
    name: 'Switch — unselectedIcon',
    render: () =>
      renderWithTheme(<Switch value={false} unselectedIcon={PROBE} />),
  },
  {
    name: 'TextField — leadingIcon',
    render: () => renderWithTheme(<TextField label="A" leadingIcon={PROBE} />),
  },
  {
    name: 'TextField — trailingIcon',
    render: () =>
      renderWithTheme(
        <TextField
          label="A"
          trailingIcon={PROBE}
          onTrailingIconPress={() => {}}
        />,
      ),
  },
  {
    name: 'FAB — icon',
    render: () =>
      renderWithTheme(<FAB icon={PROBE} accessibilityLabel="New" />),
  },
  {
    name: 'IconButton — icon',
    render: () =>
      renderWithTheme(<IconButton icon={PROBE} accessibilityLabel="Like" />),
  },
  {
    name: 'ButtonGroup — leadingIcon',
    render: () =>
      renderWithTheme(
        <ButtonGroup
          items={[{ value: 'a', label: 'A', leadingIcon: PROBE }]}
        />,
      ),
  },
  {
    name: 'ButtonGroup — trailingIcon',
    render: () =>
      renderWithTheme(
        <ButtonGroup
          items={[{ value: 'a', label: 'A', trailingIcon: PROBE }]}
        />,
      ),
  },
  {
    name: 'Slider — startIcon',
    render: () => renderWithTheme(<Slider startIcon={PROBE} />),
  },
  {
    name: 'Slider — endIcon',
    render: () => renderWithTheme(<Slider endIcon={PROBE} />),
  },
  {
    name: 'Tabs — item icon',
    render: () =>
      renderWithTheme(
        <Tabs items={[{ value: 'a', label: 'A', icon: PROBE }]} />,
      ),
  },
  {
    name: 'NavigationBar — item icon',
    render: () =>
      renderWithTheme(
        <NavigationBar items={[{ value: 'a', label: 'A', icon: PROBE }]} />,
      ),
  },
  {
    name: 'Avatar — icon',
    render: () => renderWithTheme(<Avatar icon={PROBE} />),
  },
  {
    name: 'Dialog.Icon',
    render: () =>
      renderSettled(
        <PortalHost>
          <Dialog visible onDismiss={() => {}} testID="dialog">
            <Dialog.Icon icon={PROBE} />
            <Dialog.Title>Title</Dialog.Title>
          </Dialog>
        </PortalHost>,
      ),
  },
]

describe('decorative icons stay out of the accessibility tree', () => {
  it.each(CASES)('$name', ({ render }) => {
    render()
    expect(probeHidden()).toBe(true)
  })

  // Chip paints these itself from a string name, so there is no prop to inject
  // a probe through — they are found by the name the icon mock renders.
  it('Chip — the filter variant checkmark', () => {
    renderWithTheme(
      <Chip variant="filter" selected>
        Tag
      </Chip>,
    )
    expect(hasHiddenAncestor(byIconName('check'))).toBe(true)
  })

  it('Chip — the close affordance', () => {
    renderWithTheme(
      <Chip variant="input" onClose={() => {}}>
        Tag
      </Chip>,
    )
    expect(hasHiddenAncestor(byIconName('close'))).toBe(true)
  })

  it('Menu.Item — leading and trailing icons', async () => {
    renderWithTheme(
      <PortalHost>
        <Menu anchor={<Button>Actions</Button>} testID="menu">
          <Menu.Item
            label="Edit"
            leadingIcon="pencil"
            trailingIcon="chevron-right"
          />
        </Menu>
      </PortalHost>,
    )
    fireEvent.press(screen.getByRole('button', { name: 'Actions' }))
    await screen.findByTestId('menu')

    expect(hasHiddenAncestor(byIconName('pencil'))).toBe(true)
    expect(hasHiddenAncestor(byIconName('chevron-right'))).toBe(true)
  })
})

/**
 * Fault injection. Without these, a `hasHiddenAncestor` that always returned
 * `true` — or an `aria-hidden` accidentally hoisted onto a whole component —
 * would leave every assertion above green.
 */
const CONTROL_CASES: Array<{ name: string; render: () => void }> = [
  {
    name: "a Button's own label is not hidden",
    render: () => renderWithTheme(<Button leadingIcon={PROBE}>Save</Button>),
  },
  {
    name: "a Chip's own label is not hidden",
    render: () => renderWithTheme(<Chip leadingIcon={PROBE}>Tag</Chip>),
  },
]

describe('the walker distinguishes hidden from exposed', () => {
  it.each(CONTROL_CASES)('$name', ({ render }) => {
    render()
    const label = (node: Node) =>
      Array.isArray(node.children) &&
      (node.children[0] === 'Save' || node.children[0] === 'Tag')
    expect(hasHiddenAncestor(label)).toBe(false)
  })

  it('reports null when nothing matches, so a missing icon cannot read as hidden', () => {
    renderWithTheme(<Button>No icon</Button>)
    expect(probeHidden()).toBeNull()
  })
})
