/**
 * The layout keys of a consumer `style` reach the wrapper, not the pressable.
 *
 * These components wrap the pressable in a `View` with
 * `alignSelf: 'flex-start'`, which holds the focus ring and the shadow. A
 * `Button` with `style={{ alignSelf: 'center' }}` in a centred column stayed
 * at the start edge, because the key reached only the pressable inside the
 * wrapper.
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
  const wrapper = button.parentElement as HTMLElement
  return { button, wrapper }
}

describe.each(cases)('%s — layout keys in style', (_name, render) => {
  it('alignSelf reaches the wrapper, so the button can be centred', () => {
    const { wrapper } = nodes(render({ alignSelf: 'center' }))
    expect(getComputedStyle(wrapper).alignSelf).toBe('center')
  })

  it('a margin moves the wrapper, so the focus ring stays on the button', () => {
    const { button, wrapper } = nodes(render({ marginTop: 12 }))
    expect(getComputedStyle(wrapper).marginTop).toBe('12px')
    expect(getComputedStyle(button).marginTop).not.toBe('12px')
  })

  it('position and insets place the wrapper', () => {
    const { button, wrapper } = nodes(
      render({ position: 'absolute', right: 16, bottom: 16 }),
    )
    expect(getComputedStyle(wrapper).position).toBe('absolute')
    expect(getComputedStyle(wrapper).right).toBe('16px')
    expect(getComputedStyle(button).position).not.toBe('absolute')
  })

  it('flexGrow grows the wrapper, and the button fills it', () => {
    const { button, wrapper } = nodes(render({ flexGrow: 1 }))
    expect(getComputedStyle(wrapper).flexGrow).toBe('1')
    expect(getComputedStyle(button).flexGrow).toBe('1')
  })

  it('every other key stays on the button', () => {
    const { button, wrapper } = nodes(render({ opacity: 0.5 }))
    expect(getComputedStyle(button).opacity).toBe('0.5')
    expect(getComputedStyle(wrapper).opacity).not.toBe('0.5')
  })
})
