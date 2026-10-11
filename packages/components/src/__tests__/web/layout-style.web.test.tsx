/**
 * The keys of a consumer `style` that place or size the component reach the
 * outer view, not the pressable.
 *
 * These components put the pressable, the focus ring and the shadow in a
 * frame, and the frame in an outer view that the parent lays out. A key on
 * the pressable resolves against the frame, which is only as big as the
 * button: `alignSelf: 'center'` did nothing, and `width: '50%'` gave half of
 * the button's own width on the web. jsdom computes no layout, so these
 * tests read the styles that make the layout.
 *
 * `Card` with `onPress` and `Switch` have no frame view. The card fills its
 * outer view, and the switch keeps its MD3 size in it.
 */
import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { Button } from '../../button'
import { Card } from '../../card'
import { Chip } from '../../chip'
import { FAB } from '../../fab'
import { IconButton } from '../../icon-button'
import { Switch } from '../../switch'
import { renderWeb } from './render-web'

type Render = (style: StyleProp<ViewStyle>) => ReactElement

const cases: [string, Render][] = [
  ['Button', (style) => <Button style={style}>Save</Button>],
  [
    'IconButton',
    (style) => (
      <IconButton icon="heart" accessibilityLabel="Like" style={style} />
    ),
  ],
  [
    'FAB',
    (style) => <FAB icon="plus" accessibilityLabel="Add" style={style} />,
  ],
  [
    'Chip',
    (style) => (
      <Chip onPress={() => {}} style={style}>
        Tag
      </Chip>
    ),
  ],
]

function nodes(ui: ReactElement) {
  renderWeb(ui)
  const button = screen.getByRole('button')
  const frame = button.parentElement as HTMLElement
  const outer = frame.parentElement as HTMLElement
  return { button, frame, outer }
}

describe.each(cases)('%s — layout keys in style', (_name, render) => {
  it('the outer view sets no alignSelf, so the parent alignItems places it', () => {
    const { frame, outer } = nodes(render(undefined))
    expect(getComputedStyle(outer).alignSelf).not.toBe('flex-start')
    expect(getComputedStyle(outer).alignItems).toBe('flex-start')
    expect(getComputedStyle(frame).alignSelf).not.toBe('stretch')
  })

  it('alignSelf reaches the outer view, so the button can be centred', () => {
    const { outer } = nodes(render({ alignSelf: 'center' }))
    expect(getComputedStyle(outer).alignSelf).toBe('center')
  })

  it('a margin moves the outer view, so the focus ring stays on the button', () => {
    const { button, outer } = nodes(render({ marginTop: 12 }))
    expect(getComputedStyle(outer).marginTop).toBe('12px')
    expect(getComputedStyle(button).marginTop).not.toBe('12px')
  })

  it('position and insets place the outer view', () => {
    const { button, outer } = nodes(
      render({ position: 'absolute', right: 16, bottom: 16 }),
    )
    expect(getComputedStyle(outer).position).toBe('absolute')
    expect(getComputedStyle(outer).right).toBe('16px')
    expect(getComputedStyle(button).position).not.toBe('absolute')
  })

  it('a width sizes the outer view, and the frame and the button fill it', () => {
    const { button, frame, outer } = nodes(render({ width: '50%' }))
    expect(getComputedStyle(outer).width).toBe('50%')
    expect(getComputedStyle(frame).minWidth).toBe('100%')
    expect(getComputedStyle(button).width).not.toBe('50%')
  })

  it('minWidth and maxWidth move with a width, so they clamp it', () => {
    const { button, outer } = nodes(render({ width: '100%', maxWidth: 300 }))
    expect(getComputedStyle(outer).maxWidth).toBe('300px')
    expect(getComputedStyle(button).maxWidth).not.toBe('300px')
  })

  it('minWidth with no width stays on the button', () => {
    const { button, frame, outer } = nodes(render({ minWidth: 200 }))
    expect(getComputedStyle(button).minWidth).toBe('200px')
    expect(getComputedStyle(outer).minWidth).not.toBe('200px')
    expect(getComputedStyle(frame).minWidth).not.toBe('100%')
  })

  it('flexGrow grows the outer view, and the frame and the button fill it', () => {
    const { button, frame, outer } = nodes(render({ flexGrow: 1 }))
    expect(getComputedStyle(outer).flexGrow).toBe('1')
    expect(getComputedStyle(frame).flexGrow).toBe('1')
    expect(getComputedStyle(frame).alignSelf).toBe('stretch')
    expect(getComputedStyle(button).flexGrow).toBe('1')
    expect(getComputedStyle(button).width).toBe('100%')
  })

  it('alignSelf stretch makes the frame and the button fill the outer view', () => {
    const { button, frame, outer } = nodes(render({ alignSelf: 'stretch' }))
    expect(getComputedStyle(outer).alignSelf).toBe('stretch')
    expect(getComputedStyle(frame).alignSelf).toBe('stretch')
    expect(getComputedStyle(frame).flexGrow).toBe('1')
    expect(getComputedStyle(button).flexGrow).toBe('1')
  })

  it('every other key stays on the button', () => {
    const { button, outer } = nodes(render({ opacity: 0.5 }))
    expect(getComputedStyle(button).opacity).toBe('0.5')
    expect(getComputedStyle(outer).opacity).not.toBe('0.5')
  })
})

