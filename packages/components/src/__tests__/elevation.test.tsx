/**
 * The shared elevation mechanism, on the native surface.
 *
 * Card, Button, Chip and FAB all raise their shadow one MD3 level on hover.
 * The shadow rides a dedicated absolutely-positioned carrier View rather than
 * the container, and `useShadow` interpolates it between the two levels. The
 * carrier is not a style preference: iOS clips a view's own shadow away when
 * the view sets `overflow: 'hidden'` (RN moves clipping onto an inner
 * container view only for the CSS `boxShadow` surface, never for the classic
 * `shadow*` keys), and Card and Chip both clip their children to the corner
 * radius. A shadow on those containers would render on web and vanish on iOS.
 *
 * These assertions therefore pin two things a device would otherwise have to
 * catch: the shadow lives on a node that does not clip, and native gets the
 * `shadow*` surface only — never `boxShadow` alongside it, which paints two
 * shadows on the new architecture. The CSS side is in `web/elevation.web.test.tsx`.
 *
 * The invariant is "a clipped node must not carry a clipped shadow surface", and
 * there are two ways to satisfy it. Four components move the shadow onto an
 * unclipped carrier. The non-interactive elevated Card cannot — a carrier needs a
 * wrapper above the root, which relocates consumer `style` — so it changes
 * surface instead: on iOS it trades `shadow*` for `boxShadow`, which Fabric
 * deliberately paints outside the clip. Its own block below asserts that shape.
 */
import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import { BottomSheet } from '../bottom-sheet'
import { Button } from '../button'
import { Card } from '../card'
import { Chip } from '../chip'
import { Dialog } from '../dialog'
import {
  elevationBoxShadow,
  elevationBoxShadowForFabric,
  elevationShadowConfig,
} from '../elevation-shadow'
import { FAB } from '../fab'
import { Menu } from '../menu'
import { NavigationBar } from '../navigation-bar'
import { NavigationDrawer } from '../navigation-drawer'
import { PortalHost } from '../portal/PortalHost'
import { SnackbarProvider, useSnackbar } from '../snackbar'
import { Tooltip } from '../tooltip'

type Style = Record<string, unknown>

/** Every node's flattened style, in tree order. */
function styles(node: unknown): Style[] {
  if (!node || typeof node !== 'object') return []
  const { props, children } = node as {
    props?: { style?: unknown }
    children?: unknown[]
  }
  const own = props?.style ? [StyleSheet.flatten(props.style) as Style] : []
  return [...own, ...(children ?? []).flatMap(styles)]
}

/** The nodes actually painting a shadow. */
function shadowed(): Style[] {
  return styles(screen.toJSON()).filter(
    (style) => ((style.shadowOpacity as number) ?? 0) > 0,
  )
}

const CASES = [
  {
    name: 'Card',
    ui: (
      <Card onPress={() => {}}>
        <Text>Body</Text>
      </Card>
    ),
    rest: lightTheme.elevation.level1,
  },
  {
    name: 'Button',
    ui: <Button variant="elevated">Elevated</Button>,
    rest: lightTheme.elevation.level1,
  },
  {
    name: 'Chip',
    ui: <Chip elevated>Assist</Chip>,
    rest: lightTheme.elevation.level1,
  },
  {
    name: 'FAB',
    ui: <FAB icon="plus" accessibilityLabel="Add" />,
    rest: lightTheme.elevation.level3,
  },
] as const

describe.each(CASES)('$name elevation', ({ ui, rest }) => {
  it('paints its shadow on exactly one node, and that node does not clip', () => {
    renderWithTheme(ui)
    const layers = shadowed()
    expect(layers).toHaveLength(1)
    expect(layers[0].overflow).not.toBe('hidden')
  })

  it('rests on its MD3 elevation token', () => {
    renderWithTheme(ui)
    // `useShadow` interpolates from here to the next level as hover progresses;
    // at rest its output must be the token exactly.
    expect(shadowed()[0]).toMatchObject({
      shadowColor: rest.shadowColor,
      shadowOffset: rest.shadowOffset,
      shadowOpacity: rest.shadowOpacity,
      shadowRadius: rest.shadowRadius,
      elevation: rest.elevation,
    })
  })

  it('emits no boxShadow alongside the native shadow keys', () => {
    renderWithTheme(ui)
    for (const style of styles(screen.toJSON())) {
      expect(style.boxShadow).toBeUndefined()
    }
  })
})

/**
 * The flat variants rest at level 0 and rise to level 1 on hover (Compose
 * `FilledButtonTokens`, `FilledTonalButtonTokens`, `FilledCardTokens`,
 * `OutlinedCardTokens`). At rest nothing paints, so the "exactly one shadow
 * node" rule above is not disturbed; after a hover the carrier is that node.
 */
