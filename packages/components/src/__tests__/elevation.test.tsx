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
