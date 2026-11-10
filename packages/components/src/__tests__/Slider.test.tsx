import { useInterpolatedStyle, useMotionValue } from '@rootnative/inertia'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { I18nManager } from 'react-native'
import { PRESSED_HALF, REST_HALF } from '../slider/geometry'
import { Slider } from '../slider/Slider'
import { ThumbSlot } from '../slider/slots'
import {
  SLIDER_THUMB_WIDTH,
  SLIDER_THUMB_WIDTH_PRESSED,
} from '../slider/styles'
import type { SliderProps } from '../slider/types'

// Spy on the real hook rather than replacing it: the assertion below is about
// the options `ThumbSlot` passes, and the component must still render.
jest.mock('@rootnative/inertia', () => {
  const actual = jest.requireActual('@rootnative/inertia')
  return {
    ...actual,
    useInterpolatedStyle: jest.fn(actual.useInterpolatedStyle),
  }
})

describe('Slider', () => {
  it('renders with adjustable role', () => {
    renderWithTheme(<Slider defaultValue={0.5} />)
    expect(screen.getByRole('adjustable')).toBeTruthy()
  })

  it('reports the current value unrounded via accessibilityValue', () => {
    renderWithTheme(<Slider defaultValue={0.42} />)
    const slider = screen.getByRole('adjustable')
    expect(slider.props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 1, now: 0.42 }),
    )
  })

  it('claims the keys it handles so the page does not scroll', () => {
    const onValueChange = jest.fn()
    renderWithTheme(
      <Slider
        minimumValue={0}
        maximumValue={100}
        defaultValue={50}
        onValueChange={onValueChange}
      />,
    )
    const slider = screen.getByRole('adjustable')
    const preventDefault = jest.fn()

    fireEvent(slider, 'keyDown', {
      nativeEvent: { key: 'End' },
      preventDefault,
    })
    expect(onValueChange).toHaveBeenCalledWith(100)
    expect(preventDefault).toHaveBeenCalledTimes(1)

    fireEvent(slider, 'keyDown', { nativeEvent: { key: ' ' }, preventDefault })
    fireEvent(slider, 'keyDown', { nativeEvent: { key: 'a' }, preventDefault })
    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  it('uses integer-bound min/max from props', () => {
    renderWithTheme(
      <Slider minimumValue={0} maximumValue={100} defaultValue={50} />,
    )
    const slider = screen.getByRole('adjustable')
    expect(slider.props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 100, now: 50 }),
    )
  })

  it('reports disabled state', () => {
    renderWithTheme(<Slider disabled />)
    const slider = screen.getByRole('adjustable')
    expect(slider.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    )
  })

  it('exposes increment/decrement accessibility actions', () => {
    renderWithTheme(<Slider defaultValue={0.5} />)
    const slider = screen.getByRole('adjustable')
    const actionNames = (slider.props.accessibilityActions ?? []).map(
      (a: { name: string }) => a.name,
    )
    expect(actionNames).toEqual(
      expect.arrayContaining(['increment', 'decrement']),
    )
  })

  it('calls onValueChange on increment a11y action', () => {
    const onValueChange = jest.fn()
    renderWithTheme(
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={10}
        defaultValue={20}
        onValueChange={onValueChange}
      />,
    )
    const slider = screen.getByRole('adjustable')
    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    })
    expect(onValueChange).toHaveBeenCalledWith(30)
  })

  it('calls onValueChange on decrement a11y action', () => {
    const onValueChange = jest.fn()
    renderWithTheme(
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={10}
        defaultValue={20}
        onValueChange={onValueChange}
      />,
    )
    const slider = screen.getByRole('adjustable')
    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    })
    expect(onValueChange).toHaveBeenCalledWith(10)
  })

  it('clamps at maximumValue on increment', () => {
    const onValueChange = jest.fn()
    renderWithTheme(
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={10}
        defaultValue={100}
        onValueChange={onValueChange}
      />,
    )
    const slider = screen.getByRole('adjustable')
    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('does not adjust when disabled', () => {
    const onValueChange = jest.fn()
    renderWithTheme(
      <Slider defaultValue={0.5} disabled onValueChange={onValueChange} />,
    )
    const slider = screen.getByRole('adjustable')
    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  describe('range mode', () => {
    const renderRange = (props: Partial<SliderProps> = {}) => {
      const onValueChange = jest.fn()
      renderWithTheme(
        <Slider
          minimumValue={0}
          maximumValue={100}
          step={10}
          defaultValue={[20, 80]}
          onValueChange={onValueChange}
          {...props}
        />,
      )
      const [start, end] = screen.getAllByRole('adjustable')
      return { start: start!, end: end!, onValueChange }
    }
    const perform = (node: ReturnType<typeof screen.getByRole>, name: string) =>
      fireEvent(node, 'accessibilityAction', {
        nativeEvent: { actionName: name },
      })

    it('gives each thumb its own control, with a range that ends at the other thumb', () => {
      const { start, end } = renderRange()
      expect(screen.getAllByRole('adjustable')).toHaveLength(2)
      expect(start.props.accessibilityLabel).toBe('Minimum')
      expect(start.props.accessibilityValue).toEqual({
        min: 0,
        max: 80,
        now: 20,
        text: '20',
      })
      expect(end.props.accessibilityLabel).toBe('Maximum')
      expect(end.props.accessibilityValue).toEqual({
        min: 20,
        max: 100,
        now: 80,
        text: '80',
      })
    })

    it('an increment on the end thumb moves the high value only', () => {
      const { end, onValueChange } = renderRange()
      perform(end, 'increment')
      expect(onValueChange).toHaveBeenLastCalledWith([20, 90])
    })

    it('a decrement on the start thumb moves the low value only', () => {
      const { start, onValueChange } = renderRange()
      perform(start, 'decrement')
      expect(onValueChange).toHaveBeenLastCalledWith([10, 80])
    })

    it('a thumb stops at the other thumb', () => {
      const { start, onValueChange } = renderRange({
        defaultValue: [70, 80],
      })
      perform(start, 'increment')
      perform(start, 'increment')
      expect(onValueChange).toHaveBeenLastCalledWith([80, 80])
    })

    it('joins the slider label and the thumb label', () => {
      const { start, end } = renderRange({
        accessibilityLabel: 'Runtime',
        endThumbAccessibilityLabel: 'Longest',
      })
      expect(start.props.accessibilityLabel).toBe('Runtime, Minimum')
      expect(end.props.accessibilityLabel).toBe('Runtime, Longest')
    })

    it('keeps the thumbs out of a wrapper that VoiceOver would read as one element', () => {
      const { start, end } = renderRange()
      const wrappers = screen.root.findAll(
        (node) =>
          typeof node.type === 'string' && node.props.accessible === false,
      )
      const wrapper = wrappers.find(
        (node) => node.findAll((child) => child === start).length > 0,
      )
      expect(wrapper).toBeDefined()
      expect(wrapper!.findAll((child) => child === end)).toHaveLength(1)
    })

    it('a disabled range slider ignores the actions of both thumbs', () => {
      const { start, end, onValueChange } = renderRange({ disabled: true })
      perform(start, 'increment')
      perform(end, 'decrement')
      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  it('emits onSlidingComplete on accessibility action', () => {
    const onSlidingComplete = jest.fn()
    renderWithTheme(
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={10}
        defaultValue={50}
        onSlidingComplete={onSlidingComplete}
      />,
    )
    const slider = screen.getByRole('adjustable')
    fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    })
    expect(onSlidingComplete).toHaveBeenCalledWith(60)
  })

  it('uses a custom formatValueLabel for the accessibility text', () => {
    renderWithTheme(
      <Slider
        minimumValue={0}
        maximumValue={100}
        defaultValue={50}
        formatValueLabel={(v) => `${v}%`}
      />,
    )
    const slider = screen.getByRole('adjustable')
    expect(slider.props.accessibilityValue).toEqual(
      expect.objectContaining({ text: '50%' }),
    )
  })
})

const THUMB_CENTER_X = 100

function ThumbAt({ pressed }: { pressed: number }) {
  const value = useMotionValue(pressed)
  return (
    <ThumbSlot
      thumbId="low"
      centerX={THUMB_CENTER_X}
      pressed={value}
      baseStyle={{}}
      disabledStyle={undefined}
    />
  )
}

/**
 * `ThumbSlot` must interpolate with `extrapolate: 'extend'`, not the default
 * `'clamp'`. `pressed` rides `spring-fast-spatial`, which is underdamped and
 * overshoots both ends, and `evalEdge` extrapolates that same value unclamped
 * for the track segments and the stop indicators. A clamped thumb would sit
 * still at its endpoint while the track around it kept moving, for the length
 * of every settle.
 *
 * This asserts the **options passed**, not the numbers produced, and that is
 * deliberate: `@rootnative/inertia/jest-setup` stubs `interpolate` as
 * `value >= 1 ? last : first`, a binary step that ignores the input range and
 * the extrapolation config entirely. Rendered output therefore cannot tell
 * `'extend'` from `'clamp'` — an assertion on a measured width would pass
 * against either and prove nothing. The call is the only observable difference
 * in this environment; the rendered behaviour needs a device.
 */
describe('Slider thumb extrapolation', () => {
  const mockedHook = useInterpolatedStyle as jest.MockedFunction<
    typeof useInterpolatedStyle
  >

  beforeEach(() => {
    mockedHook.mockClear()
  })

  it('asks for `extend` so the thumb tracks the segments through overshoot', () => {
    renderWithTheme(<ThumbAt pressed={0} />)

    expect(mockedHook).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        width: [SLIDER_THUMB_WIDTH, SLIDER_THUMB_WIDTH_PRESSED],
        borderRadius: [REST_HALF, PRESSED_HALF],
      }),
      { extrapolate: 'extend' },
    )
  })

  it('offsets `left` by half the thumb width at each end', () => {
    renderWithTheme(<ThumbAt pressed={0} />)

    // Read the recorded map directly rather than matching the whole call, so
    // this case fails only on the geometry and not on a missing option — that
    // is the case above's job.
    const [, map] = mockedHook.mock.calls[0]
    expect(map.left).toEqual([
      THUMB_CENTER_X - REST_HALF,
      THUMB_CENTER_X - PRESSED_HALF,
    ])
  })

  describe('accessibility actions in RTL', () => {
    const original = I18nManager.isRTL
    afterEach(() => {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: original,
        configurable: true,
      })
    })

    it('increment still raises the value', () => {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: true,
        configurable: true,
      })
      const onValueChange = jest.fn()
      renderWithTheme(
        <Slider
          minimumValue={0}
          maximumValue={100}
          step={1}
          defaultValue={50}
          onValueChange={onValueChange}
        />,
      )
      fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      })
      expect(onValueChange).toHaveBeenLastCalledWith(51)
    })
  })
})
