import { useIconResolver, useTheme } from '@rootnative/core'
import { useInterpolatedStyle } from '@rootnative/inertia'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import { Pressable, Text, View } from 'react-native'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { useStateLayer } from '../internal/useStateLayer'
import {
  NAV_INDICATOR_LABEL_GAP,
  NAV_ITEM_ICON_SIZE,
  createNavigationItemStyles,
} from './styles'
import type { NavigationBarColors } from './styles'
import type { NavigationBarItem, NavigationBarLabelVisibility } from './types'

interface NavigationItemProps {
  item: NavigationBarItem
  selected: boolean
  labelVisibility: NavigationBarLabelVisibility
  colors: NavigationBarColors
  labelStyle?: StyleProp<TextStyle>
  onPress: (value: string) => void
  testID?: string
}

/**
 * One destination: an indicator pill behind a 24dp icon, with the label
 * below. Factored out of `NavigationBar` so NavigationRail and
 * NavigationDrawer can reuse the item anatomy in 1.x.
 */
export function NavigationItem({
  item,
  selected,
  labelVisibility,
  colors,
  labelStyle,
  onPress,
  testID,
}: NavigationItemProps) {
  const theme = useTheme()
  const resolver = useIconResolver()
  const disabled = Boolean(item.disabled)

  const styles = useMemo(
    () => createNavigationItemStyles(theme, selected, colors),
    [theme, selected, colors],
  )

  // One progress drives the indicator, and — in 'selected' label mode — the
  // label fade and the content shift, so everything below stays in the
  // `useInterpolatedStyle` family instead of hand-rolled worklets.
  const progress = useBooleanProgress(selected, 'spring-default-spatial')

  const contentColor = selected ? colors.selectedIcon : colors.content
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: 'transparent',
    content: contentColor,
    disabled,
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  // The pill fades in while expanding from its centre, per the MD3 indicator
  // motion. Extrapolation clamps, so a spatial spring's overshoot never
  // pushes opacity past 1.
  const animatedIndicatorStyle = useInterpolatedStyle(progress, {
    opacity: [0, 1],
    scaleX: [0.4, 1],
  })

  // In 'selected' mode an inactive destination has no visible label, so its
  // icon block sits centred as if unlabeled: the whole column shifts down by
  // half the label block while the label rides the same progress to
  // transparent. Both collapse to a snap under reduced motion because the
  // driving progress does.
  const labelBlockShift =
    (NAV_INDICATOR_LABEL_GAP +
      (theme.typography.labelMedium.lineHeight ?? 16)) /
    2
  const animatedShiftStyle = useInterpolatedStyle(progress, {
    translateY: [labelBlockShift, 0],
  })
  const animatedLabelStyle = useInterpolatedStyle(progress, {
    opacity: [0, 1],
  })

  const iconProps = useMemo(
    () => ({ size: NAV_ITEM_ICON_SIZE, color: contentColor }),
    [contentColor],
  )
  const icon = renderIcon(
    selected && item.selectedIcon !== undefined ? item.selectedIcon : item.icon,
    iconProps,
    resolver,
  )

  const containerStyle = useMemo(
    () => [
      styles.container,
      disabled ? styles.disabledContainer : styles.interactiveContainer,
    ],
    [styles, disabled],
  )
  const contentStyle = useMemo(
    () => [
      styles.content,
      disabled ? styles.disabledContent : undefined,
      labelVisibility === 'selected' ? animatedShiftStyle : undefined,
    ],
    [styles, disabled, labelVisibility, animatedShiftStyle],
  )
  const resolvedLabelStyle = useMemo(
    () => [styles.label, labelStyle],
    [styles.label, labelStyle],
  )
  const fadingLabelStyle = useMemo(
    () => [styles.label, labelStyle, animatedLabelStyle],
    [styles.label, labelStyle, animatedLabelStyle],
  )

  return (
    <Pressable
      role="tab"
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => onPress(item.value)}
      testID={testID}
      {...handlers}
      style={containerStyle}
    >
      <Animated.View style={contentStyle}>
        <View style={styles.pill}>
          <Animated.View
            pointerEvents="none"
            testID={testID === undefined ? undefined : `${testID}-indicator`}
            style={[styles.indicator, animatedIndicatorStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.stateLayer, stateLayerStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.focusRing, animatedFocusRingStyle]}
          />
          {icon}
        </View>
        {labelVisibility === 'always' ? (
          <Text style={resolvedLabelStyle} numberOfLines={1}>
            {item.label}
          </Text>
        ) : null}
        {labelVisibility === 'selected' ? (
          <Animated.Text style={fadingLabelStyle} numberOfLines={1}>
            {item.label}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  )
}
