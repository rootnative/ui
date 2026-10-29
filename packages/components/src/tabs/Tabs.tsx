import { useTheme } from '@rootnative/core'
import {
  useAnimation,
  useMotionValue,
  useShouldReduceMotion,
} from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { isRTLDirection } from '@rootnative/utils'
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
import type { TabItem, TabsProps } from './types'

const EMPTY_MEASUREMENT: TabMeasurement = { width: 0, contentWidth: 0 }

/** A measured tab and its offset from the row's physical left edge. */
interface TabBox extends TabMeasurement {
  x: number
}

/** The indicator box of one tab, or `null` until the tab is measured. */
interface IndicatorRect {
  x: number
  width: number
}

/**
 * The box of each tab, in `items` order. A tab is `null` until it and every
 * tab before it are measured.
 *
 * The offset is the start padding plus the widths of the tabs before it, not
 * the `x` of the tab's own layout event. react-native-web fires `onLayout`
 * from a `ResizeObserver`, so on the web a tab that moves and keeps its size
 * sends no new `x`: a new `edgePadding`, or a longer label on an earlier tab,
 * left the indicator at the old place. The tabs sit side by side with no gap,
 * so the sum is the offset that native layout reports.
 *
 * The indicator is placed from the physical left, and in RTL the first tab is
 * at the right edge, so there the offset counts back from the row width.
 * `rtlRowWidth` is that width in RTL, 0 until the row is measured, and
 * `undefined` in LTR.
 */
function placeTabs(
  items: TabItem[],
  measurements: Record<string, TabMeasurement>,
  startPadding: number,
  rtlRowWidth: number | undefined,
): Array<TabBox | null> {
  let offset = startPadding
  let placed = rtlRowWidth !== 0
  return items.map((item) => {
    const measurement = measurements[item.value]
    if (!placed || measurement === undefined || measurement.width <= 0) {
      placed = false
      return null
    }
    const x =
      rtlRowWidth === undefined
        ? offset
        : rtlRowWidth - offset - measurement.width
    offset += measurement.width
    return { ...measurement, x }
  })
}

function isMeasured(
  box: TabBox | null | undefined,
  variant: 'primary' | 'secondary',
): box is TabBox {
  return (
    box !== null &&
    box !== undefined &&
    (variant === 'secondary' || box.contentWidth > 0)
  )
}

function indicatorRectOf(
  box: TabBox,
  variant: 'primary' | 'secondary',
): IndicatorRect {
  if (variant === 'secondary') {
    return { x: box.x, width: box.width }
  }
  const width = Math.max(box.contentWidth, PRIMARY_INDICATOR_MIN_WIDTH)
  return { x: box.x + (box.width - width) / 2, width }
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
  // the laid-out tab knows. Each tab reports its width and its content width;
  // the two arrive as separate layout events, so they merge into one entry.
  // `placeTabs` turns the widths into offsets.
  const [measurements, setMeasurements] = useState<
    Record<string, TabMeasurement>
  >({})
  const [rowWidth, setRowWidth] = useState(0)

  const handleMeasure = useCallback(
    (tabValue: string, patch: Partial<TabMeasurement>) => {
      setMeasurements((prev) => {
        const current = prev[tabValue]
        const next = { ...(current ?? EMPTY_MEASUREMENT), ...patch }
        if (
          current !== undefined &&
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

  // Only RTL reads the row width, but the handler stays attached in LTR too:
  // react-native-web decides at mount whether to observe a node, so an
  // `onLayout` added after the mount never fires.
  const handleRowLayout = useCallback((event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width)
  }, [])

  const startPadding = scrollable ? edgePadding : 0
  const rtlRowWidth = isRTLDirection() ? rowWidth : undefined
  const boxes = useMemo(
    () => placeTabs(items, measurements, startPadding, rtlRowWidth),
    [items, measurements, startPadding, rtlRowWidth],
  )

  const activeIndex = items.findIndex((item) => item.value === selected)
  const active = activeIndex === -1 ? undefined : boxes[activeIndex]
  const measured = isMeasured(active, variant)
  const activeRect = measured ? indicatorRectOf(active, variant) : null
  const indicatorWidth = activeRect?.width ?? 0
  const indicatorX = activeRect?.x ?? 0

  // One rect per item, in `items` order, for the pager position to
  // interpolate between on the UI thread. `boxes` only changes on a real
  // geometry change, so the memo rebuilds the list only then.
  const rects = useMemo(
    () =>
      boxes.map((box) =>
        isMeasured(box, variant) ? indicatorRectOf(box, variant) : null,
      ),
    [boxes, variant],
  )
  const rectsValue = useMotionValue<Array<IndicatorRect | null>>(rects)
  useEffect(() => {
    rectsValue.value = rects
  }, [rects, rectsValue])

  const row = (
    <View
      style={[styles.row, scrollable && styles.scrollRow]}
      onLayout={handleRowLayout}
    >
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
 * rects are physical positions in either layout direction (`placeTabs`
 * counts from the right edge in RTL), so no mirroring is needed. A neighbour
 * that is not measured yet falls back to the springs for that frame.
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
