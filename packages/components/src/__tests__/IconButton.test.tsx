import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { IconButton } from '../icon-button/IconButton'

const DISABLED_ICON_COLOR = alphaColor(
  lightTheme.colors.onSurface,
  lightTheme.stateLayer.disabledOpacity,
)

describe('IconButton', () => {
  it('renders with the button accessibility role', () => {
    renderWithTheme(<IconButton icon="heart" accessibilityLabel="Like" />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <IconButton icon="heart" accessibilityLabel="Like" onPress={onPress} />,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <IconButton
        icon="heart"
        accessibilityLabel="Like"
        onPress={onPress}
        disabled
      />,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  describe('overrides', () => {
    it('applies containerColor to the container background', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="Like"
          containerColor="#FF0000"
        />,
      )
      const button = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(button.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the icon', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="Like"
          contentColor="#00FF00"
        />,
      )
      const icon = screen.getByText('heart')
      expect(icon.props.color).toBe('#00FF00')
    })

    it('contentColor takes precedence over iconColor', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="Like"
          iconColor="#FF0000"
          contentColor="#00FF00"
        />,
      )
      const icon = screen.getByText('heart')
      expect(icon.props.color).toBe('#00FF00')
    })

    it('ignores contentColor when disabled and uses 38% onSurface', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="Like"
          contentColor="#00FF00"
          disabled
        />,
      )
      const icon = screen.getByText('heart')
      expect(icon.props.color).toBe(DISABLED_ICON_COLOR)
    })

    it('ignores iconColor when disabled and uses 38% onSurface', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="Like"
          iconColor="#FF0000"
          disabled
        />,
      )
      const icon = screen.getByText('heart')
      expect(icon.props.color).toBe(DISABLED_ICON_COLOR)
    })

    it('applies the style prop to the container', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="Like"
          style={{ margin: 10 }}
        />,
      )
      const button = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(button.props.style)
      expect(flatStyle.margin).toBe(10)
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as icon', () => {
      renderWithTheme(
        <IconButton
          icon={<Text testID="custom-icon">★</Text>}
          accessibilityLabel="Star"
        />,
      )
      expect(screen.getByTestId('custom-icon')).toBeTruthy()
    })

    it('invokes a render-function icon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(
        <IconButton
          icon={renderFn}
          accessibilityLabel="Custom"
          contentColor="#123456"
        />,
      )
      expect(renderFn).toHaveBeenCalledWith({ size: 24, color: '#123456' })
      expect(screen.getByTestId('fn-icon').props.children).toBe('24:#123456')
    })

    it('routes string icon names through the iconResolver when provided', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID="resolved">{`resolved:${name}`}</Text>
      ))
      renderWithTheme(<IconButton icon="heart" accessibilityLabel="Like" />, {
        iconResolver,
      })
      expect(iconResolver).toHaveBeenCalledWith(
        'heart',
        expect.objectContaining({ size: 24 }),
      )
      expect(screen.getByTestId('resolved').props.children).toBe(
        'resolved:heart',
      )
    })

    it('uses selectedIcon when toggled and selected', () => {
      renderWithTheme(
        <IconButton
          icon={<Text testID="off-icon">off</Text>}
          selectedIcon={<Text testID="on-icon">on</Text>}
          accessibilityLabel="Toggle"
          selected
        />,
      )
      expect(screen.getByTestId('on-icon')).toBeTruthy()
      expect(screen.queryByTestId('off-icon')).toBeNull()
    })
  })

  describe('size', () => {
    const sizes: Array<{
      size: 'xs' | 's' | 'm' | 'l' | 'xl'
      height: number
      icon: number
    }> = [
      { size: 'xs', height: 32, icon: 20 },
      { size: 's', height: 40, icon: 24 },
      { size: 'm', height: 56, icon: 24 },
      { size: 'l', height: 96, icon: 32 },
      { size: 'xl', height: 136, icon: 40 },
    ]

    it.each(sizes)(
      'size $size sets the container height and icon size',
      ({ size, height, icon }) => {
        const renderFn = jest.fn(() => <Text testID="i">x</Text>)
        renderWithTheme(
          <IconButton icon={renderFn} accessibilityLabel="X" size={size} />,
        )
        const flat = StyleSheet.flatten(screen.getByRole('button').props.style)
        expect(flat.height).toBe(height)
        expect(flat.width).toBe(height) // uniform width == height
        expect(renderFn).toHaveBeenCalledWith(
          expect.objectContaining({ size: icon }),
        )
      },
    )

    it('defaults to size s (40dp)', () => {
      renderWithTheme(<IconButton icon="heart" accessibilityLabel="X" />)
      const flat = StyleSheet.flatten(screen.getByRole('button').props.style)
      expect(flat.height).toBe(40)
    })
  })

  describe('width variant', () => {
    it('narrow / uniform / wide set distinct widths at a fixed height', () => {
      const widths: Record<'narrow' | 'uniform' | 'wide', number> = {
        narrow: 48,
        uniform: 56,
        wide: 72,
      }
      for (const [width, expected] of Object.entries(widths)) {
        const { unmount } = renderWithTheme(
          <IconButton
            icon="heart"
            accessibilityLabel="X"
            size="m"
            width={width as 'narrow' | 'uniform' | 'wide'}
          />,
        )
        const flat = StyleSheet.flatten(screen.getByRole('button').props.style)
        expect(flat.width).toBe(expected)
        expect(flat.height).toBe(56)
        unmount()
      }
    })
  })

  describe('outline width by size', () => {
    it('outlined l uses a 2dp border', () => {
      renderWithTheme(
        <IconButton
          icon="heart"
          accessibilityLabel="X"
          variant="outlined"
          size="l"
        />,
      )
      const flat = StyleSheet.flatten(screen.getByRole('button').props.style)
      expect(flat.borderWidth).toBe(2)
    })
  })
})
