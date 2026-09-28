import { useIconResolver, useTheme } from '@rootnative/core'
import { useInterpolatedStyle } from '@rootnative/inertia'
import { Animated } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import type {
  NativeSyntheticEvent,
  TargetedEvent,
  TextInputProps,
} from 'react-native'
import { IconButton } from '../icon-button'
import { pointerEvents } from '../internal/pointerEvents'
import { useStateLayer } from '../internal/useStateLayer'
import { warnOnce } from '../internal/warnOnce'
import { createStyles, SEARCH_BAR_ICON_SIZE } from './styles'
import type { SearchBarProps } from './types'

type SubmitHandler = NonNullable<TextInputProps['onSubmitEditing']>

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  leadingIcon = 'magnify',
  onLeadingIconPress,
  leadingIconAccessibilityLabel,
  onSearch,
  showClearButton = true,
  clearButtonAccessibilityLabel = 'Clear search',
  onClear,
  disabled = false,
  actions,
  trailing,
  containerColor,
  contentColor,
  inputStyle,
  style,
  onFocus,
  onBlur,
  onSubmitEditing,
  accessibilityLabel,
  role,
  returnKeyType,
  cursorColor,
  selectionColor,
  ref,
  ...textInputProps
}: SearchBarProps) {
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const { colors, styles } = useMemo(() => createStyles(theme), [theme])

  const [internalValue, setInternalValue] = useState(
    () => value ?? textInputProps.defaultValue ?? '',
  )
  const inputRef = useRef<TextInput>(null)
  const setInputRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const hasValue = currentValue !== ''

  // MD3 gives the bar hover and focus feedback but no press layer: a press
  // only moves focus into the input (Compose sets `enablePressIndication =
  // false`). So the press handlers are never wired.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.container,
    content: contentColor ?? colors.stateLayerContent,
    containerColor,
    disabled,
  })
  const focusRingStyle = useInterpolatedStyle(states.focusVisible, {
    opacity: [0, 1],
  })

  const handleChangeText = useCallback(
    (text: string) => {
      if (!isControlled) setInternalValue(text)
      onChangeText?.(text)
    },
    [isControlled, onChangeText],
  )

  // The input, not the wrapper, owns focus, so it feeds the state layer. The
  // layer shows its focus treatment for keyboard focus only.
  const handleFocus = useCallback(
    (event: NativeSyntheticEvent<TargetedEvent>) => {
      handlers.onFocus()
      onFocus?.(event)
    },
    [handlers, onFocus],
  )

  const handleBlur = useCallback(
    (event: NativeSyntheticEvent<TargetedEvent>) => {
      handlers.onBlur()
      onBlur?.(event)
    },
    [handlers, onBlur],
  )

  const handleSubmit = useCallback<SubmitHandler>(
    (event) => {
      onSubmitEditing?.(event)
      onSearch?.(currentValue)
    },
    [currentValue, onSearch, onSubmitEditing],
  )

  const focusInput = useCallback(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleClear = useCallback(() => {
    // An uncontrolled input holds its own text, so it must be cleared
    // directly. `clear()` fires no `onChangeText`, so the call below does.
    if (!isControlled) {
      setInternalValue('')
      inputRef.current?.clear()
    }
    onChangeText?.('')
    onClear?.()
    inputRef.current?.focus()
  }, [isControlled, onChangeText, onClear])

  const leadingIconColor = disabled
    ? colors.disabledContent
    : (contentColor ?? colors.leadingIcon)
  const trailingIconColor = disabled
    ? colors.disabledContent
    : (contentColor ?? colors.trailingIcon)
  const resolvedPlaceholderColor = disabled
    ? colors.disabledContent
    : (placeholderTextColor ?? colors.placeholder)

  const rootStyle = useMemo(() => [styles.root, style], [styles.root, style])
  const containerStyle = useMemo(
    () => [styles.container, stateLayerStyle],
    [styles.container, stateLayerStyle],
  )
  const focusRingStyleArr = useMemo(
    () => [styles.focusRing, focusRingStyle, pointerEvents.none],
    [styles.focusRing, focusRingStyle],
  )
  const inputContentColor = useMemo(
    () => (contentColor && !disabled ? { color: contentColor } : undefined),
    [contentColor, disabled],
  )
  const inputStyleArr = useMemo(
    () => [
      styles.input,
      inputContentColor,
      disabled ? styles.inputDisabled : undefined,
      inputStyle,
    ],
    [
      styles.input,
      styles.inputDisabled,
      inputContentColor,
      disabled,
      inputStyle,
    ],
  )

  if (onLeadingIconPress && !leadingIconAccessibilityLabel) {
    warnOnce(
      'search-bar-leading-button-without-label',
      '[@rootnative/components] <SearchBar> makes the leading icon a button ' +
        'when `onLeadingIconPress` is set, and a screen reader cannot name an ' +
        'icon-only button. Pass `leadingIconAccessibilityLabel`.',
    )
  }

  // Every `IconButton` sits in a `slot` frame. The button sets
  // `alignSelf: 'flex-start'`, which beats the row's `alignItems: 'center'`,
  // so without the frame it rides above the center of the bar.
  const leadingContent = onLeadingIconPress ? (
    <View style={styles.slot}>
      <IconButton
        icon={leadingIcon}
        size="s"
        variant="standard"
        iconColor={leadingIconColor}
        accessibilityLabel={leadingIconAccessibilityLabel ?? ''}
        onPress={onLeadingIconPress}
        disabled={disabled}
      />
    </View>
  ) : (
    <View aria-hidden style={styles.slot}>
      {renderIcon(
        leadingIcon,
        { size: SEARCH_BAR_ICON_SIZE, color: leadingIconColor },
        iconResolver,
      )}
    </View>
  )

  const trailingContent = trailing ? (
    <View style={styles.trailing}>{trailing}</View>
  ) : (
    actions?.map((action, index) => (
      <View key={`${action.accessibilityLabel}-${index}`} style={styles.slot}>
        <IconButton
          icon={action.icon}
          size="s"
          variant="standard"
          iconColor={trailingIconColor}
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
          disabled={disabled || action.disabled}
        />
      </View>
    ))
  )

  return (
    // `accessibilityRole`, not `role`: RN's `Role` union has no `search`
    // landmark, and react-native-web renders this one as `role="search"`.
    <View accessibilityRole="search" style={rootStyle}>
      <Pressable
        onPress={focusInput}
        onHoverIn={handlers.onHoverIn}
        onHoverOut={handlers.onHoverOut}
        disabled={disabled}
        accessible={false}
        focusable={false}
        // react-native-web makes an enabled `Pressable` a tab stop even with
        // `accessible` and `focusable` off. The wrapper only widens the press
        // target and catches hover, so it must not cost a keyboard stop.
        tabIndex={-1}
        style={styles.pressableReset}
      >
        <Animated.View style={containerStyle}>
          <Animated.View style={focusRingStyleArr} />
          {leadingContent}
          <TextInput
            ref={setInputRef}
            {...textInputProps}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor={resolvedPlaceholderColor}
            cursorColor={cursorColor ?? theme.colors.primary}
            selectionColor={selectionColor ?? theme.colors.primary}
            returnKeyType={returnKeyType ?? 'search'}
            role={role ?? 'searchbox'}
            accessibilityLabel={accessibilityLabel ?? placeholder}
            // `TextInput` does not normalize `aria-*` into
            // `accessibilityState`, so both spellings are needed: native
            // reads the object, react-native-web reads the ARIA one.
            aria-disabled={disabled}
            accessibilityState={{ disabled }}
            style={inputStyleArr}
          />
          {showClearButton && hasValue && !disabled ? (
            <View style={styles.slot}>
              <IconButton
                icon="close"
                size="s"
                variant="standard"
                iconColor={trailingIconColor}
                accessibilityLabel={clearButtonAccessibilityLabel}
                onPress={handleClear}
              />
            </View>
          ) : null}
          {trailingContent}
        </Animated.View>
      </Pressable>
    </View>
  )
}
