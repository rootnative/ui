import { useIconResolver, useTheme } from '@rootnative/core'
import {
  useAnimation,
  useColorCascade,
  useGesture,
  useTransform,
} from '@rootnative/inertia'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native'
import { createStyles, labelPositions } from './styles'
import type { TextFieldProps } from './types'

const ICON_SIZE = 24
// 12dp icon inset + 24dp icon + 16dp gap
const ICON_WITH_GAP = 12 + 24 + 16

export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  variant = 'filled',
  supportingText,
  errorText,
  error = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  trailingIconAccessibilityLabel,
  showCharacterCounter,
  multiline = false,
  onFocus,
  onBlur,
  style,
  containerColor,
  contentColor,
  inputStyle,
  maxLength,
  cursorColor,
  selectionColor,
  ...textInputProps
}: TextFieldProps) {
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const isDisabled = Boolean(disabled)
  const isError = Boolean(error) || Boolean(errorText)
  const isFilled = variant === 'filled'
  const hasLeadingIcon = Boolean(leadingIcon)

  const { colors, styles } = useMemo(
    () => createStyles(theme, variant),
    [theme, variant],
  )

  const [isFocused, setIsFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(
    () => value ?? textInputProps.defaultValue ?? '',
  )
  const inputRef = useRef<TextInput>(null)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const hasValue = currentValue !== ''
  const isLabelFloated = isFocused || hasValue

  // Label/focus/error ride 'state-focus' (M3 short4, 200 ms, standard
  // curve); hover rides 'state-hover' (short3, 150 ms). The 200 ms choice is
  // deliberate: 150 ms left only ~9 frames at 60 fps and one dropped frame
  // on iOS was enough to read as choppy — 200 ms (~12 frames) gives the
  // curve room to breathe.
  //
  // `focused` raises for ANY focus modality (tapping into a text field must
  // show the focus indicator — no focus-visible gating here). The gesture
  // handlers are split across two hosts: hover goes to the outer Pressable,
  // focus/blur are invoked from the TextInput's own events below.
  const { focused, hovered, handlers } = useGesture({
    hovered: 'state-hover',
    focused: 'state-focus',
    focusVisible: 'state-focus',
    pressed: 'state-press',
  } as const)
  const errored = useAnimation(isError ? 1 : 0, 'state-focus')
  // Mirror of hasValue on the UI thread so labelProgress can be derived
  // entirely without waiting on a JS-thread effect to fire.
  const hasValueProgress = useAnimation(hasValue ? 1 : 0, 'state-focus')
  // 0 = resting (label large, centered), 1 = floated (label small, top).
  // Derived on the UI thread so it starts moving the same frame `focused`
  // does — no one-frame skew between the color/border and position animations.
  // The 'worklet' directive is load-bearing (and inertia's documented
  // contract): without it the transformer's closure hides
  // `focused`/`hasValueProgress` from Reanimated's dependency tracking and
  // the float only refreshes on re-render.
  const labelProgress = useTransform(() => {
    'worklet'
    return Math.max(focused.value, hasValueProgress.value)
  })

  // Label is rendered at bodySmall and scaled up to bodyLarge when at rest.
  const restingScale =
    theme.typography.bodyLarge.fontSize / theme.typography.bodySmall.fontSize

  const restingTop = isFilled
    ? labelPositions.filledRestingTop
    : labelPositions.outlinedRestingTop
  const floatedTop = isFilled
    ? labelPositions.filledFloatedTop
    : labelPositions.outlinedFloatedTop
  // Static top is the floated position; translateY shifts it down to resting.
  const restingOffset = restingTop - floatedTop

  const labelRestColor = colors.labelColor
  const labelFocusColor = colors.focusedLabelColor
  const labelErrorColor = colors.errorLabelColor
  const borderRestColor = colors.borderColor
  const borderFocusColor = colors.focusedBorderColor
  const borderErrorColor = colors.errorBorderColor
  const borderHoverColor = colors.hoveredBorderColor
  const hoverOpacity = theme.stateLayer.hoveredOpacity

  // Transform on the wrapper View — keeps the layer transform off of Text
  // composition so iOS doesn't have to re-rasterise glyphs while scaling.
  const animatedLabelTransformStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          labelProgress.value,
          [0, 1],
          [restingOffset, 0],
        ),
      },
      { scale: interpolate(labelProgress.value, [0, 1], [restingScale, 1]) },
    ],
  }))

  // Color on the inner Animated.Text. Priority cascade rest → error → focus
  // (later layers win at equal progress) — focus wins when both are active,
  // matching the prior style-array precedence.
  const animatedLabelColorStyle = useColorCascade(
    labelRestColor,
    [
      { progress: errored, color: labelErrorColor },
      { progress: focused, color: labelFocusColor },
    ],
    { key: 'color' },
  )

  // Filled active indicator: 1 dp resting → 2 dp focus or error, color
  // crossfade. Colour is a rest → error → focus cascade; the 1 → 2 dp height
  // is a plain numeric interpolate kept in its own worklet (a mixed
  // numeric+colour cascade doesn't collapse into `useColorCascade`).
  const animatedIndicatorColorStyle = useColorCascade(borderRestColor, [
    { progress: errored, color: borderErrorColor },
    { progress: focused, color: borderFocusColor },
  ])
  const animatedIndicatorHeightStyle = useAnimatedStyle(() => {
    const focusedHeight = interpolate(focused.value, [0, 1], [1, 2])
    return { height: interpolate(errored.value, [0, 1], [focusedHeight, 2]) }
  })

  // Outlined border drawn as an absolute overlay so its width can animate
  // 1 → 2 dp without ever moving the container's padding box. The label and
  // input keep their static positions; nothing snaps on focus/blur.
  // Colour is a rest → hover → error → focus cascade (later states win); the
  // 1 → 2 dp width is a plain numeric interpolate in its own worklet.
  // MD3 hover keeps the 1 dp width — only focus/error thicken to 2 dp.
  const animatedBorderColorStyle = useColorCascade(
    borderRestColor,
    [
      { progress: hovered, color: borderHoverColor },
      { progress: errored, color: borderErrorColor },
      { progress: focused, color: borderFocusColor },
    ],
    { key: 'borderColor' },
  )
  const animatedBorderWidthStyle = useAnimatedStyle(() => {
    const focusedWidth = interpolate(focused.value, [0, 1], [1, 2])
    return {
      borderWidth: interpolate(errored.value, [0, 1], [focusedWidth, 2]),
    }
  })

  const animatedHoverLayerStyle = useAnimatedStyle(() => ({
    opacity: hovered.value * hoverOpacity,
  }))

  // Label start: 16dp container padding + leading icon space (12dp inset + 24dp + 16dp gap)
  const labelStart =
    theme.spacing.md + (hasLeadingIcon ? ICON_WITH_GAP - theme.spacing.md : 0)
  const labelStaticTop = floatedTop

  const handleChangeText = useCallback(
    (text: string) => {
      if (!isControlled) setInternalValue(text)
      onChangeText?.(text)
    },
    [isControlled, onChangeText],
  )

  const handleFocus = useCallback(
    (event: NativeSyntheticEvent<TargetedEvent>) => {
      if (isDisabled) return
      setIsFocused(true)
      handlers.onFocus()
      onFocus?.(event)
    },
    [isDisabled, onFocus, handlers],
  )

  const handleBlur = useCallback(
    (event: NativeSyntheticEvent<TargetedEvent>) => {
      setIsFocused(false)
      handlers.onBlur()
      onBlur?.(event)
    },
    [onBlur, handlers],
  )

  // Filled: drives the on-surface 8% hover state layer.
  // Outlined: drives the outline's rest → on-surface hover color shift.
  const handleHoverIn = useCallback(() => {
    if (!isDisabled) handlers.onHoverIn()
  }, [isDisabled, handlers])

  const handleContainerPress = useCallback(() => {
    if (!isDisabled) inputRef.current?.focus()
  }, [isDisabled])

  // MD3 error state only recolors the TRAILING icon — the leading icon stays
  // onSurfaceVariant.
  const leadingIconColor = isDisabled
    ? colors.disabledIconColor
    : (contentColor ?? colors.iconColor)
  const trailingIconColor = isDisabled
    ? colors.disabledIconColor
    : isError
      ? colors.errorIconColor
      : (contentColor ?? colors.iconColor)

  // MD3 caret/selection defaults to primary (error when in error state);
  // explicit consumer values passed via TextInput props win.
  const defaultCaretColor = isError ? theme.colors.error : theme.colors.primary
  const resolvedCursorColor = cursorColor ?? defaultCaretColor
  const resolvedSelectionColor = selectionColor ?? defaultCaretColor

  const containerColorOverride = useMemo(
    () =>
      containerColor && !isDisabled
        ? { backgroundColor: containerColor }
        : undefined,
    [containerColor, isDisabled],
  )

  const containerStyleArr = useMemo(
    () => [
      styles.container,
      isDisabled ? styles.containerDisabled : undefined,
      containerColorOverride,
    ],
    [styles, isDisabled, containerColorOverride],
  )

  const borderLayerDisabledOverride = useMemo(
    () =>
      !isFilled && isDisabled
        ? { borderColor: colors.disabledBorderColor, borderWidth: 1 }
        : undefined,
    [isFilled, isDisabled, colors.disabledBorderColor],
  )

  const borderLayerStyleArr = useMemo(
    () => [
      styles.borderLayer,
      animatedBorderColorStyle,
      animatedBorderWidthStyle,
      borderLayerDisabledOverride,
    ],
    [
      styles,
      animatedBorderColorStyle,
      animatedBorderWidthStyle,
      borderLayerDisabledOverride,
    ],
  )

  const indicatorStyleArr = useMemo(
    () => [
      styles.indicator,
      animatedIndicatorColorStyle,
      animatedIndicatorHeightStyle,
      isDisabled ? styles.indicatorDisabled : undefined,
    ],
    [
      styles,
      animatedIndicatorColorStyle,
      animatedIndicatorHeightStyle,
      isDisabled,
    ],
  )

  const hoverLayerStyleArr = useMemo(
    () => [styles.hoverLayer, animatedHoverLayerStyle],
    [styles.hoverLayer, animatedHoverLayerStyle],
  )

  const labelStaticPos = useMemo(
    () => ({
      top: labelStaticTop,
      start: labelStart,
    }),
    [labelStaticTop, labelStart],
  )

  const labelDisabledColor = useMemo(
    () => (isDisabled ? { color: colors.disabledLabelColor } : undefined),
    [isDisabled, colors.disabledLabelColor],
  )

  const labelWrapperStyleArr = useMemo(
    () => [
      styles.labelWrapper,
      labelStaticPos,
      variant === 'outlined' && isLabelFloated
        ? styles.labelWrapperNotch
        : undefined,
      animatedLabelTransformStyle,
    ],
    [
      styles,
      labelStaticPos,
      variant,
      isLabelFloated,
      animatedLabelTransformStyle,
    ],
  )

  const labelTextStyleArr = useMemo(
    () => [styles.labelText, animatedLabelColorStyle, labelDisabledColor],
    [styles, animatedLabelColorStyle, labelDisabledColor],
  )

  const inputWrapperStyleArr = useMemo(
    () => [
      styles.inputWrapper,
      label ? styles.inputWrapperWithLabel : undefined,
    ],
    [styles, label],
  )

  const inputContentColor = useMemo(
    () => (contentColor && !isDisabled ? { color: contentColor } : undefined),
    [contentColor, isDisabled],
  )

  const inputStyleArr = useMemo(
    () => [
      styles.input,
      isDisabled ? styles.inputDisabled : undefined,
      inputContentColor,
      inputStyle,
    ],
    [styles, isDisabled, inputContentColor, inputStyle],
  )

  const supportingTextStyleArr = useMemo(
    () => [
      styles.supportingText,
      isError ? styles.errorSupportingText : undefined,
      isDisabled ? styles.disabledSupportingText : undefined,
    ],
    [styles, isError, isDisabled],
  )

  const characterCounterStyleArr = useMemo(
    () => [
      styles.characterCounter,
      isError ? styles.errorSupportingText : undefined,
      isDisabled ? styles.disabledSupportingText : undefined,
    ],
    [styles, isError, isDisabled],
  )

  const rootStyle = useMemo(() => [styles.root, style], [styles, style])

  const displaySupportingText = isError ? errorText : supportingText
  // Counter needs a maxLength to be meaningful; defaults to shown when one
  // is set, hidden entirely otherwise.
  const showCounter = maxLength !== undefined && (showCharacterCounter ?? true)

  return (
    <View style={rootStyle}>
      <Pressable
        onPress={handleContainerPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handlers.onHoverOut}
        disabled={isDisabled}
        accessible={false}
        focusable={false}
        style={styles.pressableReset}
      >
        <Animated.View style={containerStyleArr}>
          {isFilled ? (
            <Animated.View pointerEvents="none" style={hoverLayerStyleArr} />
          ) : null}

          {leadingIcon ? (
            <View style={styles.leadingIcon}>
              {renderIcon(
                leadingIcon,
                { size: ICON_SIZE, color: leadingIconColor },
                iconResolver,
              )}
            </View>
          ) : null}

          <View style={inputWrapperStyleArr}>
            <TextInput
              ref={inputRef}
              {...textInputProps}
              value={value}
              onChangeText={handleChangeText}
              maxLength={maxLength}
              cursorColor={resolvedCursorColor}
              selectionColor={resolvedSelectionColor}
              editable={!isDisabled}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={
                !isDisabled && (isLabelFloated || !label)
                  ? placeholder
                  : undefined
              }
              placeholderTextColor={colors.placeholderColor}
              multiline={multiline}
              style={inputStyleArr}
              accessibilityLabel={label || undefined}
              accessibilityState={{ disabled: isDisabled }}
              accessibilityHint={isError && errorText ? errorText : undefined}
            />
          </View>

          {trailingIcon ? (
            <Pressable
              onPress={onTrailingIconPress}
              disabled={isDisabled || !onTrailingIconPress}
              accessibilityRole="button"
              accessibilityLabel={trailingIconAccessibilityLabel}
              hitSlop={12}
              style={styles.trailingIconPressable}
            >
              <View style={styles.trailingIcon}>
                {renderIcon(
                  trailingIcon,
                  { size: ICON_SIZE, color: trailingIconColor },
                  iconResolver,
                )}
              </View>
            </Pressable>
          ) : null}

          {!isFilled ? (
            <Animated.View pointerEvents="none" style={borderLayerStyleArr} />
          ) : null}

          {label ? (
            <Animated.View pointerEvents="none" style={labelWrapperStyleArr}>
              <Animated.Text numberOfLines={1} style={labelTextStyleArr}>
                {label}
              </Animated.Text>
            </Animated.View>
          ) : null}

          {isFilled ? <Animated.View style={indicatorStyleArr} /> : null}
        </Animated.View>
      </Pressable>

      {displaySupportingText || showCounter ? (
        <View style={styles.supportingTextRow}>
          <Text style={supportingTextStyleArr}>
            {displaySupportingText ?? ''}
          </Text>
          {showCounter ? (
            <Text style={characterCounterStyleArr}>
              {`${currentValue.length}/${maxLength}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
