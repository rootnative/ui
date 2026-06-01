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

const HOVER_TIMING = { duration: 150 }
const PRESS_TIMING = { duration: 100 }
const FOCUS_TIMING = { duration: 200 }

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
    if (!isDisabled) hovered.value = withTiming(1, HOVER_TIMING)
  }, [isDisabled, hovered])

  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, HOVER_TIMING)
  }, [hovered])

  const handlePressIn = useCallback(() => {
    if (!isDisabled) pressed.value = withTiming(1, PRESS_TIMING)
  }, [isDisabled, pressed])

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, PRESS_TIMING)
  }, [pressed])

  // Match :focus-visible — only show focus state from keyboard navigation.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, FOCUS_TIMING)
    }
  }, [isDisabled, focused])

  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, FOCUS_TIMING)
  }, [focused])

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
      {...props}
      role="button"
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
