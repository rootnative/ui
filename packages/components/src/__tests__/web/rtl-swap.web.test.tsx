/**
 * A web runtime can follow the React Native rule for `left` and `right`. It
 * has `I18nManager.doLeftAndRightSwapInRTL`, and while the flag is on it
 * applies `left` to the start side, which is the right side in RTL.
 * react-native-web has no flag and keeps both sides physical, so the
 * components mirror a physical side by hand there. On a runtime that swaps,
 * that second mirror moved each side back: the Slider filled from the left,
 * and a connected ButtonGroup rounded its inner corners.
 *
 * These tests run on react-native-web with the flag added to its
 * `I18nManager`. react-native-web doesn't swap, so the DOM shows the side that
 * a component writes. A runtime that swaps moves a `left` here to the right
 * side, so each RTL case expects the side of LTR, with no mirror by hand.
 */
import { lightTheme } from '@rootnative/core'
import {
  resolveLogical,
  resolveLogicalKey,
  swapsLeftAndRight,
  webKeepsPhysicalSides,
} from '@rootnative/utils'
import { act, screen } from '@testing-library/react'
import { I18nManager, Text } from 'react-native'
import { ButtonGroup } from '../../button-group'
import { Carousel } from '../../carousel'
import type { CarouselItemInfo } from '../../carousel'
import { resolveAnimatedInsetKey } from '../../internal/resolveAnimatedInsetKey'
import { resolveLogicalCornerKey } from '../../internal/resolveLogicalCornerKey'
import { LinearProgress } from '../../progress/LinearProgress'
import { physicalLeftStyle, sideEdgesOfStyleKeys } from '../../safe-area'
import { Slider } from '../../slider'
import { Tabs } from '../../tabs'
import { renderWeb } from './render-web'

const i18n = I18nManager as unknown as { doLeftAndRightSwapInRTL?: boolean }

function setSwapFlag(value: boolean) {
  i18n.doLeftAndRightSwapInRTL = value
}

function setRTL() {
  document.documentElement.setAttribute('dir', 'rtl')
}

/**
 * The document and the `I18nManager` object are shared across tests in a
 * file, so a leaked flag or `dir` changes each later test. Always clear both.
 */
afterEach(() => {
  delete i18n.doLeftAndRightSwapInRTL
  document.documentElement.removeAttribute('dir')
})

function fireLayout(node: Element, width: number) {
  const handler = (node as Element & { __reactLayoutHandler?: unknown })
    .__reactLayoutHandler
  if (typeof handler !== 'function') {
    throw new Error('react-native-web set no layout handler on the node')
  }
  act(() => {
    handler({ nativeEvent: { layout: { x: 0, y: 0, width, height: 48 } } })
  })
}

describe('the side helpers read the flag of the runtime', () => {
  it('see no swap on react-native-web, which has no flag', () => {
    setRTL()
    expect(swapsLeftAndRight()).toBe(false)
    expect(webKeepsPhysicalSides()).toBe(true)
  })

  it('see a swap under dir="rtl" while the flag is on', () => {
    setSwapFlag(true)
    setRTL()
    expect(swapsLeftAndRight()).toBe(true)
    expect(webKeepsPhysicalSides()).toBe(false)
  })

  it('see no swap in LTR', () => {
    setSwapFlag(true)
    expect(swapsLeftAndRight()).toBe(false)
    expect(webKeepsPhysicalSides()).toBe(false)
  })

  it('keep the sides physical while the flag is off', () => {
    setSwapFlag(false)
    setRTL()
    expect(swapsLeftAndRight()).toBe(false)
    expect(webKeepsPhysicalSides()).toBe(true)
    expect(resolveLogicalKey('start')).toBe('right')
  })
})

describe('a runtime that swaps gets each key with no mirror under dir="rtl"', () => {
  beforeEach(() => {
    setSwapFlag(true)
    setRTL()
  })

  it('keeps the logical key of a one-sided inset', () => {
    expect(resolveLogicalKey('start')).toBe('start')
    expect(resolveLogical('marginEnd', 8)).toEqual({ marginEnd: 8 })
  })

  it('keeps the logical key of a corner', () => {
    expect(resolveLogicalCornerKey('borderTopStartRadius')).toBe(
      'borderTopStartRadius',
    )
  })

  it('gives an animated start inset the left key', () => {
    expect(resolveAnimatedInsetKey('start')).toBe('left')
    expect(resolveAnimatedInsetKey('end')).toBe('right')
  })

  it('puts a measured offset from the left edge into right', () => {
    expect(sideEdgesOfStyleKeys()).toEqual(['right', 'left'])
    expect(physicalLeftStyle(40)).toEqual({ right: 40 })
  })
})

/**
 * The thumb controls of a range Slider sit at the position of each value,
 * from `left`. On react-native-web in RTL the Slider mirrors each position by
 * hand. On a runtime that swaps, the platform mirrors it.
 */
