/**
 * The keyline model of the MD3 carousel, after
 * androidx.compose.material3.carousel `Strategy` / `KeylineList` /
 * `Arrangement`.
 *
 * Every item has one nominal slot of the large size: slot `i` is at
 * `padding + i * (itemSize + gap)` in the content. The viewport shows a list
 * of keylines, each one a size and a center. An item is drawn at the keyline
 * that its slot center lands on, interpolated between the two keylines on
 * each side, so an item grows as it scrolls toward a large keyline and
 * shrinks as it scrolls toward a small one or off an edge.
 *
 * The default list is start aligned: the large items come first. Near the
 * end of the content the list steps through arrangements that move the small
 * keylines to the start, so the last item ends large at the end edge.
 */

export interface Keyline {
  /** Width of an item on this keyline, in dp. 0 on an anchor. */
  size: number
  /** Center of the keyline from the physical start of the viewport. */
  offset: number
  /**
   * Center of the keyline on the nominal line, where every keyline is one
   * large slot apart. An item is matched to a keyline through this value.
   */
  unadjustedOffset: number
  /** A large keyline. */
  focal: boolean
}

export interface CarouselStrategy {
  /** Width of a large item, after the arrangement filled the viewport. */
  itemSize: number
  /** Width of a small item, or 0 when the arrangement has none. */
  smallSize: number
  gap: number
  padding: number
  /**
   * The keyline lists from the default arrangement to the end arrangement.
   * One list when no step is needed.
   */
  steps: Keyline[][]
  /**
   * The scroll distance into the end region at which each step applies.
   * `shifts[0]` is 0.
   */
  shifts: number[]
  /** The largest scroll offset. 0 when every item fits. */
  maxScroll: number
  /** One offset per item: the scroll that puts it on the first large keyline. */
  snapOffsets: number[]
  /** The width of the scroll content: the viewport plus `maxScroll`. */
  contentSize: number
}

export interface StrategyOptions {
  /** Width of the carousel. */
  viewport: number
  /** Preferred width of a large item. */
  itemWidth: number
  gap: number
  /** Space before the first and after the last item. */
  padding: number
  count: number
  layout: 'multi-browse' | 'hero'
}

/**
 * Compose `CarouselDefaults`: `MinSmallItemSize = 40.dp`,
 * `MaxSmallItemSize = 56.dp`.
 */
export const SMALL_ITEM_MIN = 40
export const SMALL_ITEM_MAX = 56

