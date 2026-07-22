import { useIconResolver, useTheme } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { cubicBezier, useAnimation, useGesture } from '@rootnative/inertia'
import {
  Animated,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { renderIcon, resolveColorFromStyle } from '@rootnative/utils'
import { useCallback, useMemo, useState, type ReactElement } from 'react'
import {
  Platform,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native'
import {
  createGroupStyles,
  createItemStyles,
  getItemCornerRadii,
  getResolvedItemColors,
  getSizeTokens,
} from './styles'
import type {
  ButtonGroupItem,
  ButtonGroupProps,
  ButtonGroupSelectionMode,
  ButtonGroupSize,
  ButtonGroupVariant,
} from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function ButtonGroup(props: ButtonGroupProps): ReactElement {
  const {
    items,
    variant = 'standard',
    size = 'small',
    selectionMode = 'none',
    iconSize,
    disabled: groupDisabled = false,
    containerColor,
    contentColor,
    selectedContainerColor,
    selectedContentColor,
    labelStyle,
    style,
    accessibilityLabel,
    testID,
    onItemPress,
  } = props

  const theme = useTheme()
  const groupStyles = useMemo(
    () => createGroupStyles(theme, variant),
    [theme, variant],
  )

  const [internalValue, setInternalValue] = useState<string[]>(() =>
    normalizeValue(selectionMode, props.defaultValue ?? props.value ?? null),
  )

  const isControlled = selectionMode !== 'none' && props.value !== undefined
  const selectedValues = isControlled
    ? normalizeValue(selectionMode, props.value ?? null)
    : internalValue

  const handleItemPress = useCallback(
    (value: string) => {
      onItemPress?.(value)

      if (selectionMode === 'none') return

      const next = computeNextSelection(selectionMode, selectedValues, value)

      if (!isControlled) setInternalValue(next)

      if (selectionMode === 'single') {
        const single: string | null = next[0] ?? null
        ;(props.onValueChange as ((v: string | null) => void) | undefined)?.(
          single,
        )
      } else {
        ;(props.onValueChange as ((v: string[]) => void) | undefined)?.(next)
      }
    },
    [
      isControlled,
      onItemPress,
      props.onValueChange,
      selectedValues,
      selectionMode,
    ],
  )

  return (
    <View
      style={[groupStyles.container, style]}
      // Multi-select gets no special container role — items announce
      // themselves as independent checkboxes.
      accessibilityRole={
        selectionMode === 'single'
          ? 'radiogroup'
          : selectionMode === 'multiple'
            ? 'none'
            : 'toolbar'
      }
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {items.map((item, index) => (
        <ButtonGroupItemImpl
          key={item.value}
          item={item}
          index={index}
          total={items.length}
          theme={theme}
          variant={variant}
          size={size}
          iconSizeOverride={iconSize}
          isSelected={selectedValues.includes(item.value)}
          isGroupDisabled={groupDisabled}
          selectionMode={selectionMode}
          containerColor={containerColor}
          contentColor={contentColor}
          selectedContainerColor={selectedContainerColor}
          selectedContentColor={selectedContentColor}
          labelStyle={labelStyle}
          onPress={handleItemPress}
        />
      ))}
    </View>
  )
}

interface ItemImplProps {
  item: ButtonGroupItem
  index: number
  total: number
  theme: MaterialTheme
  variant: ButtonGroupVariant
  size: ButtonGroupSize
  iconSizeOverride?: number
  isSelected: boolean
  isGroupDisabled: boolean
  selectionMode: ButtonGroupSelectionMode
  containerColor?: string
  contentColor?: string
  selectedContainerColor?: string
  selectedContentColor?: string
  labelStyle?: StyleProp<TextStyle>
  onPress: (value: string) => void
}

function ButtonGroupItemImpl({
  item,
  index,
  total,
  theme,
  variant,
  size,
  iconSizeOverride,
  isSelected,
  isGroupDisabled,
  selectionMode,
  containerColor,
  contentColor,
  selectedContainerColor,
  selectedContentColor,
  labelStyle: labelStyleOverride,
  onPress,
}: ItemImplProps): ReactElement {
  const isDisabled = Boolean(isGroupDisabled || item.disabled)
  const iconResolver = useIconResolver()

  // Selection morph (colors + corner radii) — durationShort4 on the MD3
  // standard curve. Component-specific tween, so the config stays local
  // rather than in the named-transition registry.
  const selectedTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: theme.motion.durationShort4,
      easing: cubicBezier(theme.motion.easingStandard),
    }),
    [theme.motion.durationShort4, theme.motion.easingStandard],
  )

  const tokens = getSizeTokens(size)
  const resolvedIconSize = iconSizeOverride ?? tokens.iconSize

  const unselectedColors = useMemo(
    () =>
      getResolvedItemColors(
        theme,
        false,
        containerColor,
        contentColor,
        selectedContainerColor,
        selectedContentColor,
      ),
    [
      theme,
      containerColor,
      contentColor,
      selectedContainerColor,
      selectedContentColor,
    ],
  )

  const selectedColors = useMemo(
    () =>
      getResolvedItemColors(
        theme,
        true,
        containerColor,
        contentColor,
        selectedContainerColor,
        selectedContentColor,
      ),
    [
      theme,
      containerColor,
      contentColor,
      selectedContainerColor,
      selectedContentColor,
    ],
  )

  const activeColors = isSelected ? selectedColors : unselectedColors

  const itemStyles = useMemo(
    () => createItemStyles(theme, size, activeColors),
    [theme, size, activeColors],
  )

  const unselectedRadii = useMemo(
    () => getItemCornerRadii(theme, variant, size, index, total, false),
    [theme, variant, size, index, total],
  )

  const selectedRadii = useMemo(
    () => getItemCornerRadii(theme, variant, size, index, total, true),
    [theme, variant, size, index, total],
  )

  const selectedProgress = useAnimation(isSelected ? 1 : 0, selectedTransition)

  // Gesture progress + handlers from inertia. The cascade worklet below
  // consumes the raw sub-states because the per-state target colors
  // themselves interpolate with the selection progress — a shape the static
  // layer maps of `useGestureLayer` can't express, so this stays hook-level.
  // Focus feedback rides `focusVisible` (keyboard focus only).
  const { hovered, focusVisible, pressed, handlers } = useGesture({
    hovered: 'state-hover',
    pressed: 'state-press',
    focused: 'state-focus',
    focusVisible: 'state-focus',
  } as const)

  const disabledBackgroundColor = activeColors.disabledBackgroundColor

  // Layered crossfade: rest → focus → hover → press, with the rest color
  // morphing between unselected and selected via `selectedProgress`. When
  // disabled, all state layers are bypassed and the MD3 disabled bg wins —
  // animated styles beat later static styles in the array, so we must encode
  // the disabled color here rather than relying on `disabledContainer`.
  const animatedContainerStyle = useAnimatedStyle(() => {
    const topLeft = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRadii.topLeft, selectedRadii.topLeft],
    )
    const topRight = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRadii.topRight, selectedRadii.topRight],
    )
    const bottomLeft = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRadii.bottomLeft, selectedRadii.bottomLeft],
    )
    const bottomRight = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRadii.bottomRight, selectedRadii.bottomRight],
    )

    if (isDisabled) {
      return {
        backgroundColor: disabledBackgroundColor,
        borderTopLeftRadius: topLeft,
        borderTopRightRadius: topRight,
        borderBottomLeftRadius: bottomLeft,
        borderBottomRightRadius: bottomRight,
      }
    }

    const restBg = interpolateColor(
      selectedProgress.value,
      [0, 1],
      [unselectedColors.backgroundColor, selectedColors.backgroundColor],
    )
    const hoveredTarget = interpolateColor(
      selectedProgress.value,
      [0, 1],
      [
        unselectedColors.hoveredBackgroundColor,
        selectedColors.hoveredBackgroundColor,
      ],
    )
    const focusedTarget = interpolateColor(
      selectedProgress.value,
      [0, 1],
      [
        unselectedColors.focusedBackgroundColor,
        selectedColors.focusedBackgroundColor,
      ],
    )
    const pressedTarget = interpolateColor(
      selectedProgress.value,
      [0, 1],
      [
        unselectedColors.pressedBackgroundColor,
        selectedColors.pressedBackgroundColor,
      ],
    )

    const focusedBg = interpolateColor(
      focusVisible.value,
      [0, 1],
      [restBg, focusedTarget],
    )
    const hoveredBg = interpolateColor(
      hovered.value,
      [0, 1],
      [focusedBg, hoveredTarget],
    )
    const pressedBg = interpolateColor(
      pressed.value,
      [0, 1],
      [hoveredBg, pressedTarget],
    )

    return {
      backgroundColor: pressedBg,
      borderTopLeftRadius: topLeft,
      borderTopRightRadius: topRight,
      borderBottomLeftRadius: bottomLeft,
      borderBottomRightRadius: bottomRight,
    }
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: focusVisible.value,
    borderTopLeftRadius:
      interpolate(
        selectedProgress.value,
        [0, 1],
        [unselectedRadii.topLeft, selectedRadii.topLeft],
      ) + 3,
    borderTopRightRadius:
      interpolate(
        selectedProgress.value,
        [0, 1],
        [unselectedRadii.topRight, selectedRadii.topRight],
      ) + 3,
    borderBottomLeftRadius:
      interpolate(
        selectedProgress.value,
        [0, 1],
        [unselectedRadii.bottomLeft, selectedRadii.bottomLeft],
      ) + 3,
    borderBottomRightRadius:
      interpolate(
        selectedProgress.value,
        [0, 1],
        [unselectedRadii.bottomRight, selectedRadii.bottomRight],
      ) + 3,
  }))

  const resolvedIconColor = useMemo(
    () =>
      resolveColorFromStyle(
        itemStyles.label,
        isDisabled ? itemStyles.disabledLabel : undefined,
      ),
    [itemStyles.label, itemStyles.disabledLabel, isDisabled],
  )

  const computedLabelStyle = useMemo(
    () => [
      itemStyles.label,
      isDisabled ? itemStyles.disabledLabel : undefined,
      labelStyleOverride,
    ],
    [
      isDisabled,
      itemStyles.disabledLabel,
      itemStyles.label,
      labelStyleOverride,
    ],
  )

  const handlePress = useCallback(() => {
    if (isDisabled) return
    onPress(item.value)
  }, [isDisabled, onPress, item.value])

  // Single-select items are radios; multi-select items are independent
  // checkboxes (MD3 toggle buttons), announced with a checked state.
  const accessibilityRole =
    selectionMode === 'single'
      ? 'radio'
      : selectionMode === 'multiple'
        ? 'checkbox'
        : 'button'

  const accessibilityState =
    selectionMode === 'single'
      ? { disabled: isDisabled, selected: isSelected }
      : selectionMode === 'multiple'
        ? { disabled: isDisabled, checked: isSelected }
        : { disabled: isDisabled }

  const iconRenderProps = { size: resolvedIconSize, color: resolvedIconColor }

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[itemStyles.focusRing, animatedFocusRingStyle]}
      />
      <AnimatedPressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={item.accessibilityLabel ?? item.label}
        accessibilityState={accessibilityState}
        hitSlop={Platform.OS === 'web' ? undefined : 4}
        disabled={isDisabled}
        onPress={handlePress}
        {...handlers}
        style={[
          itemStyles.container,
          animatedContainerStyle,
          isDisabled ? itemStyles.disabledContainer : undefined,
        ]}
      >
        {item.leadingIcon ? (
          <View style={itemStyles.leadingIcon}>
            {renderIcon(item.leadingIcon, iconRenderProps, iconResolver)}
          </View>
        ) : null}
        {item.label ? (
          <Text style={computedLabelStyle}>{item.label}</Text>
        ) : null}
        {item.trailingIcon ? (
          <View style={itemStyles.trailingIcon}>
            {renderIcon(item.trailingIcon, iconRenderProps, iconResolver)}
          </View>
        ) : null}
      </AnimatedPressable>
    </View>
  )
}

function normalizeValue(
  selectionMode: ButtonGroupSelectionMode,
  raw: string | string[] | null | undefined,
): string[] {
  if (selectionMode === 'none' || raw == null) return []
  if (Array.isArray(raw)) return raw
  return [raw]
}

function computeNextSelection(
  selectionMode: ButtonGroupSelectionMode,
  current: string[],
  pressed: string,
): string[] {
  if (selectionMode === 'single') {
    return current[0] === pressed ? [] : [pressed]
  }
  if (selectionMode === 'multiple') {
    return current.includes(pressed)
      ? current.filter((v) => v !== pressed)
      : [...current, pressed]
  }
  return current
}
