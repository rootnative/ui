import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Checkbox } from '../checkbox/Checkbox'

describe('Checkbox', () => {
  it('renders without crashing', () => {
    renderWithTheme(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeTruthy()
  })

  it('has the checkbox accessibility role', () => {
    renderWithTheme(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeTruthy()
  })

  it('reports checked=false by default', () => {
    renderWithTheme(<Checkbox />)
    const cb = screen.getByRole('checkbox')
    expect(cb.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    )
  })

  it('reports checked=true when value is true', () => {
    renderWithTheme(<Checkbox value />)
    const cb = screen.getByRole('checkbox')
    expect(cb.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    )
  })

  it('calls onValueChange with toggled value when pressed', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Checkbox value={false} onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('checkbox'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('calls onValueChange with false when toggled off', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Checkbox value onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('checkbox'))
    expect(onValueChange).toHaveBeenCalledWith(false)
  })

  it('does not call onValueChange when disabled', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Checkbox onValueChange={onValueChange} disabled />)
    fireEvent.press(screen.getByRole('checkbox'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reports disabled state', () => {
    renderWithTheme(<Checkbox disabled />)
    const cb = screen.getByRole('checkbox')
    expect(cb.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    )
  })

  it('renders check icon when checked', () => {
    renderWithTheme(<Checkbox value />)
    expect(screen.getByText('check')).toBeTruthy()
  })

  it('does not render check icon when unchecked', () => {
    renderWithTheme(<Checkbox value={false} />)
    expect(screen.queryByText('check')).toBeNull()
  })

  it('uses the MD3 2dp container corner radius', () => {
    renderWithTheme(<Checkbox />)
    const box = screen.getByTestId('checkbox-box')
    const flatStyle = StyleSheet.flatten(box.props.style)
    expect(flatStyle.borderRadius).toBe(2)
  })

  describe('indeterminate', () => {
    it('reports checked="mixed" to accessibility', () => {
      renderWithTheme(<Checkbox indeterminate />)
      const cb = screen.getByRole('checkbox')
      expect(cb.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: 'mixed' }),
      )
    })

    it('renders the dash mark instead of the check icon', () => {
      renderWithTheme(<Checkbox indeterminate />)
      expect(screen.getByTestId('checkbox-indeterminate-mark')).toBeTruthy()
      expect(screen.queryByText('check')).toBeNull()
    })

    it('wins over checked visually and in accessibility', () => {
      renderWithTheme(<Checkbox value indeterminate />)
      expect(screen.getByTestId('checkbox-indeterminate-mark')).toBeTruthy()
      expect(screen.queryByText('check')).toBeNull()
      const cb = screen.getByRole('checkbox')
      expect(cb.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: 'mixed' }),
      )
    })

    it('fills the box with the selected container color', () => {
      renderWithTheme(<Checkbox indeterminate />)
      const box = screen.getByTestId('checkbox-box')
      const flatStyle = StyleSheet.flatten(box.props.style)
      expect(flatStyle.backgroundColor).toBe(lightTheme.colors.primary)
    })
  })

  describe('error', () => {
    it('uses the error color for the unchecked outline', () => {
      renderWithTheme(<Checkbox error />)
      const box = screen.getByTestId('checkbox-box')
      const flatStyle = StyleSheet.flatten(box.props.style)
      expect(flatStyle.borderColor).toBe(lightTheme.colors.error)
    })

    it('uses the error container with onError mark when checked', () => {
      const iconResolver = jest.fn(() => <Text testID="resolved">r</Text>)
      renderWithTheme(<Checkbox value error />, { iconResolver })
      const box = screen.getByTestId('checkbox-box')
      const flatStyle = StyleSheet.flatten(box.props.style)
      expect(flatStyle.backgroundColor).toBe(lightTheme.colors.error)
      expect(iconResolver).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ color: lightTheme.colors.onError }),
      )
    })

    it('disabled treatment wins over error', () => {
      renderWithTheme(<Checkbox value error disabled />)
      const box = screen.getByTestId('checkbox-box')
      const flatStyle = StyleSheet.flatten(box.props.style)
      expect(flatStyle.backgroundColor).toBe(
        alphaColor(lightTheme.colors.onSurface, 0.38),
      )
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the box when checked', () => {
      renderWithTheme(<Checkbox value containerColor="#FF0000" />)
      const box = screen.getByTestId('checkbox-box')
      const flatStyle = StyleSheet.flatten(box.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('keeps the outline-only appearance when unchecked', () => {
      renderWithTheme(<Checkbox value={false} containerColor="#FF0000" />)
      const box = screen.getByTestId('checkbox-box')
      const flatStyle = StyleSheet.flatten(box.props.style)
      expect(flatStyle.backgroundColor).toBe('transparent')
      expect(flatStyle.borderColor).toBe(lightTheme.colors.onSurfaceVariant)
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as checkIcon', () => {
      renderWithTheme(
        <Checkbox value checkIcon={<Text testID="custom-check">✓</Text>} />,
      )
      expect(screen.getByTestId('custom-check')).toBeTruthy()
      // Default 'check' string should not have rendered.
      expect(screen.queryByText('check')).toBeNull()
    })

    it('invokes a render-function checkIcon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(<Checkbox value checkIcon={renderFn} />)
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ size: 14 }),
      )
    })

    it('routes the default check icon through iconResolver', () => {
      const iconResolver = jest.fn(() => <Text testID="resolved">r</Text>)
      renderWithTheme(<Checkbox value />, { iconResolver })
      expect(iconResolver).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ size: 14 }),
      )
    })
  })
})
