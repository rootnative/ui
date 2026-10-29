import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent, userEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../button/Button'
import type { ButtonSize, ButtonVariant } from '../button/types'
import { CircularProgress } from '../progress'

describe('Button', () => {
  it('renders the label text', () => {
    renderWithTheme(<Button>Press me</Button>)
    expect(screen.getByText('Press me')).toBeTruthy()
  })

  it('has the button accessibility role', () => {
    renderWithTheme(<Button>Action</Button>)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(<Button onPress={onPress}>Tap</Button>)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <Button onPress={onPress} disabled>
        Tap
      </Button>,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders a leading icon', () => {
    renderWithTheme(<Button leadingIcon="check">OK</Button>)
    expect(
      screen.getByText('check', { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  it('renders a trailing icon', () => {
    renderWithTheme(<Button trailingIcon="arrow-right">Next</Button>)
    expect(
      screen.getByText('arrow-right', { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as leadingIcon', () => {
      renderWithTheme(
        <Button leadingIcon={<Text testID="custom-icon">★</Text>}>Star</Button>,
      )
      expect(
        screen.getByTestId('custom-icon', { includeHiddenElements: true }),
      ).toBeTruthy()
    })

    it('invokes a render-function leadingIcon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(
        <Button leadingIcon={renderFn} iconSize={20} contentColor="#123456">
          Fn
        </Button>,
      )
      expect(renderFn).toHaveBeenCalledWith({ size: 20, color: '#123456' })
      expect(
        screen.getByTestId('fn-icon', { includeHiddenElements: true }).props
          .children,
      ).toBe('20:#123456')
    })

    it('routes string icon names through the iconResolver when provided', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID="resolved">{`resolved:${name}`}</Text>
      ))
      renderWithTheme(<Button leadingIcon="check">OK</Button>, {
        iconResolver,
      })
      expect(iconResolver).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ size: 20 }),
      )
      expect(
        screen.getByTestId('resolved', { includeHiddenElements: true }).props
          .children,
      ).toBe('resolved:check')
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the container background', () => {
      renderWithTheme(<Button containerColor="#FF0000">Custom</Button>)
      const button = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(button.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the label text', () => {
      renderWithTheme(<Button contentColor="#00FF00">Custom</Button>)
      const label = screen.getByText('Custom')
      const flatStyle = StyleSheet.flatten(label.props.style)
      expect(flatStyle.color).toBe('#00FF00')
    })

    it('applies labelStyle to the label text', () => {
      renderWithTheme(
        <Button labelStyle={{ fontWeight: '900' }}>Styled</Button>,
      )
      const label = screen.getByText('Styled')
      const flatStyle = StyleSheet.flatten(label.props.style)
      expect(flatStyle.fontWeight).toBe('900')
    })

    it('contentColor does not get overridden by labelStyle without color', () => {
      renderWithTheme(
        <Button contentColor="#00FF00" labelStyle={{ fontSize: 20 }}>
          Both
        </Button>,
      )
      const label = screen.getByText('Both')
      const flatStyle = StyleSheet.flatten(label.props.style)
      expect(flatStyle.color).toBe('#00FF00')
      expect(flatStyle.fontSize).toBe(20)
    })
  })

  describe('size', () => {
    const heights: Record<string, number> = {
      extraSmall: 32,
      small: 40,
      medium: 56,
      large: 96,
      extraLarge: 136,
    }

    it.each(Object.entries(heights))(
      'size %s sets container minHeight %d',
      (size, height) => {
        renderWithTheme(<Button size={size as ButtonSize}>Sized</Button>)
        const flatStyle = StyleSheet.flatten(
          screen.getByRole('button').props.style,
        )
        expect(flatStyle.minHeight).toBe(height)
      },
    )

    it('defaults to size s (40dp) when no size is given', () => {
      renderWithTheme(<Button>Default</Button>)
      const flatStyle = StyleSheet.flatten(
        screen.getByRole('button').props.style,
      )
      expect(flatStyle.minHeight).toBe(40)
    })

    it('derives icon size from the button size', () => {
      const renderFn = jest.fn(() => <Text testID="i">x</Text>)
      renderWithTheme(
        <Button size="large" leadingIcon={renderFn}>
          Big
        </Button>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ size: 32 }),
      )
    })

    it('explicit iconSize overrides the size default', () => {
      const renderFn = jest.fn(() => <Text testID="i">x</Text>)
      renderWithTheme(
        <Button size="large" iconSize={10} leadingIcon={renderFn}>
          Big
        </Button>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ size: 10 }),
      )
    })

    it('uses the size-specific label typography role', () => {
      renderWithTheme(<Button size="extraLarge">Huge</Button>)
      const flatStyle = StyleSheet.flatten(screen.getByText('Huge').props.style)
      // headlineLarge = 32sp
      expect(flatStyle.fontSize).toBe(32)
    })
  })

  describe('shape', () => {
    it('round (default) rests as a pill (radius = height / 2)', () => {
      renderWithTheme(<Button size="small">Round</Button>)
      const flatStyle = StyleSheet.flatten(
        screen.getByRole('button').props.style,
      )
      expect(flatStyle.borderRadius).toBe(20)
    })

    it('square rests at the size corner (s = 12dp)', () => {
      renderWithTheme(
        <Button size="small" shape="square">
          Square
        </Button>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByRole('button').props.style,
      )
      expect(flatStyle.borderRadius).toBe(12)
    })

    it('square medium rests at 16dp', () => {
      renderWithTheme(
        <Button size="medium" shape="square">
          Square
        </Button>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByRole('button').props.style,
      )
      expect(flatStyle.borderRadius).toBe(16)
    })
  })

  describe('outline width by size', () => {
    it('outlined l uses a 2dp border, xl 3dp', () => {
      renderWithTheme(
        <Button variant="outlined" size="large">
          L
        </Button>,
      )
      const l = StyleSheet.flatten(screen.getByRole('button').props.style)
      expect(l.borderWidth).toBe(2)
    })

    // The border sits inside the box on top of the padding, so padding plus
    // border is the inset of the label. `text` has its own padding by spec.
    const contained: ButtonVariant[] = ['filled', 'tonal', 'elevated']
    const sizes: ButtonSize[] = [
      'extraSmall',
      'small',
      'medium',
      'large',
      'extraLarge',
    ]

    const cases = sizes.flatMap((size) => [
      [size, false] as const,
      [size, true] as const,
    ])

    it.each(cases)(
      'outlined %s (icons: %s) has the inset of the other variants',
      (size, withIcons) => {
        const icons = withIcons
          ? { leadingIcon: 'check', trailingIcon: 'arrow-right' }
          : {}
        renderWithTheme(
          <>
            {[...contained, 'outlined' as const].map((variant) => (
              <Button
                key={variant}
                testID={variant}
                variant={variant}
                size={size}
                {...icons}
              >
                Label
              </Button>
            ))}
          </>,
        )
        const inset = (variant: ButtonVariant) => {
          const s = StyleSheet.flatten(screen.getByTestId(variant).props.style)
          const border = Number(s.borderWidth ?? 0)
          return {
            vertical: Number(s.paddingVertical) + border,
            start: Number(s.paddingStart) + border,
            end: Number(s.paddingEnd) + border,
          }
        }
        const outlined = StyleSheet.flatten(
          screen.getByTestId('outlined').props.style,
        )
        expect(outlined.borderWidth).toBeGreaterThan(0)
        for (const variant of contained) {
          expect(inset('outlined')).toEqual(inset(variant))
        }
      },
    )
  })

  describe('loading', () => {
    function spinner() {
      return screen.UNSAFE_getByType(CircularProgress)
    }

    it('shows a spinner in place of the leading icon', () => {
      const renderFn = jest.fn(() => <Text testID="icon">x</Text>)
      renderWithTheme(
        <Button loading leadingIcon={renderFn}>
          Save
        </Button>,
      )
      expect(spinner()).toBeTruthy()
      expect(renderFn).not.toHaveBeenCalled()
    })

    it('draws the spinner at the icon size, in the label color, with no track', () => {
      renderWithTheme(
        <Button loading size="large">
          Save
        </Button>,
      )
      expect(spinner().props).toMatchObject({
        size: 32,
        thickness: 3.2,
        containerColor: 'transparent',
        contentColor: lightTheme.colors.onPrimary,
      })
    })

    it('hides the spinner from assistive technology', () => {
      renderWithTheme(<Button loading>Save</Button>)
      expect(screen.queryByRole('progressbar')).toBeNull()
    })

    // `fireEvent` walks up to the `onPress` prop of the `Button` element
    // itself, which the pressable never receives. `userEvent` drives the
    // responder events of the host view, as a real touch does.
    it('ignores onPress and onLongPress', async () => {
      const onPress = jest.fn()
      const onLongPress = jest.fn()
      renderWithTheme(
        <Button loading onPress={onPress} onLongPress={onLongPress}>
          Save
        </Button>,
      )
      const user = userEvent.setup()
      await user.press(screen.getByRole('button'))
      await user.longPress(screen.getByRole('button'))
      expect(onPress).not.toHaveBeenCalled()
      expect(onLongPress).not.toHaveBeenCalled()
    })

    it('reports busy, and stays enabled so it keeps focus', () => {
      renderWithTheme(<Button loading>Save</Button>)
      expect(screen.getByRole('button', { busy: true })).toBeTruthy()
      expect(screen.getByRole('button', { disabled: false })).toBeTruthy()
    })

    it('keeps the enabled colors', () => {
      renderWithTheme(<Button loading>Save</Button>)
      expect(
        StyleSheet.flatten(screen.getByText('Save').props.style).color,
      ).toBe(lightTheme.colors.onPrimary)
    })

    it('takes the leading-icon padding when it has no leading icon', () => {
      renderWithTheme(
        <>
          <Button loading testID="loading">
            Save
          </Button>
          <Button leadingIcon="check" testID="icon">
            Save
          </Button>
        </>,
      )
      const padding = (testID: string) =>
        StyleSheet.flatten(screen.getByTestId(testID).props.style).paddingStart
      expect(padding('loading')).toBe(padding('icon'))
    })

    it('calls onPress again when loading ends', async () => {
      const onPress = jest.fn()
      const { rerender } = renderWithTheme(
        <Button loading onPress={onPress}>
          Save
        </Button>,
      )
      rerender(<Button onPress={onPress}>Save</Button>)
      await userEvent.setup().press(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('consumer props survive the spread', () => {
    it('runs a consumer onPressIn and onHoverIn beside the state layer', () => {
      const onPressIn = jest.fn()
      const onHoverIn = jest.fn()
      renderWithTheme(
        <Button onPressIn={onPressIn} onHoverIn={onHoverIn}>
          Save
        </Button>,
      )
      const button = screen.getByRole('button')
      fireEvent(button, 'pressIn')
      fireEvent(button, 'hoverIn')
      expect(onPressIn).toHaveBeenCalledTimes(1)
      expect(onHoverIn).toHaveBeenCalledTimes(1)
    })

    it('lets a consumer hitSlop win over the default', () => {
      renderWithTheme(<Button hitSlop={20}>Save</Button>)
      expect(screen.getByRole('button').props.hitSlop).toBe(20)
    })
  })
})
