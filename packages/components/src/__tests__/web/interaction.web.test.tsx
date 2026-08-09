/**
 * DOM-level regression net for **pointer and keyboard interaction on web**.
 *
 * Why this file exists: web is the only platform with a real pointer. Hover
 * does not exist on a touch device, and `:focus-visible` — showing a focus ring
 * to keyboard users but not to mouse users — is a browser concept with no
 * native equivalent. So the entire hover half of `useStateLayer` and all of
 * `focus-visible.ts`'s modality tracking are, by construction, unreachable from
 * the `react-native` project. `focus-visible.ts` in particular installs its
 * `keydown`/`pointerdown` listeners only when `document` exists, so on native it
 * is a constant `'pointer'` and every branch below it is dead code.
 *
 * What this covers that `focus.web.test.tsx` does not: that file is about focus
 * *order* and the `aria-*` attributes relating two elements. This one is about
 * the visual feedback — which layer paints, and for which input modality.
 *
 * **These tests must settle.** The web project shares the native suite's
 * Reanimated mock, so it inherits the staleness documented in CLAUDE.md: the
 * render that commits an interaction runs the `useAnimatedStyle` worklet before
 * its own effect writes the new shared value. An assertion taken directly after
 * `fireEvent.mouseEnter` reads the *rest* background and passes for entirely the
 * wrong reason — a false green that looks identical to a real one. Hence
 * `renderWebSettled` and the explicit `flush()` after every event.
 */
import { isFocusVisible } from '@rootnative/utils'
import { fireEvent, screen } from '@testing-library/react'
import { Button } from '../../button'
import { Card } from '../../card'
import { Checkbox } from '../../checkbox'
import { Chip } from '../../chip'
import { FAB } from '../../fab'
import { IconButton } from '../../icon-button'
import { ListItem } from '../../list'
import { Radio } from '../../radio'
import { Switch } from '../../switch'
import { renderWebSettled } from './render-web'

/**
 * The modality store in `focus-visible.ts` is module-level and shared across
 * every test in the file, so a test that leaves it on `'keyboard'` would make
 * the next one's "mouse focus paints nothing" assertion pass vacuously. Reset
 * to pointer — the default — before each test.
 */
beforeEach(() => {
  fireEvent.pointerDown(document)
})

/** The inline background of the node carrying the animated state layer. */
function background(role: string) {
  return screen.getByRole(role).style.backgroundColor
}

describe('hover paints a state layer', () => {
  it.each([
    { name: 'Button', role: 'button', ui: <Button>Save</Button> },
    {
      name: 'IconButton',
      role: 'button',
      ui: <IconButton icon="heart" accessibilityLabel="Like" />,
    },
    { name: 'Chip', role: 'button', ui: <Chip>Assist</Chip> },
    {
      name: 'FAB',
      role: 'button',
      ui: <FAB icon="plus" accessibilityLabel="Add" />,
    },
    {
      name: 'ListItem',
      role: 'button',
      ui: <ListItem headlineText="Item" onPress={() => {}} />,
    },
  ])('$name', ({ role, ui }) => {
    const { flush } = renderWebSettled(ui)
    const rest = background(role)

    fireEvent.mouseEnter(screen.getByRole(role))
    flush()

    expect(background(role)).not.toBe(rest)
  })

  it('returns to the rest color when the pointer leaves', () => {
    const { flush } = renderWebSettled(<Button>Save</Button>)
    const rest = background('button')

    fireEvent.mouseEnter(screen.getByRole('button'))
    flush()
    expect(background('button')).not.toBe(rest)

    fireEvent.mouseLeave(screen.getByRole('button'))
    flush()
    expect(background('button')).toBe(rest)
  })

  it('paints nothing while disabled', () => {
    const { flush } = renderWebSettled(<Button disabled>Save</Button>)
    const rest = background('button')

    fireEvent.mouseEnter(screen.getByRole('button'))
    flush()

    expect(background('button')).toBe(rest)
  })

  /**
   * The override contract in CLAUDE.md: a `containerColor` override must
   * re-derive its own hover layer rather than leaving the variant default. On
   * web that is checkable end to end, because the derived color is a real
   * inline background.
   */
  it('derives the hover layer from a containerColor override', () => {
    const { flush } = renderWebSettled(
      <Button containerColor="rgb(0, 128, 0)">Save</Button>,
    )
    expect(background('button')).toBe('rgb(0, 128, 0)')

    fireEvent.mouseEnter(screen.getByRole('button'))
    flush()

    const hovered = background('button')
    expect(hovered).not.toBe('rgb(0, 128, 0)')
    // Derived from the override, so it must not be the default variant's
    // hover layer either.
    expect(hovered).not.toBe('rgb(115, 94, 171)')
  })
})

/**
 * The selection controls are deliberately not in the table above. Their state
 * layer is a circular **halo** whose opacity animates — per MD3, where a
 * checkbox/radio/switch shows a round overlay rather than tinting its own box —
 * so nothing about their container background changes on hover. Asserting on
 * `backgroundColor` here would look like a hover regression while the control
 * is behaving exactly as specified.
 */
describe('selection controls hover through a halo, not a background', () => {
  /** Inline opacities in the subtree, which is where the halo lives. */
  function opacities(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>('*'))
      .map((node) => node.style.opacity)
      .filter((value) => value !== '')
  }

  it.each([
    { name: 'Checkbox', role: 'checkbox', ui: <Checkbox /> },
    { name: 'Radio', role: 'radio', ui: <Radio /> },
    { name: 'Switch', role: 'switch', ui: <Switch /> },
  ])('$name', ({ role, ui }) => {
    const { container, flush } = renderWebSettled(ui)
    expect(opacities(container).every((value) => value === '0')).toBe(true)

    fireEvent.mouseEnter(screen.getByRole(role))
    flush()

    // The theme's hovered opacity, reached from 0.
    expect(opacities(container)).toContain('0.08')
  })
})

