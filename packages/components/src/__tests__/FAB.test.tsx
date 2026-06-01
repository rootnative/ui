import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { FAB } from '../fab/FAB'

describe('FAB', () => {
  it('renders with the button accessibility role', () => {
    renderWithTheme(<FAB icon="plus" accessibilityLabel="Add" />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('uses the label as the accessible name in extended mode', () => {
    renderWithTheme(<FAB icon="plus" label="Compose" />)
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('Compose')
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <FAB icon="plus" accessibilityLabel="Add" onPress={onPress} />,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <FAB icon="plus" accessibilityLabel="Add" onPress={onPress} disabled />,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders the label text in extended mode', () => {
    renderWithTheme(<FAB icon="plus" label="Compose" />)
    expect(screen.getByText('Compose')).toBeTruthy()
  })

  describe('overrides', () => {
    it('applies containerColor to the container background', () => {
      renderWithTheme(
        <FAB icon="plus" accessibilityLabel="Add" containerColor="#FF0000" />,
      )
      const button = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(button.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the icon', () => {
      renderWithTheme(
        <FAB icon="plus" accessibilityLabel="Add" contentColor="#00FF00" />,
      )
      const icon = screen.getByText('plus')
      expect(icon.props.color).toBe('#00FF00')
    })

    it('applies the style prop to the container', () => {
      renderWithTheme(
        <FAB icon="plus" accessibilityLabel="Add" style={{ margin: 10 }} />,
      )
      const button = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(button.props.style)
      expect(flatStyle.margin).toBe(10)
    })
  })

  describe('touch target', () => {
    it('applies a 4dp hitSlop on small FABs to meet the 48dp minimum', () => {
      renderWithTheme(<FAB icon="plus" size="small" accessibilityLabel="Add" />)
      expect(screen.getByRole('button').props.hitSlop).toBe(4)
    })

    it('does not apply a hitSlop on medium or large FABs', () => {
      renderWithTheme(
        <FAB icon="plus" size="medium" accessibilityLabel="Add" />,
      )
      expect(screen.getByRole('button').props.hitSlop).toBeUndefined()
    })

    it('lets the consumer override the default hitSlop', () => {
      renderWithTheme(
        <FAB icon="plus" size="small" accessibilityLabel="Add" hitSlop={12} />,
      )
      expect(screen.getByRole('button').props.hitSlop).toBe(12)
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as icon', () => {
      renderWithTheme(
        <FAB
          icon={<Text testID="custom-icon">★</Text>}
          accessibilityLabel="Star"
        />,
      )
      expect(screen.getByTestId('custom-icon')).toBeTruthy()
    })

    it('routes string icon names through the iconResolver when provided', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID="resolved">{`resolved:${name}`}</Text>
      ))
      renderWithTheme(<FAB icon="plus" accessibilityLabel="Add" />, {
        iconResolver,
      })
      expect(iconResolver).toHaveBeenCalledWith(
        'plus',
        expect.objectContaining({ size: 24 }),
      )
      expect(screen.getByTestId('resolved').props.children).toBe(
        'resolved:plus',
      )
    })

    it('uses 36px icon size for the large size', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(
        <FAB
          icon={renderFn}
          accessibilityLabel="Add"
          size="large"
          contentColor="#123456"
        />,
      )
      expect(renderFn).toHaveBeenCalledWith({ size: 36, color: '#123456' })
    })
  })
})
