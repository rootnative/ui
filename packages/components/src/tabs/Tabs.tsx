import { useTheme } from '@rootnative/core'
import { useAnimation, useShouldReduceMotion } from '@rootnative/inertia'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import { ScrollView, View } from 'react-native'
import { Divider } from '../divider'
import {
  PRIMARY_INDICATOR_MIN_WIDTH,
  SCROLLABLE_EDGE_PADDING,
  createTabsStyles,
  getTabColors,
} from './styles'
import { Tab } from './Tab'
import type { TabMeasurement } from './Tab'
import type { TabsProps } from './types'

const EMPTY_MEASUREMENT: TabMeasurement = { x: 0, width: 0, contentWidth: 0 }

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'primary',
  scrollable = false,
  edgePadding = SCROLLABLE_EDGE_PADDING,
  showDivider = true,
  containerColor,
  contentColor,
  selectedContentColor,
  indicatorColor,
  labelStyle,
  style,
  accessibilityLabel,
  testID,
  ...rest
}: TabsProps) {
  const theme = useTheme()
  const colors = useMemo(
    () =>
      getTabColors(
        theme,
        variant,
        contentColor,
        selectedContentColor,
        indicatorColor,
      ),
    [theme, variant, contentColor, selectedContentColor, indicatorColor],
  )
  const styles = useMemo(
    () => createTabsStyles(theme, variant, colors, edgePadding, containerColor),
    [theme, variant, colors, edgePadding, containerColor],
  )

  const isControlled = value !== undefined
  const [selfValue, setSelfValue] = useState(
    () => defaultValue ?? items[0]?.value,
  )
  const selected = isControlled ? value : selfValue

  const handlePress = useCallback(
    (next: string) => {
      if (!isControlled) setSelfValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  // The indicator is placed from measured geometry rather than from a flex
  // rule, because a primary indicator matches the *label* width — which only
  // the laid-out tab knows. Each tab reports its own box and its content box;
  // the two arrive as separate layout events, so they merge into one entry.
  const [measurements, setMeasurements] = useState<
    Record<string, TabMeasurement>
  >({})

  const handleMeasure = useCallback(
    (tabValue: string, patch: Partial<TabMeasurement>) => {
      setMeasurements((prev) => {
        const current = prev[tabValue]
        const next = { ...(current ?? EMPTY_MEASUREMENT), ...patch }
        if (
          current !== undefined &&
          current.x === next.x &&
          current.width === next.width &&
          current.contentWidth === next.contentWidth
        ) {
          return prev
        }
        return { ...prev, [tabValue]: next }
      })
    },
    [],
  )

  const active = selected === undefined ? undefined : measurements[selected]
  const measured =
    active !== undefined &&
    active.width > 0 &&
    (variant === 'secondary' || active.contentWidth > 0)

  const indicatorWidth = !measured
    ? 0
    : variant === 'primary'
      ? Math.max(active.contentWidth, PRIMARY_INDICATOR_MIN_WIDTH)
      : active.width
  const indicatorX = !measured
    ? 0
    : variant === 'primary'
      ? active.x + (active.width - indicatorWidth) / 2
      : active.x

  const row = (
    <View style={styles.row}>
      {items.map((item) => (
        <Tab
          key={item.value}
          item={item}
          variant={variant}
          colors={colors}
          selected={item.value === selected}
          scrollable={scrollable}
          labelStyle={labelStyle}
          onPress={handlePress}
          onMeasure={handleMeasure}
        />
      ))}

      {/*
        Drawn before the indicator so the indicator sits on top of it, the way
        MD3 shows them overlapping at the bottom edge. Inside the row rather
        than beside it so it scrolls with the tabs — `flexGrow` on the scroll
        content is what keeps it spanning the whole viewport when the tabs
        don't fill it.
      */}
      {showDivider ? (
        <Divider
          style={styles.divider}
          testID={testID === undefined ? undefined : `${testID}-divider`}
        />
      ) : null}

      {/*
        Mounted only once the active tab has been measured, so its animated
        position starts at the right place instead of sliding in from the row's
        leading edge on first render.
      */}
      {measured ? (
        <TabIndicator
          x={indicatorX}
          width={indicatorWidth}
          style={styles.indicator}
          testID={testID === undefined ? undefined : `${testID}-indicator`}
        />
      ) : null}
    </View>
  )

  return (
    <View
      {...rest}
      style={[styles.root, style]}
      role="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {scrollable ? (
        <ScrollableRow
          selectedX={measured ? active.x : undefined}
          selectedWidth={measured ? active.width : undefined}
          contentContainerStyle={styles.scrollContent}
        >
          {row}
        </ScrollableRow>
      ) : (
        row
      )}
    </View>
  )
}

interface TabIndicatorProps {
  x: number
  width: number
  style: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Two driving values (offset and width) rather than one progress, so this
 * stays a hand-rolled worklet instead of `useInterpolatedStyle`. Both ride
 * `spring-default-spatial` and collapse to a snap under reduced motion, which
 * `useAnimation` gates for us.
 */
function TabIndicator({ x, width, style, testID }: TabIndicatorProps) {
  const animatedX = useAnimation(x, 'spring-default-spatial')
  const animatedWidth = useAnimation(width, 'spring-default-spatial')

  const animatedStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
    transform: [{ translateX: animatedX.value }],
  }))

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[style, animatedStyle]}
    />
  )
}

interface ScrollableRowProps {
  children: React.ReactNode
  selectedX?: number
  selectedWidth?: number
  contentContainerStyle: StyleProp<ViewStyle>
}

/**
 * Horizontal scroller that keeps the active tab in view — a tab selected from
 * outside the row (a pager swipe, a deep link) is otherwise left off screen
 * with no hint that it moved.
 */
function ScrollableRow({
  children,
  selectedX,
  selectedWidth,
  contentContainerStyle,
}: ScrollableRowProps) {
  const scrollRef = useRef<ScrollView>(null)
  const viewportWidth = useRef(0)
  const contentWidth = useRef(0)
  const hasScrolled = useRef(false)
  const reduceMotion = useShouldReduceMotion()

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    viewportWidth.current = event.nativeEvent.layout.width
  }, [])

  const handleContentSizeChange = useCallback((width: number) => {
    contentWidth.current = width
  }, [])

  useEffect(() => {
    if (selectedX === undefined || selectedWidth === undefined) return
    const viewport = viewportWidth.current
    const content = contentWidth.current
    if (viewport === 0 || content <= viewport) return

    // Centre the tab where there is room to, and stop at either end rather
    // than scrolling into empty space.
    const centred = selectedX + selectedWidth / 2 - viewport / 2
    const x = Math.min(Math.max(centred, 0), content - viewport)

    // The first pass is the row settling into its initial selection, not a
    // change the user made — jump, don't slide.
    scrollRef.current?.scrollTo({
      x,
      animated: hasScrolled.current && !reduceMotion,
    })
    hasScrolled.current = true
  }, [selectedX, selectedWidth, reduceMotion])

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
    >
      {children}
    </ScrollView>
  )
}