interface Arrangement {
  large: number
  largeCount: number
  medium: number
  mediumCount: number
  small: number
  smallCount: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Scale the large and medium sizes so the arrangement fills `space`. Compose
 * `Arrangement.fit`. The medium size stays the mean of the large and small
 * sizes; the small size is fixed.
 */
function fit(
  space: number,
  gap: number,
  small: number,
  largeCount: number,
  mediumCount: number,
): Arrangement | null {
  const total = largeCount + mediumCount + 1
  const remaining = space - gap * (total - 1) - small
  const large =
    (remaining - (mediumCount * small) / 2) / (largeCount + mediumCount / 2)
  const medium = mediumCount > 0 ? (large + small) / 2 : 0
  if (large <= small || (mediumCount > 0 && medium <= small)) return null
  return { large, largeCount, medium, mediumCount, small, smallCount: 1 }
}

/** Large items only, when nothing else fits. */
function soloArrangement(
  space: number,
  target: number,
  count: number,
  gap: number,
): Arrangement {
  const largeCount = Math.max(
    1,
    Math.min(count, Math.floor((space + gap) / (target + gap))),
  )
  const large = Math.min(target, (space - gap * (largeCount - 1)) / largeCount)
  return {
    large,
    largeCount,
    medium: 0,
    mediumCount: 0,
    small: 0,
    smallCount: 0,
  }
}

/**
 * Pick the arrangement whose large size is nearest the preferred width.
 * Compose `Arrangement.findLowestCostArrangement` with the multi-browse
 * candidates: one small item, one or no medium item, and as many large items
 * as fit. A tie goes to the arrangement with no medium item.
 */
function multiBrowseArrangement(
  space: number,
  target: number,
  gap: number,
  count: number,
): Arrangement {
  const small = clamp(target / 3, SMALL_ITEM_MIN, SMALL_ITEM_MAX)
  const maxLarge = Math.max(1, Math.floor((space + gap) / (target + gap)))
  let best: Arrangement | null = null
  let bestCost = Infinity
  for (const mediumCount of [0, 1]) {
    for (let largeCount = 1; largeCount <= maxLarge; largeCount++) {
      if (largeCount + mediumCount + 1 > count) continue
      const candidate = fit(space, gap, small, largeCount, mediumCount)
      if (candidate === null) continue
      const cost = Math.abs(candidate.large - target)
      if (cost < bestCost) {
        best = candidate
        bestCost = cost
      }
    }
  }
  return best ?? soloArrangement(space, target, count, gap)
}

/** One large item and one small preview. */
function heroArrangement(
  space: number,
  gap: number,
  count: number,
): Arrangement {
  if (count < 2 || space < SMALL_ITEM_MAX * 3) {
    return {
      large: space,
      largeCount: 1,
      medium: 0,
      mediumCount: 0,
      small: 0,
      smallCount: 0,
    }
  }
  return {
    large: space - gap - SMALL_ITEM_MAX,
    largeCount: 1,
    medium: 0,
    mediumCount: 0,
    small: SMALL_ITEM_MAX,
    smallCount: 1,
  }
}

function sizesOf(arrangement: Arrangement): number[] {
  const sizes: number[] = []
  for (let i = 0; i < arrangement.largeCount; i++) sizes.push(arrangement.large)
  for (let i = 0; i < arrangement.mediumCount; i++) {
    sizes.push(arrangement.medium)
  }
  for (let i = 0; i < arrangement.smallCount; i++) sizes.push(arrangement.small)
  return sizes
}

/**
 * Lay keylines of the given sizes from the start edge, with an anchor of
 * size 0 one gap outside each edge. An item that leaves at an edge shrinks
 * toward the anchor and keeps one gap from its neighbour the whole way.
 */
function keylineList(
  sizes: number[],
  large: number,
  gap: number,
  padding: number,
  space: number,
): Keyline[] {
  const list: Keyline[] = [
    { size: 0, offset: padding - gap, unadjustedOffset: 0, focal: false },
  ]
  let x = padding
  for (const size of sizes) {
    list.push({
      size,
      offset: x + size / 2,
      unadjustedOffset: 0,
      focal: size === large,
    })
    x += size + gap
  }
  list.push({
    size: 0,
    offset: padding + space + gap,
    unadjustedOffset: 0,
    focal: false,
  })
  const firstFocal = list.findIndex((keyline) => keyline.focal)
  const pivot = list[firstFocal].offset
  const slot = large + gap
  return list.map((keyline, index) => ({
    ...keyline,
    unadjustedOffset: pivot + (index - firstFocal) * slot,
  }))
}

/**
 * The next end step: the keyline after the last large one moves before the
 * large ones, kept in ascending size from the start edge. Compose
 * `getEndKeylineSteps`.
 */
function nextEndStep(sizes: number[], large: number): number[] | null {
  const lastFocal = sizes.lastIndexOf(large)
  if (lastFocal === sizes.length - 1) return null
  const moved = sizes[lastFocal + 1]
  const rest = sizes.filter((_, index) => index !== lastFocal + 1)
  const firstFocal = rest.indexOf(large)
  let insertAt = firstFocal
  for (let i = 0; i < firstFocal; i++) {
    if (rest[i] > moved) {
      insertAt = i
      break
    }
  }
  rest.splice(insertAt, 0, moved)
  return rest
}

/**
 * Build the strategy for a viewport, or `null` before the viewport is
 * measured or when there is nothing to show.
 */
export function buildStrategy(
  options: StrategyOptions,
): CarouselStrategy | null {
  const { viewport, itemWidth, gap, padding, count, layout } = options
  const space = viewport - padding * 2
  if (viewport <= 0 || space <= 0 || count <= 0) return null

  const target = Math.min(Math.max(itemWidth, 1), space)
  const fitsAll = count * target + (count - 1) * gap <= space
  const arrangement =
    layout === 'hero'
      ? heroArrangement(space, gap, count)
      : fitsAll
        ? soloArrangement(space, target, count, gap)
        : multiBrowseArrangement(space, target, gap, count)

  const large = arrangement.large
  const slot = large + gap
  const steps: Keyline[][] = []
  let sizes: number[] | null = sizesOf(arrangement)
  while (sizes !== null) {
    steps.push(keylineList(sizes, large, gap, padding, space))
    sizes = nextEndStep(sizes, large)
  }

  const defaultEnd = steps[0][steps[0].length - 1].unadjustedOffset
  const shifts = steps.map(
    (list) => defaultEnd - list[list.length - 1].unadjustedOffset,
  )

  const lastStep = steps[steps.length - 1]
  let lastFocalOffset = 0
  for (const keyline of lastStep) {
    if (keyline.focal) lastFocalOffset = keyline.offset
  }
  const lastSlotCenter = padding + (count - 1) * slot + large / 2
  const maxScroll = Math.max(0, lastSlotCenter - lastFocalOffset)

  const snapOffsets: number[] = []
  for (let i = 0; i < count; i++) {
    snapOffsets.push(Math.min(i * slot, maxScroll))
  }

  return {
    itemSize: large,
    smallSize: arrangement.small,
    gap,
    padding,
    steps: maxScroll > 0 ? steps : [steps[0]],
    shifts: maxScroll > 0 ? shifts : [0],
    maxScroll,
    snapOffsets,
    contentSize: viewport + maxScroll,
  }
}

export interface ItemPlacement {
  /** Visible width of the item. */
  size: number
  /** Center of the item from the physical start of the viewport. */
  center: number
}

function lerp(from: number, to: number, fraction: number): number {
  'worklet'
  return from + (to - from) * fraction
}

/**
 * Place item `index` for a scroll offset. Runs on the UI thread. The keyline
 * list is the default one, the end one, or a blend of two neighbouring steps
 * in the end region; the item then interpolates between the two keylines
 * around its slot center.
 */
export function placeItem(
  strategy: CarouselStrategy,
  index: number,
  scroll: number,
): ItemPlacement {
  'worklet'
  const { steps, shifts, maxScroll, itemSize, gap, padding } = strategy
  const lastShift = shifts[shifts.length - 1]
  const into = scroll - (maxScroll - lastShift)

  let from = steps[0]
  let to = steps[0]
  let fraction = 0
  if (steps.length > 1 && into > 0) {
    if (into >= lastShift) {
      from = steps[steps.length - 1]
      to = from
    } else {
      for (let k = 0; k < steps.length - 1; k++) {
        if (into >= shifts[k] && into <= shifts[k + 1]) {
          from = steps[k]
          to = steps[k + 1]
          fraction = (into - shifts[k]) / (shifts[k + 1] - shifts[k])
          break
        }
      }
    }
  }

  const center = padding + index * (itemSize + gap) + itemSize / 2 - scroll
  const last = from.length - 1
  const unadjusted: number[] = []
  const sizes: number[] = []
  const offsets: number[] = []
  for (let k = 0; k <= last; k++) {
    unadjusted.push(
      lerp(from[k].unadjustedOffset, to[k].unadjustedOffset, fraction),
    )
    sizes.push(lerp(from[k].size, to[k].size, fraction))
    offsets.push(lerp(from[k].offset, to[k].offset, fraction))
  }

  if (center <= unadjusted[0]) return { size: sizes[0], center: offsets[0] }
  if (center >= unadjusted[last]) {
    return { size: sizes[last], center: offsets[last] }
  }
  let before = 0
  while (before < last && unadjusted[before + 1] <= center) before++
  const after = before + 1
  const t =
    (center - unadjusted[before]) / (unadjusted[after] - unadjusted[before])
  return {
    size: lerp(sizes[before], sizes[after], t),
    center: lerp(offsets[before], offsets[after], t),
  }
}

/**
 * The item nearest to the first large keyline at a scroll offset. At the end
 * of the content two items can share one snap offset; the later one wins.
 */
export function indexAtScroll(snapOffsets: number[], scroll: number): number {
  'worklet'
  let nearest = 0
  for (let i = 1; i < snapOffsets.length; i++) {
    if (
      Math.abs(snapOffsets[i] - scroll) <=
      Math.abs(snapOffsets[nearest] - scroll)
    ) {
      nearest = i
    }
  }
  return nearest
}
