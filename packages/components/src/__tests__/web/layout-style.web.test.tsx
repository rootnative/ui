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
 */
import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Button } from '../../button'
import { Chip } from '../../chip'
import { FAB } from '../../fab'
import { IconButton } from '../../icon-button'
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
