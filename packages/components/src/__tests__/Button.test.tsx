import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../button/Button'

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
    expect(screen.getByText('check')).toBeTruthy()
  })

  it('renders a trailing icon', () => {
    renderWithTheme(<Button trailingIcon="arrow-right">Next</Button>)
    expect(screen.getByText('arrow-right')).toBeTruthy()
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as leadingIcon', () => {
      renderWithTheme(
        <Button leadingIcon={<Text testID="custom-icon">★</Text>}>Star</Button>,
      )
      expect(screen.getByTestId('custom-icon')).toBeTruthy()
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
      expect(screen.getByTestId('fn-icon').props.children).toBe('20:#123456')
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
        expect.objectContaining({ size: 18 }),
      )
      expect(screen.getByTestId('resolved').props.children).toBe(
        'resolved:check',
      )
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
})
