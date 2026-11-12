import { useIconResolver, useTheme } from '@rootnative/core'
import { Animated } from '@rootnative/inertia/reanimated'
import { alphaColor, renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Platform, Text, View } from 'react-native'
import type { ViewProps } from 'react-native'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { webOutlineReset } from '../internal/focusOutline'
import { pointerEvents } from '../internal/pointerEvents'
import { useStateLayer } from '../internal/useStateLayer'
import { useMenuContext } from './context'
import { MENU_ITEM_ICON_SIZE, createMenuItemStyles } from './styles'
import type { MenuItemProps } from './types'

type CheckKind = 'radio' | 'checkbox'
type Role = NonNullable<ViewProps['role']>

// React Native's role type has no `menuitemradio` or `menuitemcheckbox`, and
// Android drops a role it doesn't know, which would lose "menu item". So
// native keeps `menuitem`, where `aria-checked` alone reads the state.
// react-native-web writes the role string to the DOM as it is.
function itemRole(kind: CheckKind | undefined): Role {
  if (kind === undefined || Platform.OS !== 'web') return 'menuitem'
  const webRole: string = `menuitem${kind}`
  return webRole as Role
}

export function MenuItem({
  label,
  leadingIcon,
  trailingIcon,
  trailingText,
  onPress,
  closeOnPress = true,
  disabled = false,
  selected,
  checked,
  containerColor,
  contentColor,
  labelStyle,
  style,
  testID,
}: MenuItemProps) {
  const { dismiss } = useMenuContext('Menu.Item')
  const theme = useTheme()
  const resolver = useIconResolver()

  const checkKind: CheckKind | undefined =
    selected !== undefined
      ? 'radio'
      : checked !== undefined
        ? 'checkbox'
        : undefined
  const isChecked = (selected ?? checked) === true
  // A disabled item keeps the plain colors under the MD3 disabled treatment,
  // and shows its state through the disabled container only.
  const showsSelected = isChecked && !disabled
  const resolvedContentColor =
    contentColor ??
    (showsSelected ? theme.colors.onSecondaryContainer : undefined)

  const styles = useMemo(
    () => createMenuItemStyles(theme, resolvedContentColor),
    [theme, resolvedContentColor],
  )

  const {
    style: stateLayerStyle,
    handlers,
    focusRingStyle: animatedFocusRingStyle,
  } = useStateLayer({
    rest: showsSelected ? theme.colors.secondaryContainer : 'transparent',
    content: resolvedContentColor ?? theme.colors.onSurface,
    containerColor,
    disabled,
    disabledContainerColor: isChecked
      ? alphaColor(
          theme.colors.onSurface,
          theme.stateLayer.disabledContainerOpacity,
        )
      : undefined,
  })

  const checkedState =
    checkKind === undefined ? undefined : { 'aria-checked': isChecked }

  // Icon color derives from the item's content color, not from `labelStyle` —
  // `labelStyle` is text-only per the override contract.
  const iconColor = resolvedContentColor ?? theme.colors.onSurfaceVariant
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
  const trailingTextStyle = useMemo(
    () => [styles.trailingText, styles.trailingStart],
    [styles.trailingText, styles.trailingStart],
  )

  return (
    <AnimatedPressable
      testID={testID}
      role={itemRole(checkKind)}
      aria-disabled={disabled}
      {...checkedState}
      disabled={disabled}
      onPress={() => {
        onPress?.()
        if (closeOnPress) dismiss()
      }}
      {...handlers}
      style={[
        styles.container,
        webOutlineReset,
        disabled ? styles.disabledContainer : styles.interactiveContainer,
        // The gesture-layer style owns backgroundColor (rest included), so it
        // has to come after the static container style for Reanimated's prop
        // diff to see it.
        stateLayerStyle,
        style,
      ]}
    >
      <Animated.View
        style={[styles.focusRing, animatedFocusRingStyle, pointerEvents.none]}
      />
      <View style={contentStyle}>
        {/* The wrapper stays conditional: `contentStyle` lays its children out
            with a gap, so an always-rendered wrapper would add an empty slot
            when the item has no icon. */}
        {leading ? <View aria-hidden>{leading}</View> : null}
        <Text style={resolvedLabelStyle} numberOfLines={1}>
          {label}
        </Text>
        {trailingText !== undefined ? (
          <Text style={trailingTextStyle} numberOfLines={1}>
            {trailingText}
          </Text>
        ) : null}
        {trailing ? (
          <View
            aria-hidden
            style={
              trailingText === undefined ? styles.trailingStart : undefined
            }
          >
            {trailing}
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  )
}