const HOVER_CASES = [
  { name: 'filled Button', ui: <Button>Filled</Button> },
  { name: 'tonal Button', ui: <Button variant="tonal">Tonal</Button> },
  {
    name: 'filled Card',
    ui: (
      <Card variant="filled" onPress={() => {}}>
        <Text>Body</Text>
      </Card>
    ),
  },
  {
    name: 'outlined Card',
    ui: (
      <Card variant="outlined" onPress={() => {}}>
        <Text>Body</Text>
      </Card>
    ),
  },
] as const

describe.each(HOVER_CASES)('$name hover elevation', ({ ui }) => {
  it('paints no shadow at rest and one level-1 shadow on hover', () => {
    const { flush } = renderSettled(ui)
    expect(shadowed()).toHaveLength(0)

    fireEvent(screen.getByRole('button'), 'hoverIn')
    flush()

    const layers = shadowed()
    expect(layers).toHaveLength(1)
    expect(layers[0].overflow).not.toBe('hidden')
    expect(layers[0]).toMatchObject({
      shadowOpacity: lightTheme.elevation.level1.shadowOpacity,
      shadowRadius: lightTheme.elevation.level1.shadowRadius,
      elevation: lightTheme.elevation.level1.elevation,
    })
  })
})

it.each([
  { name: 'outlined Button', ui: <Button variant="outlined">Outlined</Button> },
  { name: 'text Button', ui: <Button variant="text">Text</Button> },
])('$name stays flat on hover', ({ ui }) => {
  const { flush } = renderSettled(ui)
  fireEvent(screen.getByRole('button'), 'hoverIn')
  flush()
  expect(shadowed()).toHaveLength(0)
})

function SnackbarOnMount() {
  const snackbar = useSnackbar()
  useEffect(() => {
    snackbar.show({ message: 'Saved', duration: 'indefinite' })
  }, [snackbar])
  return null
}

/**
 * The surfaces that take their elevation statically through `elevationStyle`
 * and never move it. They share the two invariants above: one shadow node that
 * does not clip, and no `boxShadow` beside the native keys.
 */
