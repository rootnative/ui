import { useIconResolver, useTheme } from '@rootnative/core'
import { useShadow } from '@rootnative/inertia'
import { useGestureLayer } from '@rootnative/inertia/gesture-layer'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
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
import { elevationShadowConfig } from '../internal/elevationShadow'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { composePressHandlers, usePressMorph } from '../internal/usePressMorph'
import { useStateLayer } from '../internal/useStateLayer'
import {
  CHIP_FOCUS_RING_OFFSET,
  CHIP_SELECTED_REST_RADIUS,
  createStyles,
  getChipRestRadius,
  getResolvedChipColors,
} from './styles'
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
  closeAccessibilityLabel?: string
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
    closeAccessibilityLabel,
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

  // Expressive shape morphs for the selectable chips (filter/input), on the
  // fast-spatial spring Compose uses for chips: rest at cornerMedium, morph
  // to a pill while a filter chip is selected, squash toward cornerSmall
  // while pressed (pressed wins). Assist/suggestion chips keep their static
  // baseline shape — the morph is pinned to rest for them.
  const isSelectable = variant === 'filter' || variant === 'input'
  const restRadius = getChipRestRadius(theme, variant)
  const pressedRadius = theme.shape.cornerSmall
  const morph = usePressMorph({
    rest: restRadius,
    pressed: pressedRadius,
    transition: 'spring-fast-spatial',
    disabled: isDisabled || !isSelectable,
  })
  const morphProgress = morph.progress
  const selectedProgress = useBooleanProgress(isSelected, 'spring-fast-spatial')

  const composedHandlers = useMemo(
    () => composePressHandlers(handlers, morph.handlers),
    [handlers, morph.handlers],
  )

  const animatedRadiusStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [restRadius, CHIP_SELECTED_REST_RADIUS],
    )
    return {
      borderRadius: interpolate(
        morphProgress.value,
        [0, 1],
        [rest, pressedRadius],
      ),
    }
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on, and its radius follows
  // the shape morphs (offset outward) so it keeps hugging the container.
  const animatedFocusRingStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [restRadius, CHIP_SELECTED_REST_RADIUS],
    )
    return {
      opacity: states.focusVisible.value,
      borderRadius:
        interpolate(morphProgress.value, [0, 1], [rest, pressedRadius]) +
        CHIP_FOCUS_RING_OFFSET,
    }
  })

  const isElevated = elevated && variant !== 'input'
  const showElevationLayer = isElevated && !isDisabled

  // Elevation moves level 1 (rest) → level 2 (hover) per MD3 as one
  // interpolated shadow on a single unclipped carrier View behind the
  // container, driven by the gesture layer's hover progress. See Card.tsx for
  // why the shadow rides its own node — for the Chip it is load-bearing rather
  // than conservative: the container sets `overflow: 'hidden'`.
  const restShadow = useMemo(
    () => elevationShadowConfig(theme.elevation.level1),
    [theme.elevation.level1],
  )
  const hoveredShadow = useMemo(
    () => elevationShadowConfig(theme.elevation.level2),
    [theme.elevation.level2],
  )
  const elevationShadowStyle = useShadow({
    from: restShadow,
    to: hoveredShadow,
    progress: states.hovered,
  })

  // The carrier is also a shaped surface: it follows both shape morphs so the
  // shadow's shape matches the container's. Three driving values across the
  // node (hover for the shadow, selection and press for the radius) — hence a
  // separate style rather than folding the radius into `useShadow`, which only
  // covers shadow keys. It repeats `animatedRadiusStyle`'s body rather than
  // reusing it because one animated style must not be mounted on two nodes.
  const animatedElevationRadiusStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [restRadius, CHIP_SELECTED_REST_RADIUS],
    )
    return {
      borderRadius: interpolate(
        morphProgress.value,
        [0, 1],
        [rest, pressedRadius],
      ),
    }
  })

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
      {showElevationLayer ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.elevationLayer,
            animatedElevationRadiusStyle,
            elevationShadowStyle,
          ]}
        />
      ) : null}
      <AnimatedPressable
        {...rest}
        accessibilityRole="button"
        aria-disabled={isDisabled}
        {...(variant === 'filter'
          ? { 'aria-selected': isSelected }
          : undefined)}
        // Bring the touch target to the WCAG/MD3 minimum of 48dp (chip is 32dp tall).
        hitSlop={Platform.OS === 'web' ? undefined : 8}
        disabled={isDisabled}
        {...(isDisabled ? undefined : composedHandlers)}
        style={[
          styles.container,
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled background
          // applies instantly (no animated layer to fight it). The radius
          // morph stays applied while disabled — a selected filter chip
          // keeps its pill resting shape (the press progress is pinned).
          animatedRadiusStyle,
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
          // Composed with the chip's label by default: this button is a second
          // accessibility target inside what reads as one control, so a bare
          // "Remove" gives no clue which chip is about to go.
          accessibilityLabel={closeAccessibilityLabel ?? `Remove ${children}`}
          aria-disabled={isDisabled}
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
