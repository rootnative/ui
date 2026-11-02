/**
 * react-native-web drops `snapToOffsets`, so a `Carousel` on the web did not
 * snap: a short trackpad swipe stopped between two items. The carousel now
 * puts CSS scroll snap on its scroll view, with one marker node at each snap
 * offset and one at the end of the content, as native `snapToEnd` does.
 *
 * jsdom computes no scroll and no layout, so these tests read the styles that
 * make the snap. The snap itself was checked in Chromium.
 *
 * react-native-web writes an inline `start` as `left` whatever the document
 * direction is, so the markers take the physical side, and RTL needs its own
 * case here.
 */
import { act, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { Carousel } from '../../carousel'
import type { CarouselItemInfo, CarouselProps } from '../../carousel'
import { buildStrategy } from '../../carousel/strategy'
import { renderWeb } from './render-web'

afterEach(() => {
  document.documentElement.removeAttribute('dir')
})

const PLACES = ['Cabin', 'Shore', 'Ridge', 'Dunes', 'Falls', 'Harbor']
const renderPlace = ({ item }: CarouselItemInfo<string>) => <Text>{item}</Text>

const strategy = buildStrategy({
  viewport: 380,
  itemWidth: 186,
  gap: 8,
  padding: 16,
  count: PLACES.length,
  layout: 'multi-browse',
})
const distinctOffsets = [...new Set(strategy?.snapOffsets ?? [])]

function renderLaidOut(props?: Partial<CarouselProps<string>>) {
  renderWeb(
    <Carousel
      items={PLACES}
      renderItem={renderPlace}
      contentPadding={16}
      testID="carousel"
      {...props}
    />,
  )
  const root = screen.getByTestId('carousel') as Element & {
    __reactLayoutHandler?: (event: unknown) => void
  }
  act(() => {
    root.__reactLayoutHandler?.({
      nativeEvent: { layout: { x: 0, y: 0, width: 380, height: 360 } },
    })
  })
  const scroller = screen.getByTestId('carousel-scroll')
  const snapNodes = [...scroller.querySelectorAll<HTMLElement>('*')].filter(
    (node) => getComputedStyle(node).getPropertyValue('scroll-snap-align'),
  )
  const align = (node: HTMLElement) =>
    getComputedStyle(node).getPropertyValue('scroll-snap-align')
  return {
    scroller,
    starts: snapNodes.filter((node) => align(node) === 'start'),
    ends: snapNodes.filter((node) => align(node) === 'end'),
  }
}

const px = (value: string) => Number.parseFloat(value)

describe('Carousel scroll snap on the web', () => {
  it('snaps the scroll view on the x axis', () => {
    const { scroller } = renderLaidOut()
    expect(
      getComputedStyle(scroller).getPropertyValue('scroll-snap-type'),
    ).toBe('x mandatory')
  })

  it('puts a start marker at each snap offset, from the left in LTR', () => {
    const { starts, ends } = renderLaidOut()
    expect(distinctOffsets.length).toBeGreaterThan(2)
    expect(starts.map((node) => px(node.style.left))).toEqual(distinctOffsets)
    expect(starts.every((node) => node.style.right === '')).toBe(true)
    expect(ends).toHaveLength(1)
    expect(ends[0]?.style.right).toBe('0px')
  })

  it('measures the markers from the right under dir="rtl"', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const { starts, ends } = renderLaidOut()
    expect(starts.map((node) => px(node.style.right))).toEqual(distinctOffsets)
    expect(starts.every((node) => node.style.left === '')).toBe(true)
    expect(ends[0]?.style.left).toBe('0px')
  })

  it('snaps on the y axis, with markers from the top, when vertical', () => {
    const { scroller, starts, ends } = renderLaidOut({
      variant: 'full-screen',
    })
    expect(
      getComputedStyle(scroller).getPropertyValue('scroll-snap-type'),
    ).toBe('y mandatory')
    const tops = starts.map((node) => px(node.style.top))
    expect(tops[0]).toBe(0)
    expect(tops.length).toBeGreaterThan(1)
    expect(tops).toEqual([...tops].sort((a, b) => a - b))
    expect(starts.every((node) => node.style.left === '')).toBe(true)
    expect(ends[0]?.style.bottom).toBe('0px')
  })
})
