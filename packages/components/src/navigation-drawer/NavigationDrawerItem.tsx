import { useIconResolver, useTheme } from '@rootnative/core'
import { useInterpolatedStyle } from '@rootnative/inertia'
import { Animated } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { composeHandlers } from '../internal/composeHandlers'
import { pointerEvents } from '../internal/pointerEvents'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { useStateLayer } from '../internal/useStateLayer'
import { useNavigationDrawerContext } from './context'
import { DRAWER_ICON_SIZE, createNavigationDrawerItemStyles } from './styles'
import type { NavigationDrawerItemProps } from './types'

/**
 * One destination: a 56dp row with an optional 24dp leading icon, a
 * `labelLarge` label, and an optional trailing badge text, on a full-corner
 * `secondaryContainer` indicator while active.
 */
export function NavigationDrawerItem({
  value,
  label,
  icon,
  selectedIcon,
  badge,
  onPress,
  disabled = false,
  labelStyle,
  style,
  accessibilityLabel,
  testID,
  ...rest
}: NavigationDrawerItemProps) {
  const {
    selected: selectedValue,
    select,
    colors,
    labelStyle: drawerLabelStyle,
  } = useNavigationDrawerContext('NavigationDrawer.Item')
  const theme = useTheme()
  const resolver = useIconResolver()
  const selected = selectedValue === value

  const styles = useMemo(
    () => createNavigationDrawerItemStyles(theme, selected, colors),
    [theme, selected, colors],
  )

  const progress = useBooleanProgress(selected, 'spring-default-spatial')

  const contentColor = selected ? colors.selectedContent : colors.content
  const {
    style: stateLayerStyle,
    handlers,
    focusRingStyle: animatedFocusRingStyle,
  } = useStateLayer({
    rest: 'transparent',
    content: contentColor,
    disabled,
  })

  // The drawer indicator fades, with no scale: MD3 gives it no motion of its
  // own beyond the state change.
  const animatedIndicatorStyle = useInterpolatedStyle(progress, {
    opacity: [0, 1],
  })

  const iconProps = useMemo(
    () => ({ size: DRAWER_ICON_SIZE, color: contentColor }),
    [contentColor],
  )
  const iconNode = renderIcon(
    selected && selectedIcon !== undefined ? selectedIcon : icon,
    iconProps,
    resolver,
  )

  const containerStyle = useMemo(
    () => [
      styles.container,
      disabled ? styles.disabledContainer : styles.interactiveContainer,
      style,
    ],
    [styles, disabled, style],
  )
  const contentStyle = useMemo(
    () => (disabled ? styles.disabledContent : undefined),
    [styles, disabled],
  )
  const resolvedLabelStyle = useMemo(
    () => [styles.label, drawerLabelStyle, labelStyle],
    [styles.label, drawerLabelStyle, labelStyle],
  )

  return (
    <Pressable
      {...rest}
      role="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => {
        select(value)
        onPress?.()
      }}
      testID={testID}
      {...composeHandlers(handlers, rest)}
      style={containerStyle}
    >
      <Animated.View
        testID={testID === undefined ? undefined : `${testID}-indicator`}
        style={[styles.indicator, animatedIndicatorStyle, pointerEvents.none]}
      />
      <Animated.View
        style={[styles.stateLayer, stateLayerStyle, pointerEvents.none]}
      />
      <Animated.View
        style={[styles.focusRing, animatedFocusRingStyle, pointerEvents.none]}
      />
      {iconNode ? (
        <View aria-hidden style={contentStyle}>
          {iconNode}
        </View>
      ) : null}
      <Text style={[resolvedLabelStyle, contentStyle]} numberOfLines={1}>
        {label}
      </Text>
      {badge !== undefined ? (
        <Text style={[styles.badge, contentStyle]} numberOfLines={1}>
          {badge}
        </Text>
      ) : null}
    </Pressable>
  )
}
