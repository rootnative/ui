import { useInterpolatedStyle, useMotionValue } from '@rootnative/inertia'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { PRESSED_HALF, REST_HALF } from '../slider/geometry'
import { Slider } from '../slider/Slider'
import { ThumbSlot } from '../slider/slots'
import {
  SLIDER_THUMB_WIDTH,
  SLIDER_THUMB_WIDTH_PRESSED,
} from '../slider/styles'

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

  it('reports current value via accessibilityValue', () => {
    renderWithTheme(<Slider defaultValue={0.42} />)
    const slider = screen.getByRole('adjustable')
    expect(slider.props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 1, now: 0 }),
    )
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

  it('supports range mode with [low, high] defaultValue', () => {
    renderWithTheme(
      <Slider minimumValue={0} maximumValue={100} defaultValue={[20, 80]} />,
    )
    const slider = screen.getByRole('adjustable')
    expect(slider.props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 100, now: 20 }),
    )
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
})
