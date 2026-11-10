import { useIconResolver, useTheme } from '@rootnative/core'
import { useShadow } from '@rootnative/inertia'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { renderIcon, resolveColorFromStyle } from '@rootnative/utils'
import { useCallback, useMemo, useState } from 'react'
import { Platform, Text, View, type GestureResponderEvent } from 'react-native'
import { elevationShadowConfig } from '../elevation-shadow'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { composeHandlers } from '../internal/composeHandlers'
import { webOutlineReset } from '../internal/focusOutline'
import { focusRingOutset } from '../internal/focusRing'
import { pointerEvents } from '../internal/pointerEvents'
import { pressedState } from '../internal/pressedState'
import { splitLayoutStyle } from '../internal/splitLayoutStyle'
import { getDefaultHitSlop } from '../internal/touchTarget'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { composePressHandlers, usePressMorph } from '../internal/usePressMorph'
import { useStateLayer } from '../internal/useStateLayer'
import { warnOnce } from '../internal/warnOnce'
import { CircularProgress } from '../progress'
import {
  BUTTON_FOCUS_RING_OFFSET,
  BUTTON_FOCUS_RING_WIDTH,
  BUTTON_LOADING_STROKE_RATIO,
  createStyles,
  getButtonMorphRadii,
  getButtonSizeTokens,
  getResolvedButtonColors,
} from './styles'
import type { ButtonProps } from './types'

