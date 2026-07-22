import { defaultTopAppBarTokens, useTheme } from '@rootnative/core'
import {
  cubicBezier,
  useAnimation,
  useColorTransition,
  useMotionValue,
  useTransform,
} from '@rootnative/inertia'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { selectRTL } from '@rootnative/utils'
import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import { Platform, View } from 'react-native'
import { Button } from '../button'
import { IconButton } from '../icon-button'
import type { IconButtonProps } from '../icon-button'
import { SafeAreaView } from '../safe-area'
import { Typography } from '../typography'
import type { TypographyVariant } from '../typography'
import { createStyles, getColorSchemeColors } from './styles'
import type { AppBarProps } from './types'

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView)

type AppBarSize = 'small' | 'medium' | 'large'
function getBackIcon(): IconButtonProps['icon'] {
  if (Platform.OS === 'ios') {
    return selectRTL('chevron-left', 'chevron-right')
  }

  return selectRTL('arrow-left', 'arrow-right')
}

const titleVariantBySize: Record<AppBarSize, TypographyVariant> = {
  small: 'titleLarge',
  medium: 'headlineSmall',
  large: 'headlineMedium',
}
const APP_BAR_TITLE_TEXT_PROPS = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  accessibilityRole: 'header',
} as const

function resolveSize(variant: AppBarProps['variant']): AppBarSize {
  if (variant === 'medium' || variant === 'large') {
    return variant
  }

  return 'small'
}

function getSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: AppBarSize,
) {
  if (size === 'large') {
    return styles.largeContainer
  }

  return styles.mediumContainer
}

function withTopInset(
  enabled: boolean,
  content: ReactNode,
  style: StyleProp<ViewStyle>,
) {
  if (enabled) {
    return (
      <AnimatedSafeAreaView edges={['top']} style={style}>
        {content}
      </AnimatedSafeAreaView>
    )
  }

  return <Animated.View style={style}>{content}</Animated.View>
}

function measureWidth(event: LayoutChangeEvent): number {
  return Math.round(event.nativeEvent.layout.width)
}

