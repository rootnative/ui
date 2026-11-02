import type { SharedValue } from '@rootnative/inertia'
import type { ReactNode, Ref } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

/**
 * `'multi-browse'` shows large, medium and small items at once, and an item
 * changes size as it scrolls. `'hero'` shows one large item and one small
 * preview of the next one. `'uncontained'` scrolls items of one width past
 * the edge with no size change. `'full-screen'` scrolls vertically, one item
 * per screen.
 */
export type CarouselVariant =
  | 'multi-browse'
  | 'hero'
  | 'uncontained'
  | 'full-screen'

/** What `renderItem` receives for one item. */
export interface CarouselItemInfo<T> {
  item: T
  index: number
  /**
   * How large the item is drawn, on the UI thread: 0 at the small size, 1 at
   * the large size. Fade a label out as the item shrinks with
   * `useInterpolatedStyle(progress, { opacity: [0, 1] })`. Always 1 in the
   * `uncontained` and `full-screen` variants.
   */
  progress: SharedValue<number>
}

/** The imperative handle of a carousel. */
export interface CarouselRef {
  /** Scroll until the item is the first large one. */
  scrollToIndex: (index: number, animated?: boolean) => void
}

export interface CarouselProps<T> extends Omit<ViewProps, 'children'> {
  /** The items to show. */
  items: readonly T[]
  /**
   * Draw one item. The node fills the item container, which clips it to the
   * MD3 extra-large corner. Content keeps the large width while the item
   * shrinks; the container masks it from both sides.
   */
  renderItem: (info: CarouselItemInfo<T>) => ReactNode
  /** Key of an item. Defaults to its index. */
  keyExtractor?: (item: T, index: number) => string
  /**
   * Carousel layout.
   * @default 'multi-browse'
   */
  variant?: CarouselVariant
  /**
   * Preferred width of a large item, in dp. The arrangement scales it so the
   * visible items fill the width. `hero` ignores it: the large item takes the
   * width that the preview leaves. `full-screen` ignores it too.
   * @default 186
   */
  itemWidth?: number
  /**
   * Height of the carousel, in dp. `full-screen` ignores it and takes the
   * height of its `style`, so give that variant a `flex: 1` or a height.
   * @default 205
   */
  itemHeight?: number
  /**
   * Space between two items, in dp.
   * @default 8
   */
  gap?: number
  /**
   * Space before the first item and after the last one, along the scroll
   * axis, in dp.
   * @default 0
   */
  contentPadding?: number
  /** Index of the first large item (controlled). */
  index?: number
  /**
   * Index of the first large item at mount (uncontrolled).
   * @default 0
   */
  defaultIndex?: number
  /**
   * Called with the index of the first large item when it changes. A user
   * scroll reports each item that reaches the first large position. A new
   * `index` or a `scrollToIndex` call reports only the item that it scrolls
   * to.
   */
  onIndexChange?: (index: number) => void
  /**
   * Makes every item a button. The item shows the MD3 state layers and a
   * focus ring, and calls this with the item on press.
   */
  onItemPress?: (item: T, index: number) => void
  /**
   * Screen-reader label of an item. Give it with `onItemPress` when the item
   * content has no text of its own.
   */
  itemAccessibilityLabel?: (item: T, index: number) => string
  /**
   * Override the item container color, behind the item content. The state
   * layers of a pressable item are derived from it.
   * @default surfaceContainerHighest
   */
  containerColor?: string
  /** Style applied to the carousel. */
  style?: StyleProp<ViewStyle>
  /** Test id applied to the carousel. Each item gets `${testID}-item-${index}`. */
  testID?: string
  /** The imperative handle. */
  ref?: Ref<CarouselRef>
}
