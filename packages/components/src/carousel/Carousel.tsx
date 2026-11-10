import { useTheme } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import {
  Motion,
  useMotionValue,
  useScroll,
  useShouldReduceMotion,
  useValueChange,
} from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia'
import {
  Animated,
  useAnimatedStyle,
  useDerivedValue,
} from '@rootnative/inertia/reanimated'
import { isRTLDirection } from '@rootnative/utils'
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type {
  LayoutChangeEvent,
  ScrollViewInstance,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Platform, View } from 'react-native'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { webOutlineReset } from '../internal/focusOutline'
import { pointerEvents } from '../internal/pointerEvents'
import { useStateLayer } from '../internal/useStateLayer'
import { buildStrategy, indexAtScroll, placeItem } from './strategy'
import type { CarouselStrategy } from './strategy'
import {
  DEFAULT_ITEM_HEIGHT,
  DEFAULT_ITEM_WIDTH,
  ITEM_GAP,
  createCarouselStyles,
} from './styles'
import type { CarouselItemInfo, CarouselProps } from './types'

type CarouselStyles = ReturnType<typeof createCarouselStyles>

/**
 * react-native-web drops `snapToOffsets`, so on the web the scroll view uses
 * CSS scroll snap, with one marker node at each snap offset. React Native
 * types no scroll-snap key, so these styles are cast.
 */
const webSnap = {
  horizontal: { scrollSnapType: 'x mandatory' } as ViewStyle,
  vertical: { scrollSnapType: 'y mandatory' } as ViewStyle,
  marker: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 1,
    scrollSnapAlign: 'start',
  } as ViewStyle,
  // Native `snapToEnd` makes the end of the content a snap offset too.
  endMarker: {
    position: 'absolute',
    bottom: 0,
    width: 1,
    height: 1,
    scrollSnapAlign: 'end',
  } as ViewStyle,
}

/**
 * The scroll geometry of one variant: the size of a slot along the scroll
 * axis, the offset that brings each item to the front, and the keyline
 * strategy of a masked variant.
 */
interface Geometry {
  itemSize: number
  snapOffsets: number[]
  strategy: CarouselStrategy | null
}

function plainGeometry(
  viewport: number,
  itemSize: number,
  gap: number,
  padding: number,
  count: number,
): Geometry {
  const contentSize = padding * 2 + count * itemSize + (count - 1) * gap
  const maxScroll = Math.max(0, contentSize - viewport)
  const snapOffsets: number[] = []
  for (let i = 0; i < count; i++) {
    snapOffsets.push(Math.min(i * (itemSize + gap), maxScroll))
  }
  return { itemSize, snapOffsets, strategy: null }
}

