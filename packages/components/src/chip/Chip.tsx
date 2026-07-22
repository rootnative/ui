import { useIconResolver, useTheme } from '@rootnative/core'
import { useGestureLayer } from '@rootnative/inertia/gesture-layer'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import {
  alphaColor,
  renderIcon,
  resolveColorFromStyle,
} from '@rootnative/utils'
import type { IconSource } from '@rootnative/utils'
import { useMemo, type ReactNode } from 'react'
import {
  Platform,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from 'react-native'
import { useStateLayer } from '../internal/useStateLayer'
import { createStyles, getResolvedChipColors } from './styles'
import type { ChipProps, ChipVariant } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

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

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // `colors` already folds in the containerColor/contentColor overrides, and
  // in every variant/override path the layer overlay equals the resolved
  // text color. While disabled the hook's style/handlers are not applied at
  // all — the static disabled treatment below owns the container.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.backgroundColor,
    content: colors.textColor,
    disabled: isDisabled,
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  const isElevated = elevated && variant !== 'input'
  const showElevationLayers = isElevated && !isDisabled

  // Cross-fade level 1 (rest) and level 2 (hover) shadow layers per MD3,
  // driven by the gesture layer's hover progress (two-layer opacity swap —
  // platform-portable, see Card.tsx for why useShadow can't replace it).
  const animatedElevationLevel1Style = useAnimatedStyle(() => ({
    opacity: 1 - states.hovered.value,
  }))

  const animatedElevationLevel2Style = useAnimatedStyle(() => ({
    opacity: states.hovered.value,
  }))

  // The close button is its own gesture surface with hover/press layers only
  // (no focus layer, matching MD3's trailing-icon treatment) — it drops to
  // the generic gesture-layer primitive instead of useStateLayer.
  const closeLayers = useMemo(
    () => ({
      rest: { backgroundColor: 'transparent' },
      hovered: {
        backgroundColor: alphaColor(
          colors.textColor,
          theme.stateLayer.hoveredOpacity,
        ),
      },
      pressed: {
        backgroundColor: alphaColor(
          colors.textColor,
          theme.stateLayer.pressedOpacity,
        ),
      },
    }),
    [colors.textColor, theme.stateLayer],
  )
  const closeOptions = useMemo(
    () => ({
      disabled: isDisabled,
      transition: {
        hovered: 'state-hover',
        pressed: 'state-press',
      } as const,
    }),
    [isDisabled],
  )
  const { style: animatedCloseStyle, handlers: closeHandlers } =
    useGestureLayer(closeLayers, closeOptions)

  const resolvedIconColor = useMemo(
    () =>
      resolveColorFromStyle(
        styles.label,
        isDisabled ? styles.disabledLabel : undefined,
      ),
    [styles.label, styles.disabledLabel, isDisabled],
  )

  // MD3 leading-icon color mapping:
  //   assist / suggestion → primary
  //   filter → onSurfaceVariant (unselected) / onSecondaryContainer (selected)
  //   input → onSurfaceVariant
  // Filter and input labels already use these colors, so only assist and
  // suggestion diverge from the label-derived color. A `contentColor`
  // override and the 38% onSurface disabled treatment always win (both are
  // baked into the base label style that `resolvedIconColor` reads from).
  const leadingIconColor = useMemo(() => {
    if (isDisabled || contentColor) return resolvedIconColor
    if (variant === 'assist' || variant === 'suggestion') {
      return theme.colors.primary
    }
    return resolvedIconColor
  }, [isDisabled, contentColor, variant, resolvedIconColor, theme.colors])

  const computedLabelStyle = useMemo(
    () => [
      styles.label,
      isDisabled ? styles.disabledLabel : undefined,
      labelStyleOverride,
    ],
    [isDisabled, styles.disabledLabel, styles.label, labelStyleOverride],
  )

  const leadingIconRenderProps = { size: iconSize, color: leadingIconColor }
  const closeIconRenderProps = { size: iconSize, color: resolvedIconColor }

  const renderLeadingContent = () => {
    if (variant === 'input' && avatar) {
      return <View style={styles.avatar}>{avatar}</View>
    }
    if (leadingIcon) {
      return (
        <View style={styles.leadingIcon}>
          {renderIcon(leadingIcon, leadingIconRenderProps, iconResolver)}
        </View>
      )
    }
    if (variant === 'filter' && isSelected) {
      return (
        <View style={styles.leadingIcon}>
          {renderIcon('check', leadingIconRenderProps, iconResolver)}
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
        {...(isDisabled ? undefined : handlers)}
        style={[
          styles.container,
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled background
          // applies instantly (no animated layer to fight it).
          isDisabled ? undefined : stateLayerStyle,
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
        {showCloseIcon ? <View style={styles.closeSpacer} /> : null}
      </AnimatedPressable>
      {showCloseIcon ? (
        // Sibling of the chip's Pressable (overlaying `closeSpacer`), not a
        // child — a nested Pressable renders <button> inside <button> on
        // web, which is invalid DOM nesting. Sibling buttons also match the
        // reference Material Web chip structure: hovering the close target
        // drives only its own state layer, and Tab reaches chip → close in
        // order.
        <AnimatedPressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Remove"
          accessibilityState={{ disabled: isDisabled }}
          disabled={isDisabled}
          hitSlop={12}
          {...(isDisabled ? undefined : closeHandlers)}
          style={[
            styles.closeButton,
            isDisabled ? styles.disabledCloseButton : undefined,
            animatedCloseStyle,
          ]}
        >
          {renderIcon('close', closeIconRenderProps, iconResolver)}
        </AnimatedPressable>
      ) : null}
    </View>
  )
}
