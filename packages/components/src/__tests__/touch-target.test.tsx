/**
 * No interactive control may be smaller than 48dp once `hitSlop` is counted.
 *
 * WCAG 2.5.5 and MD3 both put the floor there, and several MD3 Expressive size
 * tokens sit under it on purpose — `Button` at `xs`, a `ButtonGroup` item at
 * `extraSmall` and a `Switch` track are all 32dp tall. `hitSlop` is what closes
 * the gap, so the container height alone proves nothing and neither does the
 * slop alone. This asserts the sum.
 *
 * It exists because a device sweep found the flat `hitSlop={4}` those three
 * shipped, which leaves a 32dp control at 40dp. `IconButton` already computed
 * the value correctly, and its formula is now the shared
 * `internal/touchTarget.ts` helper.
 *
 * **Height only, except where the width is token-driven.** A `Button`'s width
 * comes from its label, so there is no fixed number to assert; `IconButton` is
 * the one control sized on both axes by tokens, and it gets both checked —
 * `narrow` at `xs` is 28x32dp, which a single height-derived slop would leave
 * 44dp wide.
 *
 * **Native only.** react-native-web does not implement `hitSlop`, so on web
 * these controls are their token size. That is a real platform gap rather than
 * something this file can assert away — see `Platform.OS === 'web'` at each
 * call site.
 */
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Button } from '../button'
import type { ButtonSize } from '../button/types'
import { ButtonGroup } from '../button-group'
import type { ButtonGroupSize } from '../button-group/types'
import { Chip } from '../chip'
import { FAB } from '../fab'
import { IconButton } from '../icon-button'
import type { IconButtonSize, IconButtonWidth } from '../icon-button/types'
import { MIN_TOUCH_TARGET } from '../internal/touchTarget'
import { Switch } from '../switch'

type Slop =
  | number
  | { top?: number; bottom?: number; left?: number; right?: number }
  | undefined

/** `hitSlop` is either one number for every side or a per-side object. */
function slopFor(slop: Slop, axis: 'vertical' | 'horizontal'): number {
  if (slop === undefined) return 0
  if (typeof slop === 'number') return slop * 2
  return axis === 'vertical'
    ? (slop.top ?? 0) + (slop.bottom ?? 0)
    : (slop.left ?? 0) + (slop.right ?? 0)
}

/**
 * The rendered size of the pressable, plus its slop. `height`/`width` are the
 * fixed spellings; `minHeight` is what the label-sized controls use.
 */
function target(role: string) {
  const node = screen.getAllByRole(role)[0]
  const style = StyleSheet.flatten(node.props.style) ?? {}
  const slop = node.props.hitSlop as Slop
  return {
    height: (style.height ?? style.minHeight ?? 0) + slopFor(slop, 'vertical'),
    width: (style.width ?? style.minWidth ?? 0) + slopFor(slop, 'horizontal'),
  }
}

const BUTTON_SIZES: ButtonSize[] = ['xs', 's', 'm', 'l', 'xl']
const GROUP_SIZES: ButtonGroupSize[] = [
  'extraSmall',
  'small',
  'medium',
  'large',
  'extraLarge',
]
const ICON_SIZES: IconButtonSize[] = ['xs', 's', 'm', 'l', 'xl']
const ICON_WIDTHS: IconButtonWidth[] = ['narrow', 'uniform', 'wide']

describe('every control clears the 48dp touch target', () => {
  it.each(BUTTON_SIZES)('Button — size %s', (size) => {
    renderWithTheme(<Button size={size}>OK</Button>)
    expect(target('button').height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it.each(GROUP_SIZES)('ButtonGroup — size %s', (size) => {
    renderWithTheme(
      <ButtonGroup
        size={size}
        variant="connected"
        items={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    )
    expect(target('button').height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  // Both axes: the only control whose width is a size token rather than its
  // content.
  it.each(
    ICON_SIZES.flatMap((size) => ICON_WIDTHS.map((width) => ({ size, width }))),
  )('IconButton — $size / $width', ({ size, width }) => {
    renderWithTheme(
      <IconButton
        icon="heart"
        size={size}
        width={width}
        accessibilityLabel="Like"
      />,
    )
    const { height, width: w } = target('button')
    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
    expect(w).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it('Switch', () => {
    renderWithTheme(<Switch value onValueChange={() => {}} />)
    const { height, width } = target('switch')
    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
    expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it('Chip', () => {
    renderWithTheme(<Chip>Tag</Chip>)
    expect(target('button').height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it.each(['small', 'medium', 'large'] as const)('FAB — size %s', (size) => {
    renderWithTheme(<FAB icon="plus" size={size} accessibilityLabel="Add" />)
    const { height, width } = target('button')
    expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
    expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })
})

/**
 * Fault injection. `target()` reads two optional style keys and an optional
 * prop, so a spelling that stopped resolving would report 0 and every
 * assertion above would fail loudly — but a *silent* pass is the danger, and
 * these are what rule it out: the helper has to produce a real number, and the
 * slop has to be the thing carrying the small sizes over the line.
 */
describe('the measurement is real', () => {
  it('reads a container height that is already over the floor', () => {
    renderWithTheme(<Button size="m">OK</Button>)
    // 56dp container, so slop contributes nothing.
    expect(target('button').height).toBe(56)
  })

  it('reads the slop that carries the smallest sizes', () => {
    renderWithTheme(<Button size="xs">OK</Button>)
    // 32dp container + 8dp a side. Without the slop this is 32, not 48.
    expect(target('button').height).toBe(48)
  })

  it('ButtonGroup adds no horizontal slop, so connected items cannot overlap', () => {
    renderWithTheme(
      <ButtonGroup
        size="extraSmall"
        variant="connected"
        items={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    )
    const slop = screen.getAllByRole('button')[0].props.hitSlop
    expect(slop).toEqual({ top: 8, bottom: 8, left: 0, right: 0 })
  })
})