export function Carousel<T>({
  items,
  renderItem,
  keyExtractor,
  variant = 'multi-browse',
  itemWidth = DEFAULT_ITEM_WIDTH,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  gap = ITEM_GAP,
  contentPadding = 0,
  index,
  defaultIndex = 0,
  onIndexChange,
  onItemPress,
  itemAccessibilityLabel,
  containerColor,
  style,
  testID,
  ref,
  ...rest
}: CarouselProps<T>) {
  const theme = useTheme()
  const vertical = variant === 'full-screen'
  const masked = variant === 'multi-browse' || variant === 'hero'
  const styles = useMemo(
    () =>
      createCarouselStyles(
        theme,
        vertical,
        gap,
        contentPadding,
        containerColor,
      ),
    [theme, vertical, gap, contentPadding, containerColor],
  )

  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setViewport((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }, [])

  const count = items.length
  const geometry = useMemo<Geometry | null>(() => {
    const extent = vertical ? viewport.height : viewport.width
    if (extent <= 0 || count === 0) return null
    if (masked) {
      const strategy = buildStrategy({
        viewport: extent,
        itemWidth,
        gap,
        padding: contentPadding,
        count,
        layout: variant === 'hero' ? 'hero' : 'multi-browse',
      })
      if (strategy === null) return null
      return {
        itemSize: strategy.itemSize,
        snapOffsets: strategy.snapOffsets,
        strategy,
      }
    }
    const space = extent - contentPadding * 2
    const size = vertical ? space : Math.min(itemWidth, space)
    if (size <= 0) return null
    return plainGeometry(extent, size, gap, contentPadding, count)
  }, [
    vertical,
    masked,
    variant,
    viewport,
    itemWidth,
    gap,
    contentPadding,
    count,
  ])

  // The items read the strategy on the UI thread, so it rides a shared value.
  const strategyValue = useMotionValue<CarouselStrategy | null>(
    geometry?.strategy ?? null,
  )
  useEffect(() => {
    strategyValue.value = geometry?.strategy ?? null
  }, [geometry, strategyValue])

  const { scrollX, scrollY, onScroll } = useScroll()
  const offset = vertical ? scrollY : scrollX

  // The item that a `scrollToIndex` scroll lands on. That scroll reports only
  // this item, not each item that it passes. A parent that writes each report
  // back into `index` would otherwise drop a second tap on its next button.
  const landing = useRef<number | null>(null)

  const scrollRef = useRef<ScrollViewInstance | null>(null)
  const geometryRef = useRef(geometry)
  // The front item reads the snap offsets on the UI thread.
  const snapOffsets = useMotionValue<number[]>(geometry?.snapOffsets ?? [])
  // A layout effect, so that the index effect below reads the new geometry
  // in the same commit.
  useLayoutEffect(() => {
    geometryRef.current = geometry
    snapOffsets.value = geometry?.snapOffsets ?? []
    landing.current = null
  }, [geometry, snapOffsets])

  // In RTL a browser reports a negative offset from the start.
  const frontIndex = useDerivedValue(() => {
    'worklet'
    return indexAtScroll(snapOffsets.value, Math.abs(offset.value))
  })

  // The index that was last reported, so a repeat is quiet.
  const lastIndex = useRef(index ?? defaultIndex)
  const report = useCallback(
    (next: number) => {
      if (next === lastIndex.current) return
      lastIndex.current = next
      onIndexChange?.(next)
    },
    [onIndexChange],
  )

  const handleFrontChange = useCallback(
    (next: number, previous: number) => {
      const target = landing.current
      if (target !== null) {
        // A step away from the landing item is the user taking over.
        const away = Math.abs(next - target) > Math.abs(previous - target)
        if (!away) {
          // `scrollToIndex` reported its item when the scroll started.
          if (next === target) landing.current = null
          return
        }
        landing.current = null
      }
      report(next)
    },
    [report],
  )
  useValueChange(frontIndex, handleFrontChange)

  const releaseLanding = useCallback(() => {
    landing.current = null
  }, [])

  const scrollToIndex = useCallback(
    (target: number, animated = true) => {
      const current = geometryRef.current
      if (current === null) return
      const clamped = Math.min(
        Math.max(Math.round(target), 0),
        current.snapOffsets.length - 1,
      )
      const scroll = current.snapOffsets[clamped]
      // Two items at the end can share one offset, and the front item there
      // is the later one.
      const lands = indexAtScroll(current.snapOffsets, scroll)
      if (lands !== frontIndex.value) landing.current = lands
      // In RTL a browser counts the offset down from 0 and clamps a positive
      // offset to 0. Native is not checked in RTL.
      const x = Platform.OS === 'web' && isRTLDirection() ? -scroll : scroll
      scrollRef.current?.scrollTo(
        vertical ? { y: scroll, animated } : { x, animated },
      )
      report(clamped)
    },
    [vertical, report, frontIndex],
  )

  useImperativeHandle(ref, () => ({ scrollToIndex }), [scrollToIndex])

  // The index effect reads `scrollToIndex` through a ref, so that it runs
  // when `index` changes, not when a new `onIndexChange` rebuilds the
  // callback. Otherwise a stale `index` scrolls the carousel back.
  const scrollToIndexRef = useRef(scrollToIndex)
  useLayoutEffect(() => {
    scrollToIndexRef.current = scrollToIndex
  }, [scrollToIndex])

  // The first pass is the carousel settling on its initial item, not a change
  // the user made: jump, do not slide. A layout effect, so that no report
  // arrives between the commit and the echo check.
  const ready = geometry !== null
  const isControlled = index !== undefined
  const hasScrolled = useRef(false)
  const reduceMotion = useShouldReduceMotion()
  useLayoutEffect(() => {
    if (!ready) return
    const target = isControlled
      ? index
      : hasScrolled.current
        ? undefined
        : defaultIndex
    if (target === undefined) return
    // A parent that writes a report back into `index` echoes the item that
    // the carousel already shows.
    if (hasScrolled.current && target === lastIndex.current) return
    scrollToIndexRef.current(target, hasScrolled.current && !reduceMotion)
    hasScrolled.current = true
  }, [ready, isControlled, index, defaultIndex, reduceMotion])

  const slotStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (geometry === null) return undefined
    return vertical
      ? { height: geometry.itemSize, alignSelf: 'stretch' }
      : { width: geometry.itemSize, height: itemHeight }
  }, [geometry, vertical, itemHeight])

  const rootStyle = useMemo<StyleProp<ViewStyle>>(
    () => [styles.root, vertical ? undefined : { height: itemHeight }, style],
    [styles.root, vertical, itemHeight, style],
  )

  const direction = isRTLDirection() ? -1 : 1
  const webSnapStyle =
    Platform.OS === 'web'
      ? vertical
        ? webSnap.vertical
        : webSnap.horizontal
      : undefined

  return (
    <View {...rest} style={rootStyle} onLayout={handleLayout} testID={testID}>
      <Motion.ScrollView
        ref={scrollRef}
        horizontal={!vertical}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={releaseLanding}
        snapToOffsets={geometry?.snapOffsets}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={[styles.scroll, webSnapStyle]}
        contentContainerStyle={styles.content}
        testID={testID === undefined ? undefined : `${testID}-scroll`}
      >
        {geometry === null
          ? null
          : items.map((item, itemIndex) => {
              const key = keyExtractor?.(item, itemIndex) ?? String(itemIndex)
              const itemTestID =
                testID === undefined ? undefined : `${testID}-item-${itemIndex}`
              const label = itemAccessibilityLabel?.(item, itemIndex)
              const onPress =
                onItemPress === undefined
                  ? undefined
                  : () => onItemPress(item, itemIndex)
              const surface = (children: ReactNode) =>
                onPress === undefined ? (
                  <View style={styles.container} testID={itemTestID}>
                    {children}
                  </View>
                ) : (
                  <PressableSurface
                    theme={theme}
                    styles={styles}
                    containerColor={containerColor}
                    onPress={onPress}
                    accessibilityLabel={label}
                    testID={itemTestID}
                  >
                    {children}
                  </PressableSurface>
                )
              return masked ? (
                <MaskedSlot
                  key={key}
                  item={item}
                  index={itemIndex}
                  strategy={strategyValue}
                  offset={offset}
                  direction={direction}
                  slotStyle={slotStyle}
                  styles={styles}
                  renderItem={renderItem}
                  surface={surface}
                />
              ) : (
                <PlainSlot
                  key={key}
                  item={item}
                  index={itemIndex}
                  slotStyle={slotStyle}
                  styles={styles}
                  renderItem={renderItem}
                  surface={surface}
                />
              )
            })}
        {Platform.OS === 'web' && geometry !== null ? (
          <WebSnapMarkers offsets={geometry.snapOffsets} vertical={vertical} />
        ) : null}
      </Motion.ScrollView>
    </View>
  )
}

