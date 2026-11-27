/**
 * The components pass their `hitSlop` on the web too. react-native-web does
 * not implement the prop: it must drop it with no DOM attribute and no
 * warning, because a web runtime that has `hitSlop` relies on the same prop
 * for the 48dp touch target.
 *
 * Before, each of these components passed `undefined` on the web. If
 * react-native-web starts to forward or to warn about the prop, this file
 * fails, and the call sites need a new answer.
 */
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { Avatar } from '../../avatar'
import { Button } from '../../button'
import { ButtonGroup } from '../../button-group'
import { Card } from '../../card'
import { Chip } from '../../chip'
import { ListItem } from '../../list'
import { Switch } from '../../switch'
import { renderWeb } from './render-web'

const noop = (): void => {}

// Functions, not elements: an element in an array literal needs a `key`.
const CASES: [string, () => ReactElement][] = [
  ['Button', () => <Button size="extraSmall">Save</Button>],
  ['Switch', () => <Switch accessibilityLabel="Wi-Fi" />],
  [
    'ButtonGroup',
    () => (
      <ButtonGroup
        size="extraSmall"
        items={[
          { value: 'a', label: 'One' },
          { value: 'b', label: 'Two' },
        ]}
      />
    ),
  ],
  ['Chip', () => <Chip onPress={noop}>Filter</Chip>],
  ['Avatar', () => <Avatar label="AB" size="small" onPress={noop} />],
  ['ListItem', () => <ListItem headlineText="Row" onPress={noop} />],
  [
    'Card',
    () => (
      <Card onPress={noop} accessibilityLabel="Card">
        <Text>Body</Text>
      </Card>
    ),
  ],
]

describe('hitSlop on react-native-web', () => {
  it.each(CASES)(
    '%s renders with no hitslop attribute and no warning',
    (_, render) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(noop)
      const error = jest.spyOn(console, 'error').mockImplementation(noop)
      try {
        const { container } = renderWeb(render())

        expect(container.querySelectorAll('[hitslop], [hitSlop]')).toHaveLength(
          0,
        )
        expect(container.innerHTML.toLowerCase()).not.toContain('hitslop')
        expect(container.firstElementChild).not.toBeNull()
        expect(warn).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()
      } finally {
        warn.mockRestore()
        error.mockRestore()
      }
    },
  )
})