export function Button({
  children,
  style,
  variant = 'filled',
  size = 'small',
  shape = 'round',
  selected,
  defaultSelected,
  onSelectedChange,
  leadingIcon,
  trailingIcon,
  iconSize,
  containerColor,
  contentColor,
  labelStyle: labelStyleOverride,
  disabled = false,
  loading = false,
  onPress,
  onLongPress,
  hitSlop,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled)
  // A loading button keeps its colors and its focus, so a keyboard user stays
  // on it. It takes no press, and its state layer and press morph stay at
  // rest, as for a disabled button.
  const isLoading = Boolean(loading)
  const isInert = isDisabled || isLoading
  const hasLeading = Boolean(leadingIcon) || isLoading
  const hasTrailing = Boolean(trailingIcon)
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const sizeTokens = getButtonSizeTokens(size)
  const resolvedIconSize = iconSize ?? sizeTokens.iconSize

  // Controlled and uncontrolled, the same idiom as IconButton.
  const isControlledToggle = selected !== undefined
  const asksForToggle = isControlledToggle || defaultSelected !== undefined
  if (asksForToggle && variant === 'text') {
    warnOnce(
      'button-text-toggle',
      'Button: the text variant has no toggle in Material Design 3, so it ignores `selected` and `defaultSelected`. Use the filled, tonal, outlined or elevated variant.',
    )
  }
  const isToggle = asksForToggle && variant !== 'text'
  const [selfSelected, setSelfSelected] = useState(Boolean(defaultSelected))
  const isSelected =
    isToggle && (isControlledToggle ? Boolean(selected) : selfSelected)
  const toggleState = isToggle ? isSelected : undefined
  const handleTogglePress = useCallback(
    (event: GestureResponderEvent) => {
      const next = !isSelected
      if (!isControlledToggle) setSelfSelected(next)
      onSelectedChange?.(next)
      onPress?.(event)
    },
    [isSelected, isControlledToggle, onSelectedChange, onPress],
  )
  const handlePress = isToggle ? handleTogglePress : onPress

  const styles = useMemo(
    () =>
      createStyles(
        theme,
        variant,
        size,
        shape,
        toggleState,
        hasLeading,
        hasTrailing,
        containerColor,
        contentColor,
      ),
    [
      theme,
      variant,
      size,
      shape,
      toggleState,
      hasLeading,
      hasTrailing,
      containerColor,
      contentColor,
    ],
  )

  const colors = useMemo(
    () =>
      getResolvedButtonColors(
        theme,
        variant,
        toggleState,
        containerColor,
        contentColor,
      ),
    [theme, variant, toggleState, containerColor, contentColor],
  )

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // `colors` already folds in the containerColor/contentColor overrides, and
  // in every variant the layer overlay equals the resolved text color — so
  // rest + textColor reproduce getResolvedButtonColors' layer set exactly.
  // A loading button is inert, but it keeps its container color.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.backgroundColor,
    content: colors.textColor,
    disabled: isInert,
    disabledContainerColor: isDisabled
      ? colors.disabledBackgroundColor
      : undefined,
  })

  // Expressive shape morphs, both on the bounce-free effects spring Compose
  // uses for buttons, separate from the state-layer color progress (which
  // stays on 'state-press'). A selected toggle inverts the rest shape (pill
  // for `round`, size corner for `square`), and a press squashes toward the
  // size's pressed corner on top of it.
  const unselectedRadius = getButtonMorphRadii(theme, size, shape, false).rest
  const { rest: selectedRadius, pressed: pressedRadius } = getButtonMorphRadii(
    theme,
    size,
    shape,
    true,
  )
  const morph = usePressMorph({
    rest: unselectedRadius,
    pressed: pressedRadius,
    transition: 'spring-default-effects',
    disabled: isInert,
  })
  const morphProgress = morph.progress
  const selectedProgress = useBooleanProgress(
    isSelected,
    'spring-default-effects',
  )

  const composedHandlers = useMemo(
    () => composePressHandlers(handlers, morph.handlers),
    [handlers, morph.handlers],
  )

  // One radius for the container and the shadow carrier, so the shadow keeps
  // the container's shape.
  const animatedRadiusStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRadius, selectedRadius],
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
  // the shape morphs (offset outward) so a keyboard-activated press keeps the
  // ring hugging the container.
  const ringOutset = focusRingOutset(
    BUTTON_FOCUS_RING_OFFSET + BUTTON_FOCUS_RING_WIDTH,
  )
  const animatedFocusRingStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRadius, selectedRadius],
    )
    return {
      opacity: states.focusVisible.value,
      borderRadius:
        interpolate(morphProgress.value, [0, 1], [rest, pressedRadius]) +
        ringOutset,
    }
  })

  // MD3 raises an elevated button from level 1 to 2 on hover, and a filled
  // or tonal one from level 0 to 1 (Compose `FilledButtonTokens` /
  // `FilledTonalButtonTokens`, `HoverContainerElevation`). Outlined and text
  // buttons stay flat.
  const isElevated = variant === 'elevated'
  const raisesOnHover =
    isElevated || variant === 'filled' || variant === 'tonal'
  const showElevationLayer = raisesOnHover && !isDisabled

  // The shadow is one interpolated surface on a single unclipped carrier View
  // behind the container, driven by the gesture layer's hover progress. See
  // Card.tsx for why the shadow rides its own node.
  const restLevel = isElevated ? theme.elevation.level1 : theme.elevation.level0
  const hoverLevel = isElevated
    ? theme.elevation.level2
    : theme.elevation.level1
  const restShadow = useMemo(
    () => elevationShadowConfig(restLevel),
    [restLevel],
  )
  const hoveredShadow = useMemo(
    () => elevationShadowConfig(hoverLevel),
    [hoverLevel],
  )
  const elevationShadowStyle = useShadow({
    from: restShadow,
    to: hoveredShadow,
    progress: states.hovered,
  })

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

  const {
    outer: layoutStyle,
    frame: frameStyle,
    inner: containerStyle,
  } = useMemo(() => splitLayoutStyle(style), [style])

  const iconRenderProps = { size: resolvedIconSize, color: resolvedIconColor }
  const iconBoxStyle = { width: resolvedIconSize, height: resolvedIconSize }

  return (
    <View style={[styles.wrapper, layoutStyle]}>
      <View style={frameStyle}>
        <Animated.View
          style={[styles.focusRing, animatedFocusRingStyle, pointerEvents.none]}
        />
        {showElevationLayer ? (
          // The carrier takes the radius and the shadow as two styles: the
          // shadow follows the hover progress, and `useShadow` covers only
          // the shadow keys.
          <Animated.View
            style={[
              styles.elevationLayer,
              animatedRadiusStyle,
              elevationShadowStyle,
              pointerEvents.none,
            ]}
          />
        ) : null}
        <AnimatedPressable
          {...props}
          accessibilityRole="button"
          aria-disabled={isDisabled}
          aria-busy={isLoading || props['aria-busy']}
          {...(isToggle ? pressedState(isSelected) : undefined)}
          hitSlop={
            // Sized per token, not a flat 4: `extraSmall` is 32dp tall, so a
            // constant slop left it at 40dp — under the 48dp WCAG/MD3 floor.
            // Web is excluded because react-native-web does not implement
            // `hitSlop`.
            hitSlop ??
            (Platform.OS === 'web'
              ? undefined
              : getDefaultHitSlop(sizeTokens.height))
          }
          disabled={isDisabled}
          onPress={isLoading ? undefined : handlePress}
          onLongPress={isLoading ? undefined : onLongPress}
          {...(isDisabled
            ? undefined
            : composeHandlers(composedHandlers, props))}
          style={[
            styles.container,
            webOutlineReset,
            // The gesture-layer style owns backgroundColor, also while
            // disabled: removing an animated style leaves its last value on
            // the view, so a press that disables the button would keep the
            // pressed color and corner. The shape morphs sit before the
            // consumer `style` so an explicit borderRadius override still
            // wins.
            stateLayerStyle,
            animatedRadiusStyle,
            isDisabled ? styles.disabledContainer : undefined,
            containerStyle,
          ]}
        >
          {isLoading ? (
            <View aria-hidden style={[styles.leadingIcon, iconBoxStyle]}>
              <CircularProgress
                size={resolvedIconSize}
                thickness={resolvedIconSize * BUTTON_LOADING_STROKE_RATIO}
                containerColor="transparent"
                contentColor={resolvedIconColor}
              />
            </View>
          ) : leadingIcon ? (
            <View aria-hidden style={[styles.leadingIcon, iconBoxStyle]}>
              {renderIcon(leadingIcon, iconRenderProps, iconResolver)}
            </View>
          ) : null}
          <Text style={computedLabelStyle}>{children}</Text>
          {trailingIcon ? (
            <View aria-hidden style={[styles.trailingIcon, iconBoxStyle]}>
              {renderIcon(trailingIcon, iconRenderProps, iconResolver)}
            </View>
          ) : null}
        </AnimatedPressable>
      </View>
    </View>
  )
}
