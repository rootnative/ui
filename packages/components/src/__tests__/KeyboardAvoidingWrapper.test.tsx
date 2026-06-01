import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { Keyboard, Text } from 'react-native'
import { KeyboardAvoidingWrapper } from '../keyboard-avoiding-wrapper/KeyboardAvoidingWrapper'

describe('KeyboardAvoidingWrapper', () => {
  it('renders children', () => {
    renderWithTheme(
      <KeyboardAvoidingWrapper>
        <Text>Hello</Text>
      </KeyboardAvoidingWrapper>,
    )
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('registers keyboard listeners when callbacks are provided', () => {
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener')
    addListenerSpy.mockClear()

    const { unmount } = renderWithTheme(
      <KeyboardAvoidingWrapper
        onKeyboardShow={jest.fn()}
        onKeyboardHide={jest.fn()}
      >
        <Text>Content</Text>
      </KeyboardAvoidingWrapper>,
    )

    const events = addListenerSpy.mock.calls.map(([event]) => event)
    expect(
      events.includes('keyboardWillShow') || events.includes('keyboardDidShow'),
    ).toBe(true)
    expect(
      events.includes('keyboardWillHide') || events.includes('keyboardDidHide'),
    ).toBe(true)
    unmount()
    addListenerSpy.mockRestore()
  })
})
