import { useIconResolver, useTheme } from '@rootnative/core'
import { useInterpolatedStyle } from '@rootnative/inertia'
import { Animated } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import type { LayoutChangeEvent, StyleProp, TextStyle } from 'react-native'
import { Pressable, Text, View } from 'react-native'
import { useStateLayer } from '../internal/useStateLayer'
import { TAB_ICON_SIZE, createTabStyles } from './styles'
import type { TabColors } from './styles'
import type { TabItem, TabsVariant } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** What the row needs from each tab to place the indicator. */
export interface TabMeasurement {
  /** Offset from the row's physical left edge. */
  x: number
  /** Full tab width — what a secondary indicator spans. */
  width: number
  /** Icon + label width — what a primary indicator matches. */
  contentWidth: number
}

interface TabProps {
  item: TabItem
  variant: TabsVariant
  colors: TabColors
  selected: boolean
  scrollable: boolean
  labelStyle?: StyleProp<TextStyle>
  onPress: (value: string) => void
  onMeasure: (value: string, patch: Partial<TabMeasurement>) => void
}

export function Tab({
  item,
  variant,
  colors,
  selected,
  scrollable,
  labelStyle,
  onPress,
  onMeasure,
}: TabProps) {
  const theme = useTheme()
  const resolver = useIconResolver()
  const disabled = Boolean(item.disabled)
  const hasIcon = item.icon !== undefined
  const hasLabel = item.label !== undefined

  const styles = useMemo(
    () =>
      createTabStyles(
        theme,
        variant,
        selected,
        colors,
        hasIcon,
        hasLabel,
        scrollable,
      ),
    [theme, variant, selected, colors, hasIcon, hasLabel, scrollable],
  )

  const contentColor = selected ? colors.selectedContent : colors.content
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: 'transparent',
    content: contentColor,
    disabled,
  })

  const animatedFocusRingStyle = useInterpolatedStyle(states.focusVisible, {
    opacity: [0, 1],
  })

  const iconProps = useMemo(
    () => ({ size: TAB_ICON_SIZE, color: contentColor }),
    [contentColor],
  )
  const icon = renderIcon(item.icon, iconProps, resolver)

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout
      onMeasure(item.value, { x, width })
    },
    [item.value, onMeasure],
  )

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onMeasure(item.value, { contentWidth: event.nativeEvent.layout.width })
    },
    [item.value, onMeasure],
  )

  const contentStyle = useMemo(
    () => [styles.content, disabled ? styles.disabledContent : undefined],
    [styles, disabled],
  )
  const resolvedLabelStyle = useMemo(
    () => [styles.label, labelStyle],
    [styles.label, labelStyle],
  )

  return (
    <AnimatedPressable
      role="tab"
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => onPress(item.value)}
      onLayout={handleLayout}
      {...handlers}
      style={[
        styles.container,
        disabled ? styles.disabledContainer : styles.interactiveContainer,
        // The gesture-layer style owns backgroundColor (rest included), so it
        // has to come after the static container style for Reanimated's prop
        // diff to see it.
        stateLayerStyle,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <View style={contentStyle} onLayout={handleContentLayout}>
        {icon}
        {item.label !== undefined ? (
          <Text style={resolvedLabelStyle} numberOfLines={1}>
            {item.label}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  )
}