function cardNodes(style: StyleProp<ViewStyle>) {
  renderWeb(
    <Card onPress={() => {}} style={style}>
      <Text>Body</Text>
    </Card>,
  )
  const card = screen.getByRole('button')
  return { card, outer: card.parentElement as HTMLElement }
}

describe('Card with onPress — layout keys in style', () => {
  it('flex reaches the outer view, and the card fills it', () => {
    const { card, outer } = cardNodes({ flex: 1 })
    expect(getComputedStyle(outer).flexGrow).toBe('1')
    expect(getComputedStyle(card).flexGrow).toBe('1')
    expect(getComputedStyle(card).width).toBe('100%')
  })

  it('alignSelf reaches the outer view', () => {
    const { card, outer } = cardNodes({ alignSelf: 'center' })
    expect(getComputedStyle(outer).alignSelf).toBe('center')
    expect(getComputedStyle(card).alignSelf).not.toBe('center')
  })

  it('a margin moves the outer view, so the focus ring stays on the card', () => {
    const { card, outer } = cardNodes({ marginTop: 12 })
    expect(getComputedStyle(outer).marginTop).toBe('12px')
    expect(getComputedStyle(card).marginTop).not.toBe('12px')
  })

  it('a width sizes the outer view, and the card fills it', () => {
    const { card, outer } = cardNodes({ width: '50%', maxWidth: 300 })
    expect(getComputedStyle(outer).width).toBe('50%')
    expect(getComputedStyle(outer).maxWidth).toBe('300px')
    expect(getComputedStyle(card).width).not.toBe('50%')
    expect(getComputedStyle(outer).alignItems).not.toBe('flex-start')
  })

  it('every other key stays on the card', () => {
    const { card, outer } = cardNodes({ padding: 16, opacity: 0.5 })
    expect(getComputedStyle(card).paddingTop).toBe('16px')
    expect(getComputedStyle(card).opacity).toBe('0.5')
    expect(getComputedStyle(outer).opacity).not.toBe('0.5')
  })

  it('a Card without onPress keeps every key on its one node', () => {
    renderWeb(
      <Card testID="card" style={{ flex: 1, marginTop: 12 }}>
        <Text>Body</Text>
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(getComputedStyle(card).flexGrow).toBe('1')
    expect(getComputedStyle(card).marginTop).toBe('12px')
  })
})

function switchNodes(style: StyleProp<ViewStyle>) {
  renderWeb(<Switch accessibilityLabel="Wi-Fi" style={style} />)
  const track = screen.getByRole('switch')
  const frame = track.parentElement as HTMLElement
  return { track, frame, outer: frame.parentElement as HTMLElement }
}

describe('Switch — layout keys in style', () => {
  it('the outer view sets no alignSelf, so the parent alignItems places it', () => {
    const { outer } = switchNodes(undefined)
    expect(getComputedStyle(outer).alignSelf).not.toBe('flex-start')
  })

  it('a margin moves the outer view, so the focus ring stays on the track', () => {
    const { track, outer } = switchNodes({ marginTop: 8 })
    expect(getComputedStyle(outer).marginTop).toBe('8px')
    expect(getComputedStyle(track).marginTop).not.toBe('8px')
  })

  it('alignSelf and position reach the outer view', () => {
    const { track, outer } = switchNodes({
      alignSelf: 'center',
      position: 'absolute',
      top: 4,
    })
    expect(getComputedStyle(outer).alignSelf).toBe('center')
    expect(getComputedStyle(outer).position).toBe('absolute')
    expect(getComputedStyle(track).position).not.toBe('absolute')
  })

  it('flex grows the outer view, and the track keeps its size', () => {
    const { track, frame, outer } = switchNodes({ flex: 1 })
    expect(getComputedStyle(outer).flexGrow).toBe('1')
    expect(getComputedStyle(frame).flexGrow).not.toBe('1')
    expect(getComputedStyle(track).flexGrow).not.toBe('1')
    expect(getComputedStyle(track).width).toBe('52px')
  })

  it('a width sizes the outer view, and the track keeps its size', () => {
    const { track, outer } = switchNodes({ width: 120 })
    expect(getComputedStyle(outer).width).toBe('120px')
    expect(getComputedStyle(track).width).toBe('52px')
  })

  it('every other key stays on the track', () => {
    const { track, outer } = switchNodes({ opacity: 0.5 })
    expect(getComputedStyle(track).opacity).toBe('0.5')
    expect(getComputedStyle(outer).opacity).not.toBe('0.5')
  })
})
