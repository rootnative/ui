import { useTheme } from '@rootnative/core'
import { isFocusVisible } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { createListItemStyles, getResolvedListItemColors } from './styles'
import type { ListItemLines, ListItemProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function getLines(
  supportingText?: string,
  overlineText?: string,
  supportingTextNumberOfLines?: number,
): ListItemLines {
  if (
    (supportingText && overlineText) ||
    (supportingText &&
      supportingTextNumberOfLines &&
      supportingTextNumberOfLines > 1)
  ) {
    return 3
  }
  if (supportingText || overlineText) return 2
  return 1
}

export function ListItem({
  headlineText,
  supportingText,
  overlineText,
  trailingSupportingText,
  leadingContent,
  trailingContent,
  onPress,
  disabled = false,
  containerColor,
  contentColor,
  supportingTextNumberOfLines = 1,
  style,
  ...props
}: ListItemProps) {
  const isDisabled = Boolean(disabled)
  const isInteractive = onPress !== undefined
  const theme = useTheme()
  const lines = getLines(
    supportingText,
    overlineText,
    supportingTextNumberOfLines,
  )
  const styles = useMemo(
    () => createListItemStyles(theme, lines, containerColor, contentColor),
    [theme, lines, containerColor, contentColor],
  )

  const colors = useMemo(
    () => getResolvedListItemColors(theme, containerColor),
    [theme, containerColor],
  )

  const timings = useMemo(
    () => ({
      hover: { duration: theme.motion.durationShort3 },
      press: { duration: theme.motion.durationShort2 },
      focus: { duration: theme.motion.durationShort4 },
    }),
    [theme.motion],
  )

  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)
  const pressed = useSharedValue(0)

  // Layered crossfade: rest → focus → hover → press (priority: press > hover > focus > rest).
  const animatedContainerStyle = useAnimatedStyle(() => {
    const focusedBg = interpolateColor(
      focused.value,
      [0, 1],
      [colors.backgroundColor, colors.focusedBackgroundColor],
    )
    const hoveredBg = interpolateColor(
      hovered.value,
      [0, 1],
      [focusedBg, colors.hoveredBackgroundColor],
    )
    const pressedBg = interpolateColor(
      pressed.value,
      [0, 1],
      [hoveredBg, colors.pressedBackgroundColor],
    )
    return { backgroundColor: pressedBg }
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: focused.value,
  }))

  const handleHoverIn = useCallback(() => {
    if (!isDisabled) hovered.value = withTiming(1, timings.hover)
  }, [isDisabled, hovered, timings])

  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, timings.hover)
  }, [hovered, timings])

  const handlePressIn = useCallback(() => {
    if (!isDisabled) pressed.value = withTiming(1, timings.press)
  }, [isDisabled, pressed, timings])

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, timings.press)
  }, [pressed, timings])

  // Match :focus-visible — only show focus state from keyboard navigation.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, timings.focus)
    }
  }, [isDisabled, focused, timings])

  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, timings.focus)
  }, [focused, timings])

  const content = (
    <>
      {leadingContent != null && (
        <View style={styles.leadingContent}>{leadingContent}</View>
      )}
      <View style={styles.textBlock}>
        {overlineText != null && (
          <Text style={styles.overlineText} numberOfLines={1}>
            {overlineText}
          </Text>
        )}
        <Text style={styles.headlineText} numberOfLines={1}>
          {headlineText}
        </Text>
        {supportingText != null && (
          <Text
            style={styles.supportingText}
            numberOfLines={supportingTextNumberOfLines}
          >
            {supportingText}
          </Text>
        )}
      </View>
      {(trailingContent != null || trailingSupportingText != null) && (
        <View style={styles.trailingBlock}>
          {trailingSupportingText != null && (
            <Text style={styles.trailingSupportingText} numberOfLines={1}>
              {trailingSupportingText}
            </Text>
          )}
          {trailingContent}
        </View>
      )}
    </>
  )

  if (!isInteractive) {
    return (
      <View {...props} style={[styles.container, style]}>
        {content}
      </View>
    )
  }

  return (
    <AnimatedPressable
      // Default role — placed before the props spread so consumer-provided
      // `accessibilityRole` / `role` props win (e.g. "link", "menuitem").
      accessibilityRole="button"
      {...props}
      accessibilityState={{ disabled: isDisabled }}
      hitSlop={Platform.OS === 'web' ? undefined : 4}
      disabled={isDisabled}
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[
        styles.container,
        styles.interactiveContainer,
        animatedContainerStyle,
        isDisabled ? styles.disabledContainer : undefined,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      {isDisabled ? (
        <View style={styles.disabledContentWrapper}>{content}</View>
      ) : (
        content
      )}
    </AnimatedPressable>
  )
}
