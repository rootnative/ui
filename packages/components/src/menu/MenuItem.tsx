import { useIconResolver, useTheme } from '@rootnative/core'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useStateLayer } from '../internal/useStateLayer'
import { useMenuContext } from './context'
import { MENU_ITEM_ICON_SIZE, createMenuItemStyles } from './styles'
import type { MenuItemProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function MenuItem({
  label,
  leadingIcon,
  trailingIcon,
  trailingText,
  onPress,
  closeOnPress = true,
  disabled = false,
  containerColor,
  contentColor,
  labelStyle,
  style,
  testID,
}: MenuItemProps) {
  const { dismiss } = useMenuContext('Menu.Item')
  const theme = useTheme()
  const resolver = useIconResolver()
  const styles = useMemo(
    () => createMenuItemStyles(theme, contentColor),
    [theme, contentColor],
  )

  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: 'transparent',
    content: contentColor ?? theme.colors.onSurface,
    containerColor,
    disabled,
  })

  // Interop escape hatch: the focus ring rides the same keyboard-focus progress
  // the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  // Icon color derives from the item's content color, not from `labelStyle` —
  // `labelStyle` is text-only per the override contract.
  const iconColor = contentColor ?? theme.colors.onSurfaceVariant
  const iconProps = useMemo(
    () => ({ size: MENU_ITEM_ICON_SIZE, color: iconColor }),
    [iconColor],
  )

  const leading = renderIcon(leadingIcon, iconProps, resolver)
  const trailing = renderIcon(trailingIcon, iconProps, resolver)

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
      testID={testID}
      role="menuitem"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        onPress?.()
        if (closeOnPress) dismiss()
      }}
      {...handlers}
      style={[
        styles.container,
        disabled ? styles.disabledContainer : styles.interactiveContainer,
        // The gesture-layer style owns backgroundColor (rest included), so it
        // has to come after the static container style for Reanimated's prop
        // diff to see it.
        stateLayerStyle,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <View style={contentStyle}>
        {leading}
        <Text style={resolvedLabelStyle} numberOfLines={1}>
          {label}
        </Text>
        {trailingText !== undefined ? (
          <Text style={styles.trailingText} numberOfLines={1}>
            {trailingText}
          </Text>
        ) : null}
        {trailing}
      </View>
    </AnimatedPressable>
  )
}