export function AppBar({
  title,
  variant = 'small',
  colorScheme = 'surface',
  canGoBack = false,
  onBackPress,
  insetTop = false,
  elevated = false,
  leading,
  trailing,
  actions,
  containerColor,
  contentColor,
  titleStyle,
  scrollOffset,
  style,
}: AppBarProps) {
  const theme = useTheme()
  const topAppBar = theme.topAppBar ?? defaultTopAppBarTokens
  const schemeColors = useMemo(
    () => getColorSchemeColors(theme, colorScheme),
    [theme, colorScheme],
  )
  const resolvedContentColor = contentColor ?? schemeColors.contentColor
  const styles = useMemo(
    () => createStyles(theme, schemeColors),
    [theme, schemeColors],
  )
  const [leadingWidth, setLeadingWidth] = useState(0)
  const [actionsWidth, setActionsWidth] = useState(0)
  const titleColorStyle = useMemo(
    () => ({ color: resolvedContentColor }),
    [resolvedContentColor],
  )
  const size = resolveSize(variant)
  const titleVariant = titleVariantBySize[size]
  const isCenterAligned = variant === 'center-aligned'
  const isExpanded = size !== 'small'
  const titleStartInset =
    topAppBar.horizontalPadding +
    Math.max(topAppBar.titleStartInset, leadingWidth)
  const compactTitleEndInset = topAppBar.horizontalPadding + actionsWidth
  const centeredSideInset =
    topAppBar.horizontalPadding + Math.max(leadingWidth, actionsWidth)
  const expandedTitleInsetStyle = useMemo<ViewStyle>(
    () => ({ paddingStart: titleStartInset }),
    [titleStartInset],
  )
  const overlayTitleInsetStyle = useMemo<ViewStyle>(
    () =>
      isCenterAligned
        ? { start: centeredSideInset, end: centeredSideInset }
        : { start: titleStartInset, end: compactTitleEndInset },
    [centeredSideInset, compactTitleEndInset, isCenterAligned, titleStartInset],
  )

  // MD3 collapse-on-scroll (medium/large only): the bar collapses to the
  // small (64dp) form over a scroll distance equal to the height it loses,
  // while the title interpolates position and type scale
  // (headlineSmall/headlineMedium → titleLarge). Everything is derived from
  // `scrollOffset` on the UI thread — no JS-side scroll listener needed.
  const collapsible = isExpanded && scrollOffset != null
  const expandedHeight =
    size === 'large'
      ? topAppBar.largeContainerHeight
      : topAppBar.mediumContainerHeight
  const collapseRange = Math.max(
    1,
    expandedHeight - topAppBar.smallContainerHeight,
  )
  const restOffset = useMotionValue(0)
  // Gate on `collapsible` so a scrollOffset passed to a small/center-aligned
  // bar stays inert (no collapse, no scroll-driven tonal shift).
  const collapseSource = collapsible && scrollOffset ? scrollOffset : restOffset
  const collapseProgress = useTransform(
    collapseSource,
    [0, collapseRange],
    [0, 1],
  )

  const expandedTitleType = theme.typography[titleVariant]
  const collapsedTitleType = theme.typography.titleLarge
  // Rest geometry of the expanded title (bottom-aligned with the variant's
  // bottom padding) and the collapsed target (centered in the 64dp top row,
  // matching the small variant's overlay title exactly).
  const titleBottomPadding =
    size === 'large'
      ? topAppBar.largeTitleBottomPadding
      : topAppBar.mediumTitleBottomPadding
  const expandedTitleTop =
    expandedHeight - titleBottomPadding - expandedTitleType.lineHeight
  const collapsedTitleTop =
    (topAppBar.topRowHeight - collapsedTitleType.lineHeight) / 2
  const expandedTitleEndInset = theme.spacing.md

  const containerCollapseStyle = useAnimatedStyle(() => ({
    height: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedHeight, topAppBar.smallContainerHeight],
    ),
  }))
  const titleContainerCollapseStyle = useAnimatedStyle(() => ({
    top: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedTitleTop, collapsedTitleTop],
    ),
    height: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedTitleType.lineHeight, collapsedTitleType.lineHeight],
    ),
    end: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedTitleEndInset, compactTitleEndInset],
    ),
  }))
  const titleTextCollapseStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedTitleType.fontSize, collapsedTitleType.fontSize],
    ),
    lineHeight: interpolate(
      collapseProgress.value,
      [0, 1],
      [expandedTitleType.lineHeight, collapsedTitleType.lineHeight],
    ),
  }))
  const collapsibleTitleInsetStyle = useMemo<ViewStyle>(
    () => ({ start: titleStartInset }),
    [titleStartInset],
  )

  const leadingContent = useMemo(() => {
    if (leading) {
      return leading
    }

    if (!canGoBack) {
      return null
    }

    return (
      <View style={styles.iconFrame}>
        <IconButton
          icon={getBackIcon()}
          size="medium"
          variant="standard"
          iconColor={resolvedContentColor}
          accessibilityLabel="Go back"
          onPress={onBackPress}
        />
      </View>
    )
  }, [canGoBack, resolvedContentColor, leading, onBackPress, styles.iconFrame])

  const actionsContent = useMemo(() => {
    if (trailing) {
      return trailing
    }

    if (!actions || actions.length === 0) {
      return null
    }

    return (
      <View style={styles.actionsRow}>
        {actions.map((action, index) => {
          if (action.label !== undefined) {
            return (
              <Button
                key={`${action.label}-${index}`}
                variant="text"
                contentColor={resolvedContentColor}
                onPress={action.onPress}
                disabled={action.disabled}
                accessibilityLabel={action.accessibilityLabel}
              >
                {action.label}
              </Button>
            )
          }

          return (
            <View
              key={`${String(action.icon)}-${index}`}
              style={styles.iconFrame}
            >
              <IconButton
                icon={action.icon}
                size="medium"
                variant="standard"
                iconColor={resolvedContentColor}
                accessibilityLabel={action.accessibilityLabel}
                onPress={action.onPress}
                disabled={action.disabled}
              />
            </View>
          )
        })}
      </View>
    )
  }, [
    actions,
    resolvedContentColor,
    styles.actionsRow,
    styles.iconFrame,
    trailing,
  ])

  const onLeadingLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = measureWidth(event)

    setLeadingWidth((currentWidth) => {
      if (currentWidth === nextWidth) {
        return currentWidth
      }

      return nextWidth
    })
  }, [])

  const onActionsLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = measureWidth(event)

    setActionsWidth((currentWidth) => {
      if (currentWidth === nextWidth) {
        return currentWidth
      }

      return nextWidth
    })
  }, [])

  const topRow = (
    <View style={styles.topRow}>
      <View
        collapsable={false}
        onLayout={onLeadingLayout}
        style={styles.sideSlot}
      >
        {leadingContent}
      </View>
      <View style={styles.topRowSpacer} />
      <View
        collapsable={false}
        onLayout={onActionsLayout}
        style={styles.sideSlot}
      >
        {actionsContent}
      </View>
    </View>
  )

  // M3 surface tonal shift on scroll uses the medium1 (250 ms) duration on
  // the standard curve.
  const elevatedTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: theme.motion.durationMedium1,
      easing: cubicBezier(theme.motion.easingStandard),
    }),
    [theme.motion],
  )
  const elevatedProgress = useAnimation(elevated ? 1 : 0, elevatedTransition)
  // A collapsible bar drives the tonal shift from the scroll position (the
  // shift completes with the collapse); `elevated` still forces it on.
  const surfaceProgress = useTransform(() => {
    'worklet'
    return Math.max(elevatedProgress.value, collapseProgress.value)
  })
  // A `containerColor` override applies to both the resting and elevated
  // states, so the transition endpoints collapse to the override — the
  // animated layer can then never stomp it mid-transition.
  const animatedSurfaceStyle = useColorTransition(
    surfaceProgress,
    containerColor
      ? [containerColor, containerColor]
      : [schemeColors.containerColor, schemeColors.elevatedContainerColor],
  )

  const containerOverride = containerColor
    ? ({ backgroundColor: containerColor } as ViewStyle)
    : undefined
  const rootStyle: StyleProp<ViewStyle> = [
    styles.root,
    animatedSurfaceStyle,
    containerOverride,
    style,
  ]
  const safeAreaStyle: StyleProp<ViewStyle> = [
    styles.safeArea,
    animatedSurfaceStyle,
    containerOverride,
  ]

  if (isExpanded) {
    // Collapsible: the container height and the title's position/type scale
    // are scroll-driven, so the title lives in an absolutely-positioned
    // animated container instead of the static flex layout. Fully collapsed
    // it matches the small variant's overlay title geometry exactly.
    // Note: like every animated component in the library, the animated
    // fontSize/lineHeight win over a static override in `titleStyle` once
    // the animation updates.
    const content = collapsible ? (
      <Animated.View
        style={[
          styles.expandedContainer,
          getSizeStyle(styles, size),
          containerCollapseStyle,
        ]}
      >
        {topRow}
        <Animated.View
          style={[
            styles.collapsibleTitleContainer,
            collapsibleTitleInsetStyle,
            titleContainerCollapseStyle,
          ]}
        >
          <Animated.Text
            {...APP_BAR_TITLE_TEXT_PROPS}
            style={[
              expandedTitleType,
              styles.title,
              titleColorStyle,
              styles.startAlignedTitle,
              titleTextCollapseStyle,
              titleStyle,
            ]}
          >
            {title}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    ) : (
      <View style={[styles.expandedContainer, getSizeStyle(styles, size)]}>
        {topRow}
        <View
          style={[
            styles.expandedTitleContainer,
            size === 'large'
              ? styles.largeTitlePadding
              : styles.mediumTitlePadding,
            expandedTitleInsetStyle,
          ]}
        >
          <Typography
            {...APP_BAR_TITLE_TEXT_PROPS}
            variant={titleVariant}
            style={[
              styles.title,
              titleColorStyle,
              styles.startAlignedTitle,
              titleStyle,
            ]}
          >
            {title}
          </Typography>
        </View>
      </View>
    )

    return (
      <Animated.View style={rootStyle}>
        {withTopInset(insetTop, content, safeAreaStyle)}
      </Animated.View>
    )
  }

  const content = (
    <View style={styles.smallContainer}>
      {topRow}
      <View style={[styles.overlayTitleContainer, overlayTitleInsetStyle]}>
        <Typography
          {...APP_BAR_TITLE_TEXT_PROPS}
          variant={titleVariant}
          style={[
            styles.title,
            titleColorStyle,
            isCenterAligned ? styles.centeredTitle : styles.startAlignedTitle,
            titleStyle,
          ]}
        >
          {title}
        </Typography>
      </View>
    </View>
  )

  return (
    <Animated.View style={rootStyle}>
      {withTopInset(insetTop, content, safeAreaStyle)}
    </Animated.View>
  )
}