/**
 * The `:focus-visible` contract. A mouse user clicking a button must not get a
 * focus ring; a keyboard user tabbing to it must. `focus-visible.ts` decides
 * this from the *last input event seen on the document*, which is why each test
 * dispatches one before focusing.
 */
describe('focus feedback is keyboard-only', () => {
  it('paints no focus layer when focus arrives from a pointer', () => {
    const { flush } = renderWebSettled(<Button>Save</Button>)
    const rest = background('button')

    fireEvent.pointerDown(document)
    fireEvent.focus(screen.getByRole('button'))
    flush()

    expect(background('button')).toBe(rest)
  })

  it('paints a focus layer when focus arrives from the keyboard', () => {
    const { flush } = renderWebSettled(<Button>Save</Button>)
    const rest = background('button')

    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.focus(screen.getByRole('button'))
    flush()

    expect(background('button')).not.toBe(rest)
  })

  /**
   * A modifier chord (⌘R, Ctrl+C) is not navigation — it is routinely pressed
   * with the other hand while using a mouse, so it must not flip the modality
   * and light up a focus ring on the next click.
   */
  /**
   * `@rootnative/utils`' own modality store ignores modifier chords (⌘R,
   * Ctrl+C) on purpose: they are routinely pressed with the other hand during
   * mouse work, so treating one as navigation would light a focus ring on the
   * next click. This asserts that policy.
   *
   * **It is not the store the state layers actually consult.** `useStateLayer`
   * → inertia's `useGestureLayer` calls inertia's *own* `isFocusVisible`
   * (`packages/core/src/gestures/focusVisibility.ts`), a second, independent
   * tracker whose `keydown` listener has no modifier guard — so a chord does
   * flip the painted layer. See the `it.failing` below, which pins that gap.
   */
  it('the utils modality store ignores a modifier chord', () => {
    fireEvent.pointerDown(document)
    fireEvent.keyDown(document, { key: 'r', metaKey: true })
    expect(isFocusVisible()).toBe(false)

    // Positive control, so the assertion above cannot pass by the store being
    // inert: a bare navigation key does flip it.
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(isFocusVisible()).toBe(true)
  })

  /**
   * Known gap, pinned rather than deleted — the same convention the repo used
   * for the Card iOS shadow bug and the two native a11y gaps.
   *
   * A modifier chord flips inertia's modality tracker to `'keyboard'`, so the
   * *next focus* paints a focus layer even though the user is working with a
   * mouse. Press ⌘S in a form, click a button, and it lights up as if tabbed
   * to.
   *
   * The fix belongs upstream, not here: per CLAUDE.md a missing capability is
   * built in inertia, and `focusVisibility.ts` needs the same modifier guard
   * `@rootnative/utils/focus-visible.ts` already has. This test goes green on
   * its own once that ships and the pin is bumped.
   */
  it.failing('a modifier chord does not paint a focus layer', () => {
    fireEvent.pointerDown(document)
    const { flush } = renderWebSettled(<Button>Save</Button>)
    const rest = background('button')

    fireEvent.keyDown(document, { key: 'r', metaKey: true })
    fireEvent.focus(screen.getByRole('button'))
    flush()

    expect(background('button')).toBe(rest)
  })

  it('goes back to pointer modality after a click', () => {
    const { flush } = renderWebSettled(<Button>Save</Button>)
    const rest = background('button')

    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.focus(screen.getByRole('button'))
    flush()
    expect(background('button')).not.toBe(rest)

    fireEvent.blur(screen.getByRole('button'))
    fireEvent.pointerDown(document)
    fireEvent.focus(screen.getByRole('button'))
    flush()
    expect(background('button')).toBe(rest)
  })
})

/**
 * The focus *ring* is a separate absolutely-positioned node whose opacity is
 * driven by `states.focusVisible`, rather than part of the state-layer
 * background. It is the visible affordance, so it gets its own assertions.
 */
describe('the focus ring follows the same modality rule', () => {
  /** Inline opacities in the subtree — the ring is the only node that sets one. */
  function opacities(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>('*'))
      .map((node) => node.style.opacity)
      .filter((value) => value !== '')
  }

  it('is transparent at rest', () => {
    const { container } = renderWebSettled(<Button>Save</Button>)
    expect(opacities(container)).toContain('0')
  })

  it('stays transparent for a pointer focus', () => {
    const { container, flush } = renderWebSettled(<Button>Save</Button>)

    fireEvent.pointerDown(document)
    fireEvent.focus(screen.getByRole('button'))
    flush()

    expect(opacities(container)).toContain('0')
    expect(opacities(container)).not.toContain('1')
  })

  it('becomes opaque for a keyboard focus', () => {
    const { container, flush } = renderWebSettled(<Button>Save</Button>)

    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.focus(screen.getByRole('button'))
    flush()

    expect(opacities(container)).toContain('1')
  })

  it.each([
    { name: 'Card', ui: <Card onPress={() => {}}>{null}</Card> },
    { name: 'Chip', ui: <Chip>Assist</Chip> },
    {
      name: 'FAB',
      ui: <FAB icon="plus" accessibilityLabel="Add" />,
    },
  ])('$name paints a ring on keyboard focus', ({ ui }) => {
    const { container, flush } = renderWebSettled(ui)

    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.focus(screen.getByRole('button'))
    flush()

    expect(opacities(container)).toContain('1')
  })
})
