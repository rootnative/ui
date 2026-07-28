import { useEffect } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { styles } from './styles'
import type { KeyboardAvoidingWrapperProps } from './types'

const isIOS = Platform.OS === 'ios'

export function KeyboardAvoidingWrapper({
  children,
  behavior = 'padding',
  keyboardVerticalOffset = 0,
  enabled = true,
  scrollViewProps,
  onKeyboardShow,
  onKeyboardHide,
  style,
  contentContainerStyle,
  ...rest
}: KeyboardAvoidingWrapperProps) {
  useEffect(() => {
    const subscriptions: ReturnType<typeof Keyboard.addListener>[] = []

    if (onKeyboardShow) {
      const showEvent = isIOS ? 'keyboardWillShow' : 'keyboardDidShow'
      subscriptions.push(Keyboard.addListener(showEvent, onKeyboardShow))
    }

    if (onKeyboardHide) {
      const hideEvent = isIOS ? 'keyboardWillHide' : 'keyboardDidHide'
      subscriptions.push(Keyboard.addListener(hideEvent, onKeyboardHide))
    }

    return () => {
      subscriptions.forEach((sub) => sub.remove())
    }
  }, [onKeyboardShow, onKeyboardHide])

  return (
    <KeyboardAvoidingView
      {...rest}
      style={[styles.root, style]}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={!isIOS && enabled}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets={isIOS && enabled}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
        contentContainerStyle={[styles.container, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