function WebSnapMarkers({
  offsets,
  vertical,
}: {
  offsets: number[]
  vertical: boolean
}) {
  // react-native-web writes an inline `start` as `left` whatever the document
  // direction is, so the markers take the physical side.
  const startSide = isRTLDirection() ? 'right' : 'left'
  const endSide = startSide === 'left' ? 'right' : 'left'
  const at = (offset: number): ViewStyle =>
    vertical ? { top: offset } : { [startSide]: offset }
  const end: ViewStyle = { [endSide]: 0 }
  return (
    <>
      {[...new Set(offsets)].map((offset) => (
        <View
          key={offset}
          aria-hidden
          style={[webSnap.marker, at(offset), pointerEvents.none]}
        />
      ))}
      <View aria-hidden style={[webSnap.endMarker, end, pointerEvents.none]} />
    </>
  )
}

interface SlotProps<T> {
  item: T
  index: number
  slotStyle: StyleProp<ViewStyle>
  styles: CarouselStyles
  renderItem: (info: CarouselItemInfo<T>) => ReactNode
  surface: (children: ReactNode) => ReactNode
}

/** An item of a fixed size: the `uncontained` and `full-screen` variants. */
function PlainSlot<T>({
  item,
  index,
  slotStyle,
  styles,
  renderItem,
  surface,
}: SlotProps<T>) {
  const progress = useMotionValue(1)
  const info = useMemo<CarouselItemInfo<T>>(
    () => ({ item, index, progress }),
    [item, index, progress],
  )
  return (
    <View style={[styles.slot, slotStyle]}>{surface(renderItem(info))}</View>
  )
}

