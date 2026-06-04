import { useIconResolver, useTheme } from '@rootnative/core'
import { renderIcon } from '@rootnative/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { createStyles, labelPositions } from './styles'
import type { TextFieldProps } from './types'

const ICON_SIZE = 24
// 12dp icon inset + 24dp icon + 16dp gap
const ICON_WITH_GAP = 12 + 24 + 16

// M3 standard easing — `cubic-bezier(0.2, 0, 0, 1)`. Decelerates into the
// resting position and reads as polished even if iOS drops a frame mid-anim.
const M3_STANDARD = Easing.bezier(0.2, 0, 0, 1)

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

  // M3 short4 (200 ms) for label/focus/error. 150 ms left only ~9 frames at
  // 60 fps; one dropped frame on iOS was enough to read as choppy. 200 ms
  // (~12 frames) gives the curve room to breathe. Hover uses short3 (150 ms).
  const { labelTiming, focusTiming, hoverTiming, errorTiming } = useMemo(() => {
    const standard = {
      duration: theme.motion.durationShort4,
      easing: M3_STANDARD,
    }
    return {
      labelTiming: standard,
      focusTiming: standard,
      errorTiming: standard,
      hoverTiming: {
        duration: theme.motion.durationShort3,
        easing: M3_STANDARD,
      },
    }
  }, [theme])

  const [isFocused, setIsFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(
    () => value ?? textInputProps.defaultValue ?? '',
  )
  const inputRef = useRef<TextInput>(null)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const hasValue = currentValue !== ''
  const isLabelFloated = isFocused || hasValue

  const focused = useSharedValue(0)
  const hovered = useSharedValue(0)
  const errored = useSharedValue(isError ? 1 : 0)
  // Mirror of hasValue on the UI thread so labelProgress can be derived
  // entirely without waiting on a JS-thread effect to fire.
  const hasValueShared = useSharedValue(hasValue ? 1 : 0)
  // 0 = resting (label large, centered), 1 = floated (label small, top).
  // Derived on the UI thread so it starts moving the same frame `focused`
  // does — no one-frame skew between the color/border and position animations.
  const labelProgress = useDerivedValue(() =>
    Math.max(focused.value, hasValueShared.value),
  )

  useEffect(() => {
    hasValueShared.value = withTiming(hasValue ? 1 : 0, labelTiming)
  }, [hasValue, hasValueShared, labelTiming])

  useEffect(() => {
    errored.value = withTiming(isError ? 1 : 0, errorTiming)
  }, [isError, errored, errorTiming])

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

  // Color on the inner Animated.Text. Layered crossfade: rest → error → focus.
  // Focus wins when both are active, matching the prior style-array precedence.
  const animatedLabelColorStyle = useAnimatedStyle(() => {
    const erroredColor = interpolateColor(
      errored.value,
      [0, 1],
      [labelRestColor, labelErrorColor],
    )
    const finalColor = interpolateColor(
      focused.value,
      [0, 1],
      [erroredColor, labelFocusColor],
    )
    return { color: finalColor }
  })

  // Filled active indicator: 1 dp resting → 2 dp focus or error, color crossfade.
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const erroredBg = interpolateColor(
      errored.value,
      [0, 1],
      [borderRestColor, borderErrorColor],
    )
    const finalBg = interpolateColor(
      focused.value,
      [0, 1],
      [erroredBg, borderFocusColor],
    )
    const focusedHeight = interpolate(focused.value, [0, 1], [1, 2])
    const finalHeight = interpolate(errored.value, [0, 1], [focusedHeight, 2])
    return {
      backgroundColor: finalBg,
      height: finalHeight,
    }
  })

  // Outlined border drawn as an absolute overlay so its width can animate
  // 1 → 2 dp without ever moving the container's padding box. The label and
  // input keep their static positions; nothing snaps on focus/blur.
  // Layered crossfade: rest → hover → error → focus (later states win).
  // MD3 hover keeps the 1 dp width — only focus/error thicken to 2 dp.
  const animatedBorderLayerStyle = useAnimatedStyle(() => {
    const hoveredBorder = interpolateColor(
      hovered.value,
      [0, 1],
      [borderRestColor, borderHoverColor],
    )
    const erroredBorder = interpolateColor(
      errored.value,
      [0, 1],
      [hoveredBorder, borderErrorColor],
    )
    const finalBorder = interpolateColor(
      focused.value,
      [0, 1],
      [erroredBorder, borderFocusColor],
    )
    const focusedWidth = interpolate(focused.value, [0, 1], [1, 2])
    const finalWidth = interpolate(errored.value, [0, 1], [focusedWidth, 2])
    return { borderWidth: finalWidth, borderColor: finalBorder }
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
      focused.value = withTiming(1, focusTiming)
      onFocus?.(event)
    },
    [isDisabled, onFocus, focused, focusTiming],
  )

  const handleBlur = useCallback(
    (event: NativeSyntheticEvent<TargetedEvent>) => {
      setIsFocused(false)
      focused.value = withTiming(0, focusTiming)
      onBlur?.(event)
    },
    [onBlur, focused, focusTiming],
  )

  // Filled: drives the on-surface 8% hover state layer.
  // Outlined: drives the outline's rest → on-surface hover color shift.
  const handleHoverIn = useCallback(() => {
    if (!isDisabled) {
      hovered.value = withTiming(1, hoverTiming)
    }
  }, [isDisabled, hovered, hoverTiming])

  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, hoverTiming)
  }, [hovered, hoverTiming])

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
      animatedBorderLayerStyle,
      borderLayerDisabledOverride,
    ],
    [styles, animatedBorderLayerStyle, borderLayerDisabledOverride],
  )

  const indicatorStyleArr = useMemo(
    () => [
      styles.indicator,
      animatedIndicatorStyle,
      isDisabled ? styles.indicatorDisabled : undefined,
    ],
    [styles, animatedIndicatorStyle, isDisabled],
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
        onHoverOut={handleHoverOut}
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
