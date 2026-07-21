import { defaultTopAppBarTokens, useTheme } from '@rootnative/core'
import {
  cubicBezier,
  useAnimation,
  useColorTransition,
} from '@rootnative/inertia'
import { selectRTL } from '@rootnative/utils'
import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import { Platform, View } from 'react-native'
import Animated from 'react-native-reanimated'
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
  // the standard curve. This is also the seam for the collapse-on-scroll
  // follow-up (`useScroll` + `useTransform` interpolating height + title
  // typography) — see the tech-debt note in CLAUDE.md.
  const elevatedTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: theme.motion.durationMedium1,
      easing: cubicBezier(theme.motion.easingStandard),
    }),
    [theme.motion],
  )
  const elevatedProgress = useAnimation(elevated ? 1 : 0, elevatedTransition)
  const animatedSurfaceStyle = useColorTransition(elevatedProgress, [
    schemeColors.containerColor,
    schemeColors.elevatedContainerColor,
  ])

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
    const content = (
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
