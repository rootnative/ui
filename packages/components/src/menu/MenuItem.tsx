import type { MaterialTheme } from '@rootnative/core'
import { useIconResolver, useTheme } from '@rootnative/core'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { alphaColor, renderIcon } from '@rootnative/utils'
import { useContext, useMemo } from 'react'
import { Platform, Text, View } from 'react-native'
import type { ViewProps } from 'react-native'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { webOutlineReset } from '../internal/focusOutline'
import { pointerEvents } from '../internal/pointerEvents'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { useStateLayer } from '../internal/useStateLayer'
import { MenuItemPlaceContext, useMenuContext } from './context'
import type { MenuItemPlace } from './context'
import {
  ITEM_FOCUS_RING_INSET,
  MENU_ITEM_ICON_SIZE,
  VERTICAL_MENU_ITEM_ICON_SIZE,
  createMenuItemStyles,
} from './styles'
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

interface ItemColors {
  /** Content color for the whole item, or `undefined` for the defaults. */
  content: string | undefined
  rest: string
  disabledContainer: string | undefined
}

/**
 * The baseline menu takes the `MenuTokens` selected colors, and a disabled
 * selected item keeps the plain colors on the 12% `onSurface` container. The
 * vertical menu takes `StandardMenuTokens`: a selected item stays
 * `onTertiaryContainer` on `tertiaryContainer` when disabled, both at 38%,
 * and the disabled content of any other item is `onSurface`.
 */
function resolveItemColors(
  theme: MaterialTheme,
  isVertical: boolean,
  isChecked: boolean,
  disabled: boolean,
): ItemColors {
  const { colors, stateLayer } = theme
  const showsSelected = isChecked && !disabled
  if (!isVertical) {
    return {
      content: showsSelected ? colors.onSecondaryContainer : undefined,
      rest: showsSelected ? colors.secondaryContainer : 'transparent',
      disabledContainer: isChecked
        ? alphaColor(colors.onSurface, stateLayer.disabledContainerOpacity)
        : undefined,
    }
  }
  return {
    content: isChecked
      ? colors.onTertiaryContainer
      : disabled
        ? colors.onSurface
        : undefined,
    rest: showsSelected ? colors.tertiaryContainer : 'transparent',
    disabledContainer: isChecked
      ? alphaColor(colors.tertiaryContainer, stateLayer.disabledOpacity)
      : undefined,
  }
}

/** Top and bottom corner radius of a vertical menu item at rest. */
function restCorners(theme: MaterialTheme, place: MenuItemPlace) {
  const inner = theme.shape.cornerExtraSmall
  const outer = theme.shape.cornerMedium
  if (place === 'first') return { top: outer, bottom: inner }
  if (place === 'last') return { top: inner, bottom: outer }
  return { top: inner, bottom: inner }
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
  const { dismiss, variant } = useMenuContext('Menu.Item')
  const place = useContext(MenuItemPlaceContext)
  const theme = useTheme()
  const resolver = useIconResolver()
  const isVertical = variant === 'vertical'

  const checkKind: CheckKind | undefined =
    selected !== undefined
      ? 'radio'
      : checked !== undefined
        ? 'checkbox'
        : undefined
  const isChecked = (selected ?? checked) === true
  const itemColors = resolveItemColors(theme, isVertical, isChecked, disabled)
  const resolvedContentColor = contentColor ?? itemColors.content

  const styles = useMemo(
    () => createMenuItemStyles(theme, resolvedContentColor, variant),
    [theme, resolvedContentColor, variant],
  )

  const {
    style: stateLayerStyle,
    handlers,
    focusRingStyle: animatedFocusRingStyle,
  } = useStateLayer({
    rest: itemColors.rest,
    content: resolvedContentColor ?? theme.colors.onSurface,
    containerColor,
    disabled,
    disabledContainerColor: itemColors.disabledContainer,
  })

  // A vertical item morphs to the selected shape on `fastSpatial`, as the
  // Compose `shapeByInteraction` does. The focus ring follows, 2dp inside.
  const selectedProgress = useBooleanProgress(isChecked, 'spring-fast-spatial')
  const { top, bottom } = restCorners(theme, place)
  const selectedCorner = theme.shape.cornerMedium
  const shapeStyle = useAnimatedStyle(() => {
    'worklet'
    const t = interpolate(selectedProgress.value, [0, 1], [top, selectedCorner])
    const b = interpolate(
      selectedProgress.value,
      [0, 1],
      [bottom, selectedCorner],
    )
    return {
      borderTopLeftRadius: t,
      borderTopRightRadius: t,
      borderBottomLeftRadius: b,
      borderBottomRightRadius: b,
    }
  })
  const ringShapeStyle = useAnimatedStyle(() => {
    'worklet'
    const t = interpolate(selectedProgress.value, [0, 1], [top, selectedCorner])
    const b = interpolate(
      selectedProgress.value,
      [0, 1],
      [bottom, selectedCorner],
    )
    return {
      borderTopLeftRadius: Math.max(0, t - ITEM_FOCUS_RING_INSET),
      borderTopRightRadius: Math.max(0, t - ITEM_FOCUS_RING_INSET),
      borderBottomLeftRadius: Math.max(0, b - ITEM_FOCUS_RING_INSET),
      borderBottomRightRadius: Math.max(0, b - ITEM_FOCUS_RING_INSET),
    }
  })

  const checkedState =
    checkKind === undefined ? undefined : { 'aria-checked': isChecked }

  // Icon color derives from the item's content color, not from `labelStyle` —
  // `labelStyle` is text-only per the override contract.
  const iconColor = resolvedContentColor ?? theme.colors.onSurfaceVariant
  const iconSize = isVertical
    ? VERTICAL_MENU_ITEM_ICON_SIZE
    : MENU_ITEM_ICON_SIZE
  const iconProps = useMemo(
    () => ({ size: iconSize, color: iconColor }),
    [iconSize, iconColor],
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
        isVertical ? shapeStyle : undefined,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.focusRing,
          isVertical ? ringShapeStyle : undefined,
          animatedFocusRingStyle,
          pointerEvents.none,
        ]}
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
