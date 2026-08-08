/**
 * The DOM half of the decorative-icon fix.
 *
 * `icon-accessibility.test.tsx` asserts the React tree carries `aria-hidden`
 * over every icon. That is the right assertion for native — RN's `View` turns
 * the prop into `accessibilityElementsHidden` / `importantForAccessibility` —
 * but it is exactly the shape of assertion this project has already been burnt
 * by once: `accessibilityState` passed every prop-level test for the life of
 * the library while react-native-web dropped it on the way to the DOM (see the
 * header of `aria.web.test.tsx`).
 *
 * So this file reads the attribute back off real DOM nodes. If RNW ever stops
 * forwarding `aria-hidden`, the native suite stays green and this one does not.
 */
import { screen } from '@testing-library/react'
import { Button } from '../../button'
import { Checkbox } from '../../checkbox'
import { Chip } from '../../chip'
import { IconButton } from '../../icon-button'
import { TextField } from '../../text-field'
import { renderWeb } from './render-web'

/**
 * Every element the browser removes from the accessibility tree for this
 * subtree. One is enough — `aria-hidden` on an ancestor hides its descendants.
 */
function hiddenCount(container: HTMLElement) {
  return container.querySelectorAll('[aria-hidden="true"]').length
}

describe('decorative icons carry aria-hidden in the DOM', () => {
  it('Button — leading icon', () => {
    const { container } = renderWeb(<Button leadingIcon="check">OK</Button>)
    expect(hiddenCount(container)).toBeGreaterThan(0)
  })

  it('Button — no icon, nothing hidden', () => {
    const { container } = renderWeb(<Button>OK</Button>)
    expect(hiddenCount(container)).toBe(0)
  })

  it('Chip — leading icon', () => {
    const { container } = renderWeb(<Chip leadingIcon="star">Tag</Chip>)
    expect(hiddenCount(container)).toBeGreaterThan(0)
  })

  it('IconButton — icon', () => {
    const { container } = renderWeb(
      <IconButton icon="heart" accessibilityLabel="Like" />,
    )
    expect(hiddenCount(container)).toBeGreaterThan(0)
  })

  it('Checkbox — the check mark, when checked', () => {
    const { container } = renderWeb(<Checkbox value />)
    expect(hiddenCount(container)).toBeGreaterThan(0)
  })

  it('TextField — leading icon', () => {
    const { container } = renderWeb(
      <TextField label="Search" leadingIcon="magnify" />,
    )
    expect(hiddenCount(container)).toBeGreaterThan(0)
  })

  /**
   * The label is the point of all this: hiding must be surgical. A blanket
   * `aria-hidden` somewhere up the tree would satisfy every count above while
   * removing the whole control from the accessibility tree.
   */
  it('hides the icon without hiding the label', () => {
    const { container } = renderWeb(
      <Button leadingIcon="check">Add Item</Button>,
    )
    expect(hiddenCount(container)).toBeGreaterThan(0)
    expect(screen.getByText('Add Item').closest('[aria-hidden="true"]')).toBe(
      null,
    )
    expect(screen.getByRole('button').getAttribute('aria-hidden')).toBe(null)
  })
})
