import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import type { ViewStyle } from 'react-native'
import { Avatar } from '../avatar/Avatar'

type TestInstance = ReturnType<typeof screen.getByRole>

describe('Avatar', () => {
  describe('content', () => {
    it('renders a default icon when no props are provided', () => {
      renderWithTheme(<Avatar accessibilityLabel="User" />)
      expect(screen.getByLabelText('User')).toBeTruthy()
    })

    it('renders initials from label (max 2 chars, uppercase)', () => {
      renderWithTheme(<Avatar label="john" />)
      expect(screen.getByText('JO')).toBeTruthy()
    })

    it('renders only 2 characters from a longer label', () => {
      renderWithTheme(<Avatar label="Alexander" />)
      expect(screen.getByText('AL')).toBeTruthy()
    })

    it('renders icon when icon prop is provided alongside label', () => {
      // icon takes priority over label
      renderWithTheme(<Avatar icon="account" label="JD" testID="avatar" />)
      // label text should not be rendered
      expect(screen.queryByText('JD')).toBeNull()
    })
  })

  describe('interactivity', () => {
    it('renders as non-interactive when no onPress is provided', () => {
      renderWithTheme(<Avatar label="AB" />)
      expect(screen.queryByRole('button')).toBeNull()
    })

    it('renders as a button when onPress is provided', () => {
      renderWithTheme(
        <Avatar
          label="AB"
          onPress={() => {}}
          accessibilityLabel="Open profile"
        />,
      )
      expect(screen.getByRole('button')).toBeTruthy()
    })

    it('calls onPress when pressed', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <Avatar
          label="AB"
          onPress={onPress}
          accessibilityLabel="Open profile"
        />,
      )
      fireEvent.press(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('sets accessibilityLabel on the interactive container', () => {
      renderWithTheme(
        <Avatar
          label="AB"
          onPress={() => {}}
          accessibilityLabel="Open profile"
        />,
      )
      expect(screen.getByLabelText('Open profile')).toBeTruthy()
    })
  })

  describe('disabled', () => {
    it('does not call onPress when disabled', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <Avatar
          label="AB"
          onPress={onPress}
          disabled
          accessibilityLabel="Open profile"
        />,
      )
      fireEvent.press(screen.getByRole('button'))
      expect(onPress).not.toHaveBeenCalled()
    })

    it('sets disabled accessibility state when disabled', () => {
      renderWithTheme(
        <Avatar
          label="AB"
          onPress={() => {}}
          disabled
          accessibilityLabel="Open profile"
        />,
      )
      const button = screen.getByRole('button')
      expect(button.props.accessibilityState).toEqual({ disabled: true })
    })

    it('renders content at 38% opacity when disabled', () => {
      renderWithTheme(
        <Avatar
          label="AB"
          onPress={() => {}}
          disabled
          accessibilityLabel="Open profile"
        />,
      )
      const button = screen.getByRole('button')
      const dimmed = button.findAll(
        (node: TestInstance) =>
          node.type === 'View' &&
          (StyleSheet.flatten(node.props.style) as ViewStyle)?.opacity ===
            lightTheme.stateLayer.disabledOpacity,
      )
      expect(dimmed.length).toBeGreaterThan(0)
    })
  })

  describe('focus ring', () => {
    const isFocusRing = (node: TestInstance) => {
      if (node.type !== 'View') return false
      const flat = StyleSheet.flatten(node.props.style) as ViewStyle
      return (
        flat?.borderWidth === 3 &&
        flat?.borderColor === lightTheme.colors.secondary
      )
    }

    it('renders a keyboard focus ring (hidden at rest) on pressable avatars', () => {
      renderWithTheme(
        <Avatar label="AB" onPress={() => {}} accessibilityLabel="Avatar" />,
      )
      const button = screen.getByRole('button')
      const rings = button.findAll(isFocusRing)
      expect(rings.length).toBe(1)
      const flat = StyleSheet.flatten(rings[0].props.style)
      // Hidden until keyboard focus.
      expect(flat.opacity).toBe(0)
    })

    it('does not render a focus ring on non-interactive avatars', () => {
      renderWithTheme(<Avatar testID="avatar" label="AB" />)
      const avatar = screen.getByTestId('avatar')
      expect(avatar.findAll(isFocusRing).length).toBe(0)
    })
  })

  describe('sizes', () => {
    it.each([
      ['xSmall', 24],
      ['small', 32],
      ['medium', 40],
      ['large', 56],
      ['xLarge', 112],
    ] as const)('size "%s" renders with %dpx dimensions', (size, px) => {
      renderWithTheme(<Avatar testID="avatar" size={size} />)
      const avatar = screen.getByTestId('avatar')
      const flatStyle = StyleSheet.flatten(avatar.props.style)
      expect(flatStyle.width).toBe(px)
      expect(flatStyle.height).toBe(px)
    })

    it('defaults to medium (40px)', () => {
      renderWithTheme(<Avatar testID="avatar" />)
      const avatar = screen.getByTestId('avatar')
      const flatStyle = StyleSheet.flatten(avatar.props.style)
      expect(flatStyle.width).toBe(40)
      expect(flatStyle.height).toBe(40)
    })
  })

  describe('accessibility role', () => {
    it('non-interactive avatar with accessibilityLabel has the image role', () => {
      renderWithTheme(<Avatar label="AB" accessibilityLabel="User avatar" />)
      expect(screen.getByRole('image')).toBeTruthy()
    })

    it('non-interactive avatar without accessibilityLabel has no role', () => {
      renderWithTheme(<Avatar testID="avatar" label="AB" />)
      const avatar = screen.getByTestId('avatar')
      expect(avatar.props.accessibilityRole).toBeUndefined()
    })
  })

  describe('initials typography', () => {
    it.each([
      ['xSmall', 'labelSmall'],
      ['small', 'labelMedium'],
      ['medium', 'titleMedium'],
      ['large', 'headlineSmall'],
      ['xLarge', 'displaySmall'],
    ] as const)('size "%s" uses the %s type role', (size, role) => {
      renderWithTheme(<Avatar label="AB" size={size} />)
      const initials = screen.getByText('AB')
      const flatStyle = StyleSheet.flatten(initials.props.style)
      const token = lightTheme.typography[role]
      expect(flatStyle.fontFamily).toBe(token.fontFamily)
      expect(flatStyle.fontSize).toBe(token.fontSize)
      expect(flatStyle.fontWeight).toBe(token.fontWeight)
      expect(flatStyle.lineHeight).toBe(token.lineHeight)
    })
  })

  describe('overrides', () => {
    it('applies containerColor as background', () => {
      renderWithTheme(
        <Avatar testID="avatar" label="AB" containerColor="#FF0000" />,
      )
      const avatar = screen.getByTestId('avatar')
      const flatStyle = StyleSheet.flatten(avatar.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies containerColor on interactive avatar', () => {
      renderWithTheme(
        <Avatar
          label="AB"
          containerColor="#FF0000"
          onPress={() => {}}
          accessibilityLabel="Avatar"
        />,
      )
      const avatar = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(avatar.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('is always circular (cornerFull border radius)', () => {
      renderWithTheme(<Avatar testID="avatar" />)
      const avatar = screen.getByTestId('avatar')
      const flatStyle = StyleSheet.flatten(avatar.props.style)
      expect(flatStyle.borderRadius).toBe(999)
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as icon', () => {
      renderWithTheme(<Avatar icon={<Text testID="custom-icon">★</Text>} />)
      expect(screen.getByTestId('custom-icon')).toBeTruthy()
    })

    it('invokes a render-function icon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(<Avatar icon={renderFn} contentColor="#123456" />)
      expect(renderFn).toHaveBeenCalledWith({ size: 24, color: '#123456' })
    })

    it('routes the default account icon through iconResolver when no icon is set', () => {
      const iconResolver = jest.fn(() => <Text testID="resolved">r</Text>)
      renderWithTheme(<Avatar />, { iconResolver })
      expect(iconResolver).toHaveBeenCalledWith(
        'account',
        expect.objectContaining({ size: 24 }),
      )
    })

    it('routes string icon names through iconResolver', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID={`resolved-${name}`}>r</Text>
      ))
      renderWithTheme(<Avatar icon="star" />, { iconResolver })
      expect(iconResolver).toHaveBeenCalledWith(
        'star',
        expect.objectContaining({ size: 24 }),
      )
    })
  })
})
