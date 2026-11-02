import { lightTheme } from '@rootnative/core'
import { renderSettled } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { createRef } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import type { ReactTestInstance } from 'react-test-renderer'
import { Carousel } from '../carousel'
import type { CarouselItemInfo, CarouselRef } from '../carousel'
import { buildStrategy } from '../carousel/strategy'

const PLACES = ['Cabin', 'Shore', 'Ridge', 'Dunes', 'Falls', 'Harbor']
const VIEWPORT = 380
const PADDING = 16
const GAP = 8

const renderPlace = ({ item }: CarouselItemInfo<string>) => <Text>{item}</Text>

type Props = Partial<React.ComponentProps<typeof Carousel<string>>>

function renderCarousel(props?: Props) {
  const result = renderSettled(
    <Carousel
      items={PLACES}
      renderItem={renderPlace}
      contentPadding={PADDING}
      testID="carousel"
      {...props}
    />,
  )
  return result
}

/** Give the carousel its box. The items render only after this. */
function layOut(width = VIEWPORT, height = 205, flush?: () => void) {
  fireEvent(screen.getByTestId('carousel'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
  })
  flush?.()
}

function strategyFor(count = PLACES.length) {
  const strategy = buildStrategy({
    viewport: VIEWPORT,
    itemWidth: 186,
    gap: GAP,
    padding: PADDING,
    count,
    layout: 'multi-browse',
  })
  if (strategy === null) throw new Error('no strategy')
  return strategy
}

const flat = (node: ReactTestInstance) => StyleSheet.flatten(node.props.style)

/**
 * The mask above an item container: the nearest ancestor that clips and has
 * a numeric width. The slot above it has the nominal width.
 */
function maskOf(index: number) {
  let node: ReactTestInstance | null = screen.getByTestId(
    `carousel-item-${index}`,
  ).parent
  while (node !== null) {
    const style = flat(node)
    if (
      style?.overflow === 'hidden' &&
      typeof style.width === 'number' &&
      style.transform !== undefined
    ) {
      return node
    }
    node = node.parent
  }
  throw new Error(`no mask above item ${index}`)
}

function slotOf(index: number) {
  let node: ReactTestInstance | null = screen.getByTestId(
    `carousel-item-${index}`,
  ).parent
  while (node !== null) {
    const style = flat(node)
    if (style?.flexDirection === 'row' && style.width !== undefined) {
      return node
    }
    node = node.parent
  }
  throw new Error(`no slot above item ${index}`)
}

function translateXOf(node: ReactTestInstance) {
  const transform = flat(node).transform as Array<{ translateX?: number }>
  return transform.find((part) => part.translateX !== undefined)?.translateX
}

/** Move the scroll offset, then render so the front item reaction runs. */
function scrollToOffset(x: number, flush: () => void) {
  fireEvent(screen.getByTestId('carousel-scroll'), 'scroll', {
    nativeEvent: { contentOffset: { x, y: 0 } },
  })
  flush()
}

/** The `scrollTo` of the mocked ScrollView, shared by every instance. */
function scrollToSpy() {
  const scrollTo = jest.spyOn(
    ScrollView.prototype as unknown as { scrollTo: () => void },
    'scrollTo',
  )
  scrollTo.mockClear()
  return scrollTo
}

function controlled(index: number, onIndexChange: (index: number) => void) {
  return (
    <Carousel
      items={PLACES}
      renderItem={renderPlace}
      contentPadding={PADDING}
      testID="carousel"
      index={index}
      onIndexChange={onIndexChange}
    />
  )
}