describe('Slider mirrors the thumbs by hand only where the sides stay physical', () => {
  function thumbLefts() {
    const view = renderWeb(
      <Slider
        accessibilityLabel="Price"
        defaultValue={[20, 70]}
        minimumValue={0}
        maximumValue={100}
      />,
    )
    const track = [...view.container.querySelectorAll('*')].find(
      (node) =>
        typeof (node as Element & { __reactLayoutHandler?: unknown })
          .__reactLayoutHandler === 'function',
    )
    if (!track) throw new Error('the Slider set no layout handler')
    fireLayout(track, 300)
    const lefts = ['Price, Minimum', 'Price, Maximum'].map(
      (label) => screen.getByLabelText(label).style.left,
    )
    view.unmount()
    return lefts
  }

  it('on react-native-web and on a runtime that swaps', () => {
    const ltr = thumbLefts()
    expect(ltr.every((left) => left !== '')).toBe(true)

    setRTL()
    const byHand = thumbLefts()
    expect(byHand).not.toEqual(ltr)

    setSwapFlag(true)
    expect(thumbLefts()).toEqual(ltr)
  })
})

describe('LinearProgress leaves the mirror of each left to a runtime that swaps', () => {
  beforeEach(() => {
    setSwapFlag(true)
    setRTL()
  })

  function partsOf(bar: React.ReactElement) {
    renderWeb(bar)
    const root = screen.getByTestId('linear')
    fireLayout(root, 200)
    return Array.from(root.children) as HTMLElement[]
  }

  // The values of the LTR case in `rtl.web.test.tsx`.
  it('places the determinate bar as in LTR', () => {
    const [active, inactive, stop] = partsOf(
      <LinearProgress progress={0.25} testID="linear" />,
    )
    expect([active?.style.left, active?.style.width]).toEqual(['0px', '47px'])
    expect([inactive?.style.left, inactive?.style.width]).toEqual([
      '51px',
      '141px',
    ])
    expect([stop?.style.left, stop?.style.right]).toEqual(['', '0px'])
  })

  it('places the indeterminate segment as in LTR', () => {
    const [, segment] = partsOf(<LinearProgress testID="linear" />)
    expect(segment?.style.left).toBe('0px')
  })

  // A path is physical on each runtime, so the wave still flips.
  it('still flips the wave', () => {
    const [wave] = partsOf(
      <LinearProgress progress={0.5} wavy testID="linear" />,
    )
    expect(wave?.style.transform).toBe('scaleX(-1)')
  })
})

describe('ButtonGroup leaves the corners of a connected group to a runtime that swaps', () => {
  it('rounds the outer corners as in LTR under dir="rtl"', () => {
    setSwapFlag(true)
    setRTL()
    renderWeb(
      <ButtonGroup
        variant="connected"
        items={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
      />,
    )
    let node = screen.getByText('Day') as HTMLElement | null
    while (node && !node.style.borderTopLeftRadius) node = node.parentElement
    const style = (node as HTMLElement).style
    expect([style.borderTopLeftRadius, style.borderBottomLeftRadius]).toEqual([
      `${lightTheme.shape.cornerFull}px`,
      `${lightTheme.shape.cornerFull}px`,
    ])
  })
})

/**
 * The indicator moves with a physical `translateX` from the physical left
 * edge. The edge is `right: 0` where the platform applies `left` to the right
 * side.
 */
describe('Tabs anchors the indicator for a runtime that swaps', () => {
  it('at right: 0 under dir="rtl", with the offset from the right edge', () => {
    setSwapFlag(true)
    setRTL()
    const items = [
      { value: 'flights', label: 'Flights' },
      { value: 'trips', label: 'Trips' },
      { value: 'explore', label: 'Explore' },
    ]
    renderWeb(
      <Tabs
        items={items}
        testID="tabs"
        scrollable
        edgePadding={16}
        defaultValue="trips"
      />,
    )
    const tabs = screen.getAllByRole('tab')
    for (const [index, tab] of tabs.entries()) {
      fireLayout(tab, 120)
      const label = screen.getByText(items[index]?.label ?? '')
      fireLayout(label.parentElement as HTMLElement, 40)
    }
    fireLayout(tabs[0]?.parentElement as HTMLElement, 500)
    const indicator = screen.getByTestId('tabs-indicator')
    expect([indicator.style.left, indicator.style.right]).toEqual(['', '0px'])
    // 500 - 16 - 240 + (120 - 40) / 2.
    expect(indicator.style.transform).toBe('translateX(284px)')
  })
})

describe('Carousel measures the snap markers for a runtime that swaps', () => {
  it('from the left under dir="rtl"', () => {
    setSwapFlag(true)
    setRTL()
    const places = ['Cabin', 'Shore', 'Ridge', 'Dunes']
    renderWeb(
      <Carousel
        items={places}
        renderItem={({ item }: CarouselItemInfo<string>) => <Text>{item}</Text>}
        contentPadding={16}
        testID="carousel"
      />,
    )
    fireLayout(screen.getByTestId('carousel'), 380)
    const scroller = screen.getByTestId('carousel-scroll')
    const markers = [...scroller.querySelectorAll<HTMLElement>('*')].filter(
      (node) => getComputedStyle(node).getPropertyValue('scroll-snap-align'),
    )
    const starts = markers.filter(
      (node) =>
        getComputedStyle(node).getPropertyValue('scroll-snap-align') ===
        'start',
    )
    expect(starts.length).toBeGreaterThan(0)
    expect(starts.every((node) => node.style.left !== '')).toBe(true)
    expect(starts.every((node) => node.style.right === '')).toBe(true)
  })
})
