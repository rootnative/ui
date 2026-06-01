import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { Slider } from '../slider/Slider'

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