describe('Carousel', () => {
  it('renders no item before it is measured', () => {
    renderCarousel()
    expect(screen.queryByText('Cabin')).toBeNull()
  })

  it('renders every item once it has a width', () => {
    const { flush } = renderCarousel()
    layOut(VIEWPORT, 205, flush)
    for (const place of PLACES) {
      expect(screen.getByText(place)).toBeTruthy()
    }
  })

  it('gives every slot the large width and the item height', () => {
    const { flush } = renderCarousel({ itemHeight: 180 })
    layOut(VIEWPORT, 180, flush)
    const strategy = strategyFor()
    const style = flat(slotOf(2))
    expect(style.width).toBeCloseTo(strategy.itemSize)
    expect(style.height).toBe(180)
  })

  it('masks the items to the keyline sizes at rest', () => {
    const { flush } = renderCarousel()
    layOut(VIEWPORT, 205, flush)
    const strategy = strategyFor()
    const sizes = strategy.steps[0]
      .filter((keyline) => keyline.size > 0)
      .map((keyline) => keyline.size)

    expect(flat(maskOf(0)).width).toBeCloseTo(sizes[0])
    expect(flat(maskOf(1)).width).toBeCloseTo(sizes[1])
    expect(flat(maskOf(2)).width).toBeCloseTo(sizes[2])
    expect(flat(maskOf(3)).width).toBeCloseTo(0)
  })

  it('moves a shrunk item back toward the start of its slot', () => {
    const { flush } = renderCarousel()
    layOut(VIEWPORT, 205, flush)
    const strategy = strategyFor()
    const medium = strategy.steps[0][2]
    const slotLeft = PADDING + strategy.itemSize + GAP
    const expected = medium.offset - medium.size / 2 - slotLeft
    expect(translateXOf(maskOf(1))).toBeCloseTo(expected)
  })

  it('mirrors the mask offsets in RTL', () => {
    const rtl = jest.requireActual('react-native').I18nManager
    const wasRTL = rtl.isRTL
    rtl.isRTL = true
    try {
      const { flush } = renderCarousel()
      layOut(VIEWPORT, 205, flush)
      const strategy = strategyFor()
      const medium = strategy.steps[0][2]
      const slotLeft = PADDING + strategy.itemSize + GAP
      const expected = -(medium.offset - medium.size / 2 - slotLeft)
      expect(translateXOf(maskOf(1))).toBeCloseTo(expected)
    } finally {
      rtl.isRTL = wasRTL
    }
  })

  it('clips every item to the extra-large corner on the item color', () => {
    const { flush } = renderCarousel()
    layOut(VIEWPORT, 205, flush)
    const style = flat(screen.getByTestId('carousel-item-0'))
    expect(style.borderRadius).toBe(lightTheme.shape.cornerExtraLarge)
    expect(style.overflow).toBe('hidden')
    expect(style.backgroundColor).toBe(
      lightTheme.colors.surfaceContainerHighest,
    )
  })

  it('containerColor recolors the item container', () => {
    const { flush } = renderCarousel({ containerColor: '#123456' })
    layOut(VIEWPORT, 205, flush)
    expect(flat(screen.getByTestId('carousel-item-0')).backgroundColor).toBe(
      '#123456',
    )
  })

  it('snaps one item to the large position', () => {
    const { flush } = renderCarousel()
    layOut(VIEWPORT, 205, flush)
    const strategy = strategyFor()
    expect(screen.getByTestId('carousel-scroll').props.snapToOffsets).toEqual(
      strategy.snapOffsets,
    )
  })

  it('uncontained keeps one width and no mask', () => {
    const { flush } = renderCarousel({ variant: 'uncontained', itemWidth: 240 })
    layOut(VIEWPORT, 205, flush)
    expect(flat(slotOf(0)).width).toBe(240)
    expect(flat(slotOf(5)).width).toBe(240)
    expect(() => maskOf(0)).toThrow()
  })

  it('uncontained caps the item at the width inside the padding', () => {
    const { flush } = renderCarousel({ variant: 'uncontained', itemWidth: 900 })
    layOut(VIEWPORT, 205, flush)
    expect(flat(slotOf(0)).width).toBe(VIEWPORT - PADDING * 2)
  })

  it('full-screen scrolls vertically, one viewport per item', () => {
    const { flush } = renderCarousel({ variant: 'full-screen' })
    layOut(VIEWPORT, 600, flush)
    const scroll = screen.getByTestId('carousel-scroll')
    expect(scroll.props.horizontal).toBe(false)
    let node: ReactTestInstance | null =
      screen.getByTestId('carousel-item-0').parent
    while (node !== null && flat(node)?.height === undefined) {
      node = node.parent
    }
    expect(node).not.toBeNull()
    expect(flat(node as ReactTestInstance).height).toBe(600 - PADDING * 2)
  })

  it('full-screen takes its height from style, not itemHeight', () => {
    renderCarousel({ variant: 'full-screen', style: { height: 500 } })
    const style = flat(screen.getByTestId('carousel'))
    expect(style.height).toBe(500)
  })

  it('horizontal variants take itemHeight as the carousel height', () => {
    renderCarousel({ itemHeight: 240 })
    expect(flat(screen.getByTestId('carousel')).height).toBe(240)
  })

  it('reports the first large item as a scroll moves', () => {
    const onIndexChange = jest.fn()
    const { flush } = renderCarousel({ onIndexChange })
    layOut(VIEWPORT, 205, flush)
    const strategy = strategyFor()

    scrollToOffset(strategy.snapOffsets[2] + 3, flush)
    expect(onIndexChange).toHaveBeenCalledWith(2)

    scrollToOffset(strategy.snapOffsets[2] - 3, flush)
    expect(onIndexChange).toHaveBeenCalledTimes(1)

    scrollToOffset(strategy.maxScroll, flush)
    expect(onIndexChange).toHaveBeenLastCalledWith(5)
  })

  it('reads a negative RTL web offset from the start', () => {
    const onIndexChange = jest.fn()
    const { flush } = renderCarousel({ onIndexChange })
    layOut(VIEWPORT, 205, flush)

    scrollToOffset(-strategyFor().snapOffsets[3], flush)
    expect(onIndexChange).toHaveBeenCalledWith(3)
  })

  it('does not report the default index at mount', () => {
    const onIndexChange = jest.fn()
    const { flush } = renderCarousel({ onIndexChange, defaultIndex: 2 })
    layOut(VIEWPORT, 205, flush)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('scrollToIndex moves the carousel and reports the index', () => {
    const onIndexChange = jest.fn()
    const ref = createRef<CarouselRef>()
    const { flush } = renderCarousel({ onIndexChange, ref })
    layOut(VIEWPORT, 205, flush)
    const { snapOffsets } = strategyFor()
    const scrollTo = scrollToSpy()

    ref.current?.scrollToIndex(3)
    expect(scrollTo).toHaveBeenLastCalledWith({
      x: snapOffsets[3],
      animated: true,
    })
    expect(onIndexChange).toHaveBeenCalledWith(3)

    ref.current?.scrollToIndex(99)
    expect(onIndexChange).toHaveBeenLastCalledWith(5)
  })

  it('a scrollToIndex scroll reports its item once, not the items it passes', () => {
    const onIndexChange = jest.fn()
    const ref = createRef<CarouselRef>()
    const { flush } = renderCarousel({ onIndexChange, ref })
    layOut(VIEWPORT, 205, flush)
    const { snapOffsets } = strategyFor()

    ref.current?.scrollToIndex(4)
    for (const step of [1, 2, 3, 4]) scrollToOffset(snapOffsets[step], flush)
    expect(onIndexChange.mock.calls).toEqual([[4]])

    scrollToOffset(snapOffsets[2], flush)
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('a step away from the landing item reports again', () => {
    const onIndexChange = jest.fn()
    const ref = createRef<CarouselRef>()
    const { flush } = renderCarousel({ onIndexChange, ref })
    layOut(VIEWPORT, 205, flush)
    const { snapOffsets } = strategyFor()

    ref.current?.scrollToIndex(4)
    scrollToOffset(snapOffsets[2], flush)
    expect(onIndexChange.mock.calls).toEqual([[4]])

    scrollToOffset(snapOffsets[1], flush)
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
  })

  it('a drag that starts during a scrollToIndex scroll reports again', () => {
    const onIndexChange = jest.fn()
    const ref = createRef<CarouselRef>()
    const { flush } = renderCarousel({ onIndexChange, ref })
    layOut(VIEWPORT, 205, flush)
    const { snapOffsets } = strategyFor()

    ref.current?.scrollToIndex(4)
    fireEvent(screen.getByTestId('carousel-scroll'), 'scrollBeginDrag')
    scrollToOffset(snapOffsets[2], flush)
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('a controlled index change scrolls and reports the new index', () => {
    const onIndexChange = jest.fn()
    const { flush, rerender } = renderSettled(controlled(0, onIndexChange))
    layOut(VIEWPORT, 205, flush)
    const scrollTo = scrollToSpy()

    rerender(controlled(4, onIndexChange))
    expect(scrollTo).toHaveBeenLastCalledWith({
      x: strategyFor().snapOffsets[4],
      animated: true,
    })
    expect(onIndexChange).toHaveBeenCalledWith(4)
  })

  it('a controlled index that echoes a report does not scroll', () => {
    const onIndexChange = jest.fn()
    const { flush, rerender } = renderSettled(controlled(0, onIndexChange))
    layOut(VIEWPORT, 205, flush)
    const scrollTo = scrollToSpy()

    scrollToOffset(strategyFor().snapOffsets[2], flush)
    expect(onIndexChange).toHaveBeenLastCalledWith(2)

    rerender(controlled(2, onIndexChange))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('keeps a second controlled change while the first one scrolls', () => {
    const onIndexChange = jest.fn()
    const { flush, rerender } = renderSettled(controlled(0, onIndexChange))
    layOut(VIEWPORT, 205, flush)
    const { snapOffsets } = strategyFor()
    const scrollTo = scrollToSpy()

    rerender(controlled(1, onIndexChange))
    rerender(controlled(2, onIndexChange))
    // The scroll to item 2 passes item 1.
    scrollToOffset(snapOffsets[1], flush)

    expect(onIndexChange.mock.calls).toEqual([[1], [2]])
    expect(scrollTo).toHaveBeenLastCalledWith({
      x: snapOffsets[2],
      animated: true,
    })
  })

  it('onItemPress makes every item a named button', () => {
    const onItemPress = jest.fn()
    const { flush } = renderCarousel({
      onItemPress,
      itemAccessibilityLabel: (place) => `Open ${place}`,
    })
    layOut(VIEWPORT, 205, flush)

    fireEvent.press(screen.getByRole('button', { name: 'Open Shore' }))
    expect(onItemPress).toHaveBeenCalledWith('Shore', 1)
    expect(screen.getAllByRole('button')).toHaveLength(PLACES.length)
  })

  it('items are plain containers without onItemPress', () => {
    const { flush } = renderCarousel()
    layOut(VIEWPORT, 205, flush)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('gives the item content a progress value that is 1 on a fixed-size item', () => {
    const seen: number[] = []
    const { flush } = renderCarousel({
      variant: 'uncontained',
      renderItem: ({ item, progress }) => {
        seen.push(progress.value)
        return <Text>{item}</Text>
      },
    })
    layOut(VIEWPORT, 205, flush)
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((value) => value === 1)).toBe(true)
  })

  it('progress is 1 on a large item and 0 on a small one at rest', () => {
    const seen = new Map<string, number>()
    const { flush } = renderCarousel({
      renderItem: ({ item, progress }) => {
        seen.set(item, progress.value)
        return <Text>{item}</Text>
      },
    })
    layOut(VIEWPORT, 205, flush)
    expect(seen.get('Cabin')).toBeCloseTo(1)
    expect(seen.get('Ridge')).toBeCloseTo(0)
    const medium = seen.get('Shore') ?? -1
    expect(medium).toBeGreaterThan(0)
    expect(medium).toBeLessThan(1)
  })

  it('uses keyExtractor for the item keys', () => {
    const keyExtractor = jest.fn((place: string) => `key-${place}`)
    const { flush } = renderCarousel({ keyExtractor })
    layOut(VIEWPORT, 205, flush)
    expect(keyExtractor).toHaveBeenCalledWith('Cabin', 0)
  })

  it('passes the rest of the view props to the root', () => {
    renderCarousel({ nativeID: 'probe', accessibilityLabel: 'Places' })
    const root = screen.getByTestId('carousel')
    expect(root.props.nativeID).toBe('probe')
    expect(root.props.accessibilityLabel).toBe('Places')
  })
})
