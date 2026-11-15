import { useIconResolver } from '@rootnative/core'
import { useInterpolatedStyle } from '@rootnative/inertia'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import { Pressable, Text, View } from 'react-native'
import { Badge } from '../badge'
import { webOutlineReset } from '../internal/focusOutline'
import { pointerEvents } from '../internal/pointerEvents'
import { pressOnSpace } from '../internal/pressableKeyDown'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import { useStateLayer } from '../internal/useStateLayer'
import {
  NAV_INDICATOR_LABEL_GAP,
  NAV_INDICATOR_WIDTH,
  NAV_ITEM_ICON_SIZE,
  createNavigationItemStyles,
} from './styles'
import type { NavigationBarColors, NavigationItemPlacement } from './styles'
import type { NavigationBarItem, NavigationBarLabelVisibility } from './types'

interface NavigationItemProps {
  item: NavigationBarItem
  selected: boolean
  labelVisibility: NavigationBarLabelVisibility
  colors: NavigationBarColors
  labelStyle?: StyleProp<TextStyle>
  onPress: (value: string) => void
  testID?: string
  /**
   * `'bar'` sizes the destination to share a row; `'rail'` sizes it as an
   * 80dp-wide block in a column.
   * @default 'bar'
   */
  placement?: NavigationItemPlacement
}

/**
 * One destination: an indicator pill behind a 24dp icon, with the label
 * below. Shared by `NavigationBar` and `NavigationRail`, which differ only in
 * how the destination is sized (`placement`).
 */
export function NavigationItem({
  item,
  selected,
  labelVisibility,
  colors,
  labelStyle,
  onPress,
  testID,
  placement = 'bar',
}: NavigationItemProps) {
  const theme = useMaterialTheme()
  const resolver = useIconResolver()
  const disabled = Boolean(item.disabled)

  const styles = useMemo(
    () =>
      createNavigationItemStyles(
        theme,
        selected,
        colors,
        placement,
        labelVisibility !== 'never',
      ),
    [theme, selected, colors, placement, labelVisibility],
  )

  // Two springs, as in Compose's NavigationBar: an effects spring fades the
  // indicator and the 'selected' label, and a fast spatial spring sizes the
  // indicator and shifts the content.
  const alphaProgress = useBooleanProgress(selected, 'spring-default-effects')
  const sizeProgress = useBooleanProgress(selected, 'spring-fast-spatial')

  const contentColor = selected ? colors.selectedIcon : colors.content
  const {
    style: stateLayerStyle,
    handlers,
    focusRingStyle: animatedFocusRingStyle,
  } = useStateLayer({
    rest: 'transparent',
    content: contentColor,
    disabled,
  })

  // The pill grows its width from 0 around its center, per the MD3 indicator
  // motion. `width`, not `scaleX`, so the ends stay round. The size spring
  // may overshoot past full width, but never below 0, as in Compose.
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    'worklet'
    const width = NAV_INDICATOR_WIDTH * Math.max(0, sizeProgress.value)
    return {
      width,
      left: (NAV_INDICATOR_WIDTH - width) / 2,
      opacity: alphaProgress.value,
    }
  })

  // In 'selected' mode an inactive destination has no visible label, so its
  // icon block sits centred as if unlabeled: the whole column shifts down by
  // half the label block while the label fades. Both collapse to a snap under
  // reduced motion because the driving progress does. Hand-rolled for the
  // one-sided clamp: the shift overshoots past rest but not past centred.
  const labelBlockShift =
    (NAV_INDICATOR_LABEL_GAP +
      (theme.typography.labelMedium.lineHeight ?? 16)) /
    2
  const animatedShiftStyle = useAnimatedStyle(() => {
    'worklet'
    return {
      transform: [
        {
          translateY: labelBlockShift * (1 - Math.max(0, sizeProgress.value)),
        },
      ],
    }
  })
  const animatedLabelStyle = useInterpolatedStyle(alphaProgress, {
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
      webOutlineReset,
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

  const handlePress = () => onPress(item.value)

  return (
    <Pressable
      role="tab"
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={handlePress}
      onKeyDown={pressOnSpace(handlePress, disabled)}
      testID={testID}
      {...handlers}
      style={containerStyle}
    >
      <Animated.View style={contentStyle}>
        <View style={styles.pill}>
          <Animated.View
            testID={testID === undefined ? undefined : `${testID}-indicator`}
            style={[
              styles.indicator,
              animatedIndicatorStyle,
              pointerEvents.none,
            ]}
          />
          <Animated.View
            style={[styles.stateLayer, stateLayerStyle, pointerEvents.none]}
          />
          <Animated.View
            style={[
              styles.focusRing,
              animatedFocusRingStyle,
              pointerEvents.none,
            ]}
          />
          {icon ? (
            <View aria-hidden>
              {item.badge === undefined || item.badge === false ? (
                icon
              ) : (
                <Badge
                  label={item.badge === true ? undefined : item.badge}
                  testID={testID === undefined ? undefined : `${testID}-badge`}
                >
                  {icon}
                </Badge>
              )}
            </View>
          ) : null}
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