interface MaskedSlotProps<T> extends SlotProps<T> {
  strategy: SharedValue<CarouselStrategy | null>
  offset: SharedValue<number>
  direction: 1 | -1
}

/**
 * An item that moves and changes size with the scroll. The slot keeps the
 * nominal large width in the scroll content. Inside it, the mask takes the
 * keyline width and moves to the keyline center, and the content keeps the
 * large width and shifts the other way, so the item is cropped from both
 * sides around its center, the way Compose masks a carousel item.
 */
function MaskedSlot<T>({
  item,
  index,
  strategy,
  offset,
  direction,
  slotStyle,
  styles,
  renderItem,
  surface,
}: MaskedSlotProps<T>) {
  const placement = useDerivedValue(() => {
    'worklet'
    const current = strategy.value
    if (current === null) return { size: 0, shift: 0, large: 0 }
    const placed = placeItem(current, index, offset.value)
    const slotCenter =
      current.padding +
      index * (current.itemSize + current.gap) +
      current.itemSize / 2 -
      offset.value
    return {
      size: placed.size,
      shift: placed.center - slotCenter,
      large: current.itemSize,
    }
  })

  const progress = useDerivedValue(() => {
    'worklet'
    const current = strategy.value
    if (current === null || current.smallSize <= 0) return 1
    const range = current.itemSize - current.smallSize
    if (range <= 0) return 1
    const value = (placement.value.size - current.smallSize) / range
    return Math.min(Math.max(value, 0), 1)
  })

  const maskStyle = useAnimatedStyle(() => {
    'worklet'
    const { size, shift, large } = placement.value
    return {
      width: size,
      transform: [{ translateX: direction * (shift + (large - size) / 2) }],
    }
  })

  const contentStyle = useAnimatedStyle(() => {
    'worklet'
    const { size, large } = placement.value
    return {
      width: large,
      transform: [{ translateX: direction * (-(large - size) / 2) }],
    }
  })

  const info = useMemo<CarouselItemInfo<T>>(
    () => ({ item, index, progress }),
    [item, index, progress],
  )

  return (
    <View style={[styles.slot, slotStyle]}>
      <Animated.View style={[styles.mask, maskStyle]}>
        <Animated.View style={[styles.maskContent, contentStyle]}>
          {surface(renderItem(info))}
        </Animated.View>
      </Animated.View>
    </View>
  )
}

interface PressableSurfaceProps {
  theme: MaterialTheme
  styles: CarouselStyles
  containerColor?: string
  onPress: () => void
  accessibilityLabel?: string
  testID?: string
  children: ReactNode
}

/** The item container as a button, with the MD3 state layers. */
function PressableSurface({
  theme,
  styles,
  containerColor,
  onPress,
  accessibilityLabel,
  testID,
  children,
}: PressableSurfaceProps) {
  const {
    style: stateLayerStyle,
    handlers,
    focusRingStyle,
  } = useStateLayer({
    rest: theme.colors.surfaceContainerHighest,
    content: theme.colors.onSurface,
    containerColor,
  })
  return (
    <AnimatedPressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      {...handlers}
      style={[
        styles.container,
        webOutlineReset,
        styles.interactiveContainer,
        stateLayerStyle,
      ]}
      testID={testID}
    >
      {children}
      <Animated.View
        style={[styles.focusRing, focusRingStyle, pointerEvents.none]}
      />
    </AnimatedPressable>
  )
}
