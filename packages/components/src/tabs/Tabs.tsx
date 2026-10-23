import { useTheme } from '@rootnative/core'
import {
  useAnimation,
  useMotionValue,
  useShouldReduceMotion,
} from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  LayoutChangeEvent,
  ScrollViewInstance,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { ScrollView, View } from 'react-native'
import { Divider } from '../divider'
import { pointerEvents } from '../internal/pointerEvents'
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

/** The indicator box of one tab, or `null` until the tab is measured. */
interface IndicatorRect {
  x: number
  width: number
}

function isMeasured(
  measurement: TabMeasurement | undefined,
  variant: 'primary' | 'secondary',
): measurement is TabMeasurement {
  return (
    measurement !== undefined &&
    measurement.width > 0 &&
    (variant === 'secondary' || measurement.contentWidth > 0)
  )
}

function indicatorRectOf(
  measurement: TabMeasurement,
  variant: 'primary' | 'secondary',
): IndicatorRect {
  if (variant === 'secondary') {
    return { x: measurement.x, width: measurement.width }
  }
  const width = Math.max(measurement.contentWidth, PRIMARY_INDICATOR_MIN_WIDTH)
  return { x: measurement.x + (measurement.width - width) / 2, width }
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  position,
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
  const measured = isMeasured(active, variant)
  const activeRect = measured ? indicatorRectOf(active, variant) : null
  const indicatorWidth = activeRect?.width ?? 0
  const indicatorX = activeRect?.x ?? 0

  // One rect per item, in `items` order, for the pager position to
  // interpolate between on the UI thread. `measurements` only changes on a
  // real geometry change, so the memo rebuilds the list only then.
  const rects = useMemo(
    () =>
      items.map((item) => {
        const measurement = measurements[item.value]
        return isMeasured(measurement, variant)
          ? indicatorRectOf(measurement, variant)
          : null
      }),
    [items, measurements, variant],
  )
  const rectsValue = useMotionValue<Array<IndicatorRect | null>>(rects)
  useEffect(() => {
    rectsValue.value = rects
  }, [rects, rectsValue])

  const row = (
    <View style={[styles.row, scrollable && styles.scrollRow]}>
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
        than beside it so it scrolls with the tabs, and spans the edge padding
        as Compose's `ScrollableTabRow` does. `flexGrow` on the row keeps it
        spanning the whole viewport when the tabs don't fill it.
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
          position={position}
          rects={rectsValue}
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
  position?: SharedValue<number>
  rects: SharedValue<Array<IndicatorRect | null>>
  style: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Two driving values (offset and width) rather than one progress, so this
 * stays a hand-rolled worklet instead of `useInterpolatedStyle`. Both ride
 * `spring-default-spatial` and collapse to a snap under reduced motion, which
 * `useAnimation` gates for us.
 *
 * With a pager `position`, the worklet reads the page position instead and
 * interpolates between the rects of the two tabs on each side of it. That is
 * the finger, not an animation, so reduced motion does not gate it. The
 * rects are measured, so they are physical positions in either layout
 * direction, and no mirroring is needed. A neighbour that is not measured
 * yet falls back to the springs for that frame.
 */
function TabIndicator({
  x,
  width,
  position,
  rects,
  style,
  testID,
}: TabIndicatorProps) {
  const animatedX = useAnimation(x, 'spring-default-spatial')
  const animatedWidth = useAnimation(width, 'spring-default-spatial')

  const animatedStyle = useAnimatedStyle(() => {
    if (position !== undefined) {
      const list = rects.value
      const last = list.length - 1
      if (last >= 0) {
        const page = Math.min(Math.max(position.value, 0), last)
        const from = Math.floor(page)
        const to = Math.min(from + 1, last)
        const a = list[from]
        const b = list[to]
        if (a !== null && a !== undefined && b !== null && b !== undefined) {
          const t = page - from
          return {
            width: a.width + (b.width - a.width) * t,
            transform: [{ translateX: a.x + (b.x - a.x) * t }],
          }
        }
      }
    }
    return {
      width: animatedWidth.value,
      transform: [{ translateX: animatedX.value }],
    }
  })

  return (
    <Animated.View
      testID={testID}
      style={[style, animatedStyle, pointerEvents.none]}
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
  const scrollRef = useRef<ScrollViewInstance>(null)
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
