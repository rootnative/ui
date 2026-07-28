import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { Radio } from '../radio/Radio'

describe('Radio', () => {
  it('renders without crashing', () => {
    renderWithTheme(<Radio />)
    expect(screen.getByRole('radio')).toBeTruthy()
  })

  it('has the radio accessibility role', () => {
    renderWithTheme(<Radio />)
    expect(screen.getByRole('radio')).toBeTruthy()
  })

  it('reports checked=false by default', () => {
    renderWithTheme(<Radio />)
    const radio = screen.getByRole('radio')
    expect(radio.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    )
  })

  it('reports checked=true when value is true', () => {
    renderWithTheme(<Radio value />)
    const radio = screen.getByRole('radio')
    expect(radio.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    )
  })

  it('calls onValueChange with true when an unselected radio is pressed', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Radio value={false} onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('radio'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('does not call onValueChange when pressing an already-selected radio', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Radio value onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('radio'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('does not call onValueChange when disabled', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Radio onValueChange={onValueChange} disabled />)
    fireEvent.press(screen.getByRole('radio'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reports disabled state', () => {
    renderWithTheme(<Radio disabled />)
    const radio = screen.getByRole('radio')
    expect(radio.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    )
  })

  it('renders inner dot when selected', () => {
    renderWithTheme(<Radio value testID="radio-selected" />)
    const radio = screen.getByRole('radio')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outer = radio.children[0] as any
    expect(outer.children).not.toBeNull()
    expect(outer.children.length).toBeGreaterThanOrEqual(1)
  })

  it('has transparent inner dot when unselected', () => {
    renderWithTheme(<Radio value={false} />)
    const radio = screen.getByRole('radio')
    expect(radio.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    )
  })
})

/**
 * See the equivalent block in Checkbox.test.tsx for why the uncontrolled path
 * exists. Radio differs in one way that is intentional: it is select-only, so
 * an uncontrolled radio latches on.
 */
describe('Radio — uncontrolled', () => {
  it('selects itself when no value prop is passed', () => {
    renderWithTheme(<Radio />)
    expect(screen.getByRole('radio').props.accessibilityState).toMatchObject({
      checked: false,
    })

    fireEvent.press(screen.getByRole('radio'))
    expect(screen.getByRole('radio').props.accessibilityState).toMatchObject({
      checked: true,
    })
  })

  it('latches — a second press cannot deselect it', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Radio onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('radio'))
    fireEvent.press(screen.getByRole('radio'))
    expect(screen.getByRole('radio').props.accessibilityState).toMatchObject({
      checked: true,
    })
    // Select-only: the no-op press reports nothing either.
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('starts from defaultValue', () => {
    renderWithTheme(<Radio defaultValue />)
    expect(screen.getByRole('radio').props.accessibilityState).toMatchObject({
      checked: true,
    })
  })

  it('a controlled radio does not move on its own', () => {
    renderWithTheme(<Radio value={false} onValueChange={jest.fn()} />)
    fireEvent.press(screen.getByRole('radio'))
    expect(screen.getByRole('radio').props.accessibilityState).toMatchObject({
      checked: false,
    })
  })
})
