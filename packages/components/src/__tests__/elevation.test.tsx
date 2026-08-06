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
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../button'
import { Card } from '../card'
import { Chip } from '../chip'
import { FAB } from '../fab'

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
  const expectedInk =
    `${level1.shadowOffset.width}px ${level1.shadowOffset.height}px ` +
    `${level1.shadowRadius}px rgba(0, 0, 0, ${level1.shadowOpacity})`

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
