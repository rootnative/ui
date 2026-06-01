import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Card } from '../card/Card'

describe('Card', () => {
  it('renders children content', () => {
    renderWithTheme(
      <Card>
        <Text>Card content</Text>
      </Card>,
    )
    expect(screen.getByText('Card content')).toBeTruthy()
  })

  it('renders as non-interactive when no onPress provided', () => {
    renderWithTheme(
      <Card>
        <Text>Static card</Text>
      </Card>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders as interactive when onPress is provided', () => {
    renderWithTheme(
      <Card onPress={() => {}}>
        <Text>Clickable card</Text>
      </Card>,
    )
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <Card onPress={onPress}>
        <Text>Tap me</Text>
      </Card>,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <Card onPress={onPress} disabled>
        <Text>Disabled card</Text>
      </Card>,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('sets disabled accessibility state when disabled', () => {
    renderWithTheme(
      <Card onPress={() => {}} disabled>
        <Text>Disabled</Text>
      </Card>,
    )
    const button = screen.getByRole('button')
    expect(button.props.accessibilityState).toEqual({ disabled: true })
  })

  describe('overrides', () => {
    it('applies containerColor to a non-interactive card', () => {
      renderWithTheme(
        <Card testID="card" containerColor="#FF0000">
          <Text>Red card</Text>
        </Card>,
      )
      const card = screen.getByTestId('card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies containerColor to an interactive card', () => {
      renderWithTheme(
        <Card onPress={() => {}} containerColor="#FF0000">
          <Text>Red card</Text>
        </Card>,
      )
      const card = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })
  })
})