const STATIC_CASES = [
  {
    name: 'Menu',
    ui: (
      <PortalHost>
        <Menu visible anchor={null} onDismiss={() => {}}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>
    ),
    rest: lightTheme.elevation.level2,
  },
  {
    name: 'Dialog',
    ui: (
      <PortalHost>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
    rest: lightTheme.elevation.level3,
  },
  {
    name: 'Snackbar',
    ui: (
      <PortalHost>
        <SnackbarProvider>
          <SnackbarOnMount />
        </SnackbarProvider>
      </PortalHost>
    ),
    rest: lightTheme.elevation.level3,
  },
  {
    name: 'Tooltip (rich)',
    ui: (
      <PortalHost>
        <Tooltip visible variant="rich" anchor={null} onDismiss={() => {}}>
          Rich
        </Tooltip>
      </PortalHost>
    ),
    rest: lightTheme.elevation.level2,
  },
  {
    name: 'BottomSheet',
    ui: (
      <PortalHost>
        <BottomSheet visible onDismiss={() => {}}>
          <Text>Sheet</Text>
        </BottomSheet>
      </PortalHost>
    ),
    rest: lightTheme.elevation.level1,
  },
  {
    name: 'NavigationDrawer (modal)',
    ui: (
      <PortalHost>
        <NavigationDrawer variant="modal" visible onDismiss={() => {}}>
          <NavigationDrawer.Item value="home" label="Home" />
        </NavigationDrawer>
      </PortalHost>
    ),
    rest: lightTheme.elevation.level1,
  },
  {
    name: 'NavigationBar',
    ui: (
      <NavigationBar
        items={[
          { value: 'home', label: 'Home', icon: 'home-outline' },
          { value: 'search', label: 'Search', icon: 'magnify' },
        ]}
      />
    ),
    rest: lightTheme.elevation.level2,
  },
] as const

describe.each(STATIC_CASES)('$name elevation', ({ ui, rest }) => {
  it('paints its shadow on exactly one node, and that node does not clip', () => {
    renderWithTheme(ui)
    const layers = shadowed()
    expect(layers).toHaveLength(1)
    expect(layers[0].overflow).not.toBe('hidden')
  })

  it('sits on its MD3 elevation token', () => {
    renderWithTheme(ui)
    expect(shadowed()[0]).toMatchObject({
      shadowColor: rest.shadowColor,
      shadowOffset: rest.shadowOffset,
      shadowOpacity: rest.shadowOpacity,
      shadowRadius: rest.shadowRadius,
      elevation: rest.elevation,
    })
  })

  it('emits no boxShadow alongside the native shadow keys', () => {
    renderWithTheme(ui)
    for (const style of styles(screen.toJSON())) {
      expect(style.boxShadow).toBeUndefined()
    }
  })
})

// The non-interactive elevated Card satisfies the same invariant by swapping the
// shadow *surface* instead of moving the shadow to another node, and that choice
// is what these tests pin. It has no carrier, because a carrier is an
// absolutely-positioned sibling and so needs a wrapper View above the container
// — which would make the wrapper the node the parent lays out and silently stop
// `<Card style={{ flex: 1 }}>` from stretching. Moving the clip to an inner view
// instead would push children one level down and break `flexDirection` /
// `alignItems` / `gap` passed through `style`.
//
// So on iOS the container keeps its clip and its single node, and trades
// `shadow*` for `boxShadow`: when a view clips *and* declares `boxShadow`,
// Fabric moves the subviews into a container view of its own and paints the
// shadow as unclipped overflow ink (`RCTViewComponentView.mm`,
// `styleWouldClipOverflowInk`). This was the `it.failing` case until 2026-08-06.
//
// These run as `Platform.OS === 'ios'` (the react-native preset's default), so
// the branch under test is the real one.
describe('non-interactive elevated Card', () => {
  const level1 = lightTheme.elevation.level1
  // Rebuilt from the token rather than imported, so a format change in the
  // builder has to be acknowledged here too.
  //
  // The blur is `shadowRadius * 2`, and that factor is the whole point of
  // `elevationBoxShadowForFabric`. This string is read by React Native, not by
  // a browser, and Fabric halves a `boxShadow` blur before it reaches the
  // `CALayer` (`RCTBoxShadow.mm`). So doubling here is what makes this card
  // land on the token's own radius, matching every `shadow*` surface beside
  // it. Writing the token's radius straight in is the bug this replaced.
  const expectedInk =
    `${level1.shadowOffset.width}px ${level1.shadowOffset.height}px ` +
    `${level1.shadowRadius * 2}px rgba(0, 0, 0, ${level1.shadowOpacity})`

  function root() {
    renderWithTheme(
      <Card testID="card">
        <Text>Body</Text>
      </Card>,
    )
    return StyleSheet.flatten(screen.getByTestId('card').props.style) as Style
  }

  it('paints its MD3 level-1 shadow as overflow ink', () => {
    expect(root().boxShadow).toBe(expectedInk)
  })

  it('drops the clipped shadow* surface, so the node never carries both', () => {
    expect(root().shadowOpacity).toBe(0)
    expect(shadowed()).toHaveLength(0)
  })

  it('still clips, which is the whole reason the surface had to change', () => {
    expect(root().overflow).toBe('hidden')
  })

  // The structural promise: the node the consumer styles is the node that
  // paints. No wrapper above it and no clip view below it, so every layout prop
  // passed through `style` keeps behaving as it did before the fix.
  it('keeps the shadow on the same single node consumer style lands on', () => {
    renderWithTheme(
      <Card testID="card">
        <Text>Body</Text>
      </Card>,
    )
    const inked = styles(screen.toJSON()).filter(
      (style) => style.boxShadow !== undefined && style.boxShadow !== 'none',
    )
    // Exactly one inked node, and it is the consumer-styled root — `flatten`
    // returns a fresh object per call, so this compares by value.
    expect(inked).toHaveLength(1)
    expect(inked[0]).toEqual(
      StyleSheet.flatten(screen.getByTestId('card').props.style),
    )
  })
})

// The surface swap is scoped to the variant that actually has a shadow. A
// non-elevated non-interactive Card must not pick up overflow ink — pinned
// because a blanket version would put a `boxShadow` on every Card.
describe.each([
  { variant: 'filled' as const },
  { variant: 'outlined' as const },
])('non-interactive $variant Card', ({ variant }) => {
  it('paints no shadow on either surface', () => {
    renderWithTheme(
      <Card variant={variant} testID="card">
        <Text>Body</Text>
      </Card>,
    )
    const root = StyleSheet.flatten(screen.getByTestId('card').props.style)
    expect(shadowed()).toHaveLength(0)
    expect(root.boxShadow).toBeUndefined()
    expect(root.overflow).toBe('hidden')
  })
})

describe('elevation is dropped where MD3 has none', () => {
  it.each([
    {
      name: 'filled Card',
      ui: (
        <Card onPress={() => {}} variant="filled">
          <Text>Body</Text>
        </Card>
      ),
    },
    {
      name: 'disabled Card',
      ui: (
        <Card onPress={() => {}} disabled>
          <Text>Body</Text>
        </Card>
      ),
    },
    { name: 'filled Button', ui: <Button variant="filled">Filled</Button> },
    {
      name: 'disabled elevated Button',
      ui: (
        <Button variant="elevated" disabled>
          Elevated
        </Button>
      ),
    },
    { name: 'flat Chip', ui: <Chip>Assist</Chip> },
    {
      name: 'disabled elevated Chip',
      ui: (
        <Chip elevated disabled>
          Assist
        </Chip>
      ),
    },
    {
      name: 'disabled FAB',
      ui: <FAB icon="plus" accessibilityLabel="Add" disabled />,
    },
  ])('$name paints no shadow', ({ ui }) => {
    renderWithTheme(ui)
    expect(shadowed()).toHaveLength(0)
  })
})

/**
 * `elevationShadowConfig` and `elevationBoxShadow` are public exports, so the
 * platform split is a contract rather than an implementation detail. The four
 * component cases above exercise it indirectly; these pin it directly, because
 * a consumer can now call the helper on a node this file never renders.
 *
 * The mutual exclusion is the whole point. A config carrying `boxShadow`
 * *and* the `shadow*` keys paints two shadows on RN 0.76+ new architecture,
 * which is also why `theme.elevation.level*` has no `boxShadow` field — a
 * token holding both shapes could not be handed to `useShadow` anywhere. The
 * web half of this contract is in `web/elevation.web.test.tsx`.
 */
describe('elevationShadowConfig (native branch)', () => {
  it('returns the shadow* keys and never boxShadow', () => {
    const config = elevationShadowConfig(lightTheme.elevation.level2)

    expect(config).toEqual({
      shadowColor: lightTheme.elevation.level2.shadowColor,
      shadowOffset: {
        width: lightTheme.elevation.level2.shadowOffset.width,
        height: lightTheme.elevation.level2.shadowOffset.height,
      },
      shadowOpacity: lightTheme.elevation.level2.shadowOpacity,
      shadowRadius: lightTheme.elevation.level2.shadowRadius,
      elevation: lightTheme.elevation.level2.elevation,
    })
    expect(config).not.toHaveProperty('boxShadow')
  })

  it('carries level0 as a real zero, not as an absent key', () => {
    // `useShadow` pairs endpoints by key. A level0 that omitted the keys
    // would tween from `undefined`, not from flat.
    expect(elevationShadowConfig(lightTheme.elevation.level0)).toMatchObject({
      shadowOpacity: 0,
      elevation: 0,
    })
  })
})

describe('elevationBoxShadow', () => {
  it('renders a level as one CSS layer', () => {
    const { shadowOffset, shadowRadius, shadowOpacity } =
      lightTheme.elevation.level1

    expect(elevationBoxShadow(lightTheme.elevation.level1)).toBe(
      `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    )
  })

  it("maps a zero-opacity level to 'none'", () => {
    // inertia parses `'none'` to zero layers, so paired against a real level
    // it pads with an invisible layer and fades in rather than popping.
    expect(elevationBoxShadow(lightTheme.elevation.level0)).toBe('none')
  })
})

/**
 * The two readers of a `boxShadow` string do not agree on what the blur number
 * means, so the library needs both spellings.
 *
 * A browser takes it as written, and react-native-web emits `shadowRadius` as
 * the blur radius 1:1 — so `elevationBoxShadow` is right for the web. React
 * Native halves it: `shadowLayer.shadowRadius = shadow.blurRadius / 2` in
 * `React/Fabric/Utils/RCTBoxShadow.mm`, an adjustment its own comment says
 * exists to make the blur look more like the web. The doubling is what stops
 * the one component that takes this path — the non-interactive Card on iOS —
 * from rendering at half the softness of the same token beside it.
 */
describe('elevationBoxShadowForFabric', () => {
  it('doubles the blur so Fabric halves it back to the token radius', () => {
    const { shadowOffset, shadowRadius, shadowOpacity } =
      lightTheme.elevation.level1

    expect(elevationBoxShadowForFabric(lightTheme.elevation.level1)).toBe(
      `${shadowOffset.width}px ${shadowOffset.height}px ` +
        `${shadowRadius * 2}px rgba(0, 0, 0, ${shadowOpacity})`,
    )
  })

  it('leaves the web spelling alone', () => {
    // The two must not converge. Doubling the web branch would make every web
    // shadow in the library twice as soft.
    expect(elevationBoxShadowForFabric(lightTheme.elevation.level2)).not.toBe(
      elevationBoxShadow(lightTheme.elevation.level2),
    )
  })

  it("keeps a zero-opacity level at 'none'", () => {
    // Doubling zero is still zero, but the early return is what has to hold:
    // `0px 0px 0px rgba(...)` would be a layer, not the absence of one.
    expect(elevationBoxShadowForFabric(lightTheme.elevation.level0)).toBe(
      'none',
    )
  })
})
