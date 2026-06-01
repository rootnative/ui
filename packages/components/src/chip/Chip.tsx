import { useIconResolver, useTheme } from '@rootnative/core'
import {
  alphaColor,
  isFocusVisible,
  renderIcon,
  resolveColorFromStyle,
} from '@rootnative/utils'
import type { IconSource } from '@rootnative/utils'
import { useCallback, useMemo, type ReactNode } from 'react'
import {
  Platform,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { createStyles, getResolvedChipColors } from './styles'
import type { ChipProps, ChipVariant } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const HOVER_TIMING = { duration: 150 }
const PRESS_TIMING = { duration: 100 }
const FOCUS_TIMING = { duration: 200 }

type ChipImplProps = Omit<PressableProps, 'children'> & {
  children: string
  variant?: ChipVariant
  elevated?: boolean
  selected?: boolean
  leadingIcon?: IconSource
  iconSize?: number
  avatar?: ReactNode
  onClose?: () => void
  containerColor?: string
  contentColor?: string
  labelStyle?: StyleProp<TextStyle>
}

export function Chip(props: ChipProps) {
  const {
    children,
    style,
    variant = 'assist',
    elevated = false,
    selected = false,
    leadingIcon,
    iconSize = 18,
    avatar,
    onClose,
    containerColor,
    contentColor,
    labelStyle: labelStyleOverride,
    disabled = false,
    ...rest
  } = props as ChipImplProps
  const isDisabled = Boolean(disabled)
  const isSelected = variant === 'filter' ? Boolean(selected) : false

  const showCloseIcon =
    onClose !== undefined &&
    (variant === 'input' || (variant === 'filter' && isSelected))

  const hasLeadingContent = Boolean(
    (variant === 'input' && avatar) ||
    leadingIcon ||
    (variant === 'filter' && isSelected),
  )

  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(
    () =>
      createStyles(
        theme,
        variant,
        elevated,
        isSelected,
        hasLeadingContent,
        showCloseIcon,
        containerColor,
        contentColor,
      ),
    [
      theme,
      variant,
      elevated,
      isSelected,
      hasLeadingContent,
      showCloseIcon,
      containerColor,
      contentColor,
    ],
  )

  const colors = useMemo(
    () =>
      getResolvedChipColors(
        theme,
        variant,
        elevated,
        isSelected,
        containerColor,
        contentColor,
      ),
    [theme, variant, elevated, isSelected, containerColor, contentColor],
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

  const isElevated = elevated && variant !== 'input'
  const showElevationLayers = isElevated && !isDisabled

  // Cross-fade level 1 (rest) and level 2 (hover) shadow layers per MD3.
  const animatedElevationLevel1Style = useAnimatedStyle(() => ({
    opacity: 1 - hovered.value,
  }))

  const animatedElevationLevel2Style = useAnimatedStyle(() => ({
    opacity: hovered.value,
  }))

  const closeHovered = useSharedValue(0)
  const closePressed = useSharedValue(0)

  const closeStateLayerHovered = useMemo(
    () => alphaColor(colors.textColor, theme.stateLayer.hoveredOpacity),
    [colors.textColor, theme.stateLayer.hoveredOpacity],
  )
  const closeStateLayerPressed = useMemo(
    () => alphaColor(colors.textColor, theme.stateLayer.pressedOpacity),
    [colors.textColor, theme.stateLayer.pressedOpacity],
  )

  const animatedCloseStyle = useAnimatedStyle(() => {
    const hoveredBg = interpolateColor(
      closeHovered.value,
      [0, 1],
      ['transparent', closeStateLayerHovered],
    )
    const pressedBg = interpolateColor(
      closePressed.value,
      [0, 1],
      [hoveredBg, closeStateLayerPressed],
    )
    return { backgroundColor: pressedBg }
  })

  const handleCloseHoverIn = useCallback(() => {
    if (!isDisabled) closeHovered.value = withTiming(1, HOVER_TIMING)
  }, [isDisabled, closeHovered])

  const handleCloseHoverOut = useCallback(() => {
    closeHovered.value = withTiming(0, HOVER_TIMING)
  }, [closeHovered])

  const handleClosePressIn = useCallback(() => {
    if (!isDisabled) closePressed.value = withTiming(1, PRESS_TIMING)
  }, [isDisabled, closePressed])

  const handleClosePressOut = useCallback(() => {
    closePressed.value = withTiming(0, PRESS_TIMING)
  }, [closePressed])

  const resolvedIconColor = useMemo(
    () =>
      resolveColorFromStyle(
        styles.label,
        isDisabled ? styles.disabledLabel : undefined,
      ),
    [styles.label, styles.disabledLabel, isDisabled],
  )

  const computedLabelStyle = useMemo(
    () => [
      styles.label,
      isDisabled ? styles.disabledLabel : undefined,
      labelStyleOverride,
    ],
    [isDisabled, styles.disabledLabel, styles.label, labelStyleOverride],
  )

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

  const iconRenderProps = { size: iconSize, color: resolvedIconColor }

  const renderLeadingContent = () => {
    if (variant === 'input' && avatar) {
      return <View style={styles.avatar}>{avatar}</View>
    }
    if (leadingIcon) {
      return (
        <View style={styles.leadingIcon}>
          {renderIcon(leadingIcon, iconRenderProps, iconResolver)}
        </View>
      )
    }
    if (variant === 'filter' && isSelected) {
      return (
        <View style={styles.leadingIcon}>
          {renderIcon('check', iconRenderProps, iconResolver)}
        </View>
      )
    }
    return null
  }

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      {showElevationLayers ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.elevationLayerLevel1, animatedElevationLevel1Style]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.elevationLayerLevel2, animatedElevationLevel2Style]}
          />
        </>
      ) : null}
      <AnimatedPressable
        {...rest}
        accessibilityRole="button"
        accessibilityState={{
          disabled: isDisabled,
          ...(variant === 'filter' ? { selected: isSelected } : undefined),
        }}
        // Bring the touch target to the WCAG/MD3 minimum of 48dp (chip is 32dp tall).
        hitSlop={Platform.OS === 'web' ? undefined : 8}
        disabled={isDisabled}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.container,
          animatedContainerStyle,
          isDisabled ? styles.disabledContainer : undefined,
          // Function-form `style` is intentionally dropped on animated
          // components — wrapping the whole `style` array in a function would
          // hide the animated container style from Reanimated's prop diff and
          // break the state-layer transitions. Use `containerColor` /
          // `contentColor` for state-aware styling instead.
          typeof style === 'function' ? undefined : style,
        ]}
      >
        {renderLeadingContent()}
        <Text style={computedLabelStyle}>{children}</Text>
        {showCloseIcon ? (
          <AnimatedPressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Remove"
            hitSlop={12}
            onHoverIn={handleCloseHoverIn}
            onHoverOut={handleCloseHoverOut}
            onPressIn={handleClosePressIn}
            onPressOut={handleClosePressOut}
            style={[styles.closeButton, animatedCloseStyle]}
          >
            {renderIcon('close', iconRenderProps, iconResolver)}
          </AnimatedPressable>
        ) : null}
      </AnimatedPressable>
    </View>
  )
}
