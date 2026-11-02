import {
  SMALL_ITEM_MAX,
  buildStrategy,
  indexAtScroll,
  placeItem,
} from '../carousel/strategy'
import type { CarouselStrategy } from '../carousel/strategy'

const GAP = 8
const PADDING = 16

function strategyFor(
  viewport: number,
  count = 6,
  layout: 'multi-browse' | 'hero' = 'multi-browse',
  itemWidth = 186,
) {
  const strategy = buildStrategy({
    viewport,
    itemWidth,
    gap: GAP,
    padding: PADDING,
    count,
    layout,
  })
  if (strategy === null) throw new Error('no strategy')
  return strategy
}

/** The visible items at a scroll offset, as `[left, right]` edges in order. */
function visibleEdges(
  strategy: CarouselStrategy,
  count: number,
  scroll: number,
) {
  const edges: Array<[number, number]> = []
  for (let index = 0; index < count; index++) {
    const { size, center } = placeItem(strategy, index, scroll)
    if (size > 0.5) edges.push([center - size / 2, center + size / 2])
  }
  return edges
}

/** Each visible item is one gap from the next, within rounding. */
function expectGapsOf(edges: Array<[number, number]>, gap: number) {
  for (let i = 1; i < edges.length; i++) {
    expect(edges[i][0] - edges[i - 1][1]).toBeCloseTo(gap, 5)
  }
}

describe('carousel strategy', () => {
  it('fits a large, a medium and a small item on a 380dp compact width', () => {
    const strategy = strategyFor(380)
    const sizes = strategy.steps[0]
      .filter((keyline) => keyline.size > 0)
      .map((keyline) => Math.round(keyline.size))
    expect(sizes).toEqual([165, 111, 56])
    expect(strategy.smallSize).toBe(SMALL_ITEM_MAX)
  })

  it('fills the width from the padding to the padding at rest', () => {
    const strategy = strategyFor(380)
    const edges = visibleEdges(strategy, 6, 0)
    expect(edges[0][0]).toBeCloseTo(PADDING)
    expect(edges[edges.length - 1][1]).toBeCloseTo(380 - PADDING)
    expectGapsOf(edges, GAP)
  })

  it('keeps one gap between items in the middle of a swipe', () => {
    const strategy = strategyFor(380)
    const edges = visibleEdges(strategy, 6, strategy.snapOffsets[1] / 2)
    expectGapsOf(edges, GAP)
    expect(edges.length).toBe(4)
  })

  it('shows the next item large after one snap', () => {
    const strategy = strategyFor(380)
    const first = placeItem(strategy, 1, strategy.snapOffsets[1])
    expect(first.size).toBeCloseTo(strategy.itemSize)
    expect(first.center - first.size / 2).toBeCloseTo(PADDING)
    expect(placeItem(strategy, 0, strategy.snapOffsets[1]).size).toBe(0)
  })

  it('ends with the last item large at the end edge and a small item first', () => {
    const strategy = strategyFor(380)
    const edges = visibleEdges(strategy, 6, strategy.maxScroll)
    expect(edges[0][0]).toBeCloseTo(PADDING)
    expect(edges[0][1] - edges[0][0]).toBeCloseTo(SMALL_ITEM_MAX)
    const last = placeItem(strategy, 5, strategy.maxScroll)
    expect(last.size).toBeCloseTo(strategy.itemSize)
    expect(last.center + last.size / 2).toBeCloseTo(380 - PADDING)
    expectGapsOf(edges, GAP)
  })

  it('keeps the gaps while the end steps blend', () => {
    const strategy = strategyFor(380)
    const edges = visibleEdges(strategy, 6, strategy.maxScroll - 20)
    expectGapsOf(edges, GAP)
    expect(edges[0][0]).toBeCloseTo(PADDING)
    expect(edges[edges.length - 1][1]).toBeCloseTo(380 - PADDING)
  })

  it('sizes the content to the viewport plus the scroll range', () => {
    const strategy = strategyFor(380)
    const slot = strategy.itemSize + GAP
    const flowWidth = PADDING * 2 + 6 * strategy.itemSize + 5 * GAP
    expect(strategy.contentSize).toBeCloseTo(flowWidth)
    expect(strategy.snapOffsets[1]).toBeCloseTo(slot)
    expect(strategy.snapOffsets[5]).toBeCloseTo(strategy.maxScroll)
  })

  it('shows more large items on a wide viewport', () => {
    const strategy = strategyFor(900)
    const large = strategy.steps[0].filter((keyline) => keyline.focal)
    expect(large.length).toBe(4)
    expect(strategy.smallSize).toBe(SMALL_ITEM_MAX)
  })

  it('does not step or scroll when every item fits', () => {
    const strategy = strategyFor(380, 2, 'multi-browse', 100)
    expect(strategy.maxScroll).toBe(0)
    expect(strategy.steps).toHaveLength(1)
    expect(strategy.itemSize).toBe(100)
    expect(strategy.smallSize).toBe(0)
    expect(placeItem(strategy, 1, 0).size).toBe(100)
  })

  it('hero shows one large item and a 56dp preview', () => {
    const strategy = strategyFor(380, 6, 'hero')
    const sizes = strategy.steps[0]
      .filter((keyline) => keyline.size > 0)
      .map((keyline) => keyline.size)
    expect(sizes).toEqual([
      380 - PADDING * 2 - GAP - SMALL_ITEM_MAX,
      SMALL_ITEM_MAX,
    ])
  })

  it('hero with one item fills the width', () => {
    const strategy = strategyFor(380, 1, 'hero')
    expect(strategy.itemSize).toBe(380 - PADDING * 2)
    expect(strategy.maxScroll).toBe(0)
  })

  it('returns null before the viewport is measured or with no items', () => {
    expect(
      buildStrategy({
        viewport: 0,
        itemWidth: 186,
        gap: GAP,
        padding: PADDING,
        count: 3,
        layout: 'multi-browse',
      }),
    ).toBeNull()
    expect(
      buildStrategy({
        viewport: 380,
        itemWidth: 186,
        gap: GAP,
        padding: PADDING,
        count: 0,
        layout: 'multi-browse',
      }),
    ).toBeNull()
  })

  it('indexAtScroll picks the nearest snap, and the later item on a tie', () => {
    expect(indexAtScroll([0, 200, 400], 90)).toBe(0)
    expect(indexAtScroll([0, 200, 400], 110)).toBe(1)
    expect(indexAtScroll([0, 200, 342, 342], 342)).toBe(3)
  })
})
