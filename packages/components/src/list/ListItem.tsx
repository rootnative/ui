import { useTheme } from '@rootnative/core'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { useMemo } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useStateLayer } from '../internal/useStateLayer'
import { createListItemStyles } from './styles'
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

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // Layers always derive from onSurface — contentColor only recolors the
  // headline, never the state layers.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: 'transparent',
    content: theme.colors.onSurface,
    containerColor,
    disabled: isDisabled,
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

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
      {...handlers}
      style={[
        styles.container,
        styles.interactiveContainer,
        // The gesture-layer style owns backgroundColor (rest included) and
        // must come after the static container background so Reanimated's
        // prop diff sees it.
        stateLayerStyle,
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
