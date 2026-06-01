import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Switch } from '../switch/Switch'

describe('Switch', () => {
  it('renders without crashing', () => {
    renderWithTheme(<Switch />)
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('has the switch accessibility role', () => {
    renderWithTheme(<Switch />)
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('reports checked=false by default', () => {
    renderWithTheme(<Switch />)
    const sw = screen.getByRole('switch')
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    )
  })

  it('reports checked=true when value is true', () => {
    renderWithTheme(<Switch value />)
    const sw = screen.getByRole('switch')
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    )
  })

  it('calls onValueChange with toggled value when pressed', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Switch value={false} onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('calls onValueChange with false when toggled off', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Switch value onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(false)
  })

  it('does not call onValueChange when disabled', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Switch onValueChange={onValueChange} disabled />)
    fireEvent.press(screen.getByRole('switch'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reports disabled state', () => {
    renderWithTheme(<Switch disabled />)
    const sw = screen.getByRole('switch')
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    )
  })

  it('renders selectedIcon when value is true', () => {
    renderWithTheme(<Switch value selectedIcon="check" />)
    expect(screen.getByText('check')).toBeTruthy()
  })

  it('does not render an icon by default (MD3 default switch)', () => {
    renderWithTheme(<Switch value />)
    expect(screen.queryByText('check')).toBeNull()
  })

  it('renders unselectedIcon when value is false', () => {
    renderWithTheme(<Switch value={false} unselectedIcon="close" />)
    expect(screen.getByText('close')).toBeTruthy()
  })

  describe('disabled visuals', () => {
    it('uses surface for the disabled selected handle', () => {
      renderWithTheme(<Switch value disabled />)
      const thumb = screen.getByTestId('switch-thumb')
      const flatStyle = StyleSheet.flatten(thumb.props.style)
      expect(flatStyle.backgroundColor).toBe(lightTheme.colors.surface)
    })

    it('keeps 38% onSurface for the disabled unselected handle', () => {
      renderWithTheme(<Switch value={false} disabled />)
      const thumb = screen.getByTestId('switch-thumb')
      const flatStyle = StyleSheet.flatten(thumb.props.style)
      expect(flatStyle.backgroundColor).toBe(
        alphaColor(lightTheme.colors.onSurface, 0.38),
      )
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the track background', () => {
      renderWithTheme(<Switch containerColor="#FF0000" />)
      const sw = screen.getByRole('switch')
      const flatStyle = StyleSheet.flatten(sw.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as selectedIcon', () => {
      renderWithTheme(
        <Switch value selectedIcon={<Text testID="custom-icon">★</Text>} />,
      )
      expect(screen.getByTestId('custom-icon')).toBeTruthy()
    })

    it('invokes a render-function selectedIcon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(<Switch value selectedIcon={renderFn} />)
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ size: 16 }),
      )
    })

    it('routes string selectedIcon names through iconResolver', () => {
      const iconResolver = jest.fn(() => <Text testID="resolved">r</Text>)
      renderWithTheme(<Switch value selectedIcon="check" />, { iconResolver })
      expect(iconResolver).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ size: 16 }),
      )
    })
  })
})
