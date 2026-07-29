/**
 * DOM-level regression net for **elevation** on web.
 *
 * Why this file exists: react-native-web does not render the classic
 * `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` /
 * `elevation` keys at all — the only shadow the browser paints is a CSS
 * `box-shadow`. An elevation animation built from the native keys alone
 * therefore renders nothing on web while passing every native assertion, which
 * is the failure the whole `web/` project exists to catch.
 *
 * So: read the DOM. The elevated Card's shadow has to arrive as a real
 * `box-shadow` declaration on a real element.
 */
import { Text } from 'react-native'
import { Button } from '../../button'
import { Card } from '../../card'
import { Chip } from '../../chip'
import { FAB } from '../../fab'
import { renderWeb } from './render-web'

/** Every element carrying a non-empty inline `box-shadow`. */
function boxShadows(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('*'))
    .map((node) => node.style.boxShadow)
    .filter((value) => value !== '' && value !== 'none')
}

it('renders the interactive elevated Card shadow as a CSS box-shadow', () => {
  const { container } = renderWeb(
    <Card onPress={() => {}}>
      <Text>Elevated</Text>
    </Card>,
  )

  // Exactly one shadow surface, at the level 1 rest token: `useShadow` emits
  // px lengths and an interpolated rgba colour, so match on shape rather than
  // on the theme's own string form.
  const shadows = boxShadows(container)
  expect(shadows).toHaveLength(1)
  expect(shadows[0]).toMatch(/^0px 1px 2px 0px rgba\(0, 0, 0, 0\.16\d*\)$/)
})

it('does not paint a shadow for a filled Card', () => {
  const { container } = renderWeb(
    <Card onPress={() => {}} variant="filled">
      <Text>Filled</Text>
    </Card>,
  )
  expect(boxShadows(container)).toHaveLength(0)
})

// The other three components on the same mechanism. Levels differ (the FAB
// rests at level 3), so each is matched against its own rest token.
it.each([
  {
    name: 'Button',
    ui: <Button variant="elevated">Elevated</Button>,
    shadow: /^0px 1px 2px 0px rgba\(0, 0, 0, 0\.16\d*\)$/,
  },
  {
    name: 'Chip',
    ui: <Chip elevated>Assist</Chip>,
    shadow: /^0px 1px 2px 0px rgba\(0, 0, 0, 0\.16\d*\)$/,
  },
  {
    name: 'FAB',
    ui: <FAB icon="plus" accessibilityLabel="Add" />,
    shadow: /^0px 4px 8px 0px rgba\(0, 0, 0, 0\.24\d*\)$/,
  },
])('renders the $name elevation as a CSS box-shadow', ({ ui, shadow }) => {
  const { container } = renderWeb(ui)
  const shadows = boxShadows(container)
  expect(shadows).toHaveLength(1)
  expect(shadows[0]).toMatch(shadow)
})
