import { I18nManager } from 'react-native'
import type { ResolveAnchorPositionArgs } from '../internal/useAnchorPosition'
import { resolveAnchorPosition } from '../internal/useAnchorPosition'

// The hook's React half cannot be exercised in a test renderer: the React
// Native jest preset stubs `measureInWindow` with a `jest.fn()` that never
// invokes its callback, so no anchor rect ever reaches it. The geometry is the
// part with the decisions in it, and it is pure — so it is tested directly.

/** A root `PortalHost` layer: fills the window, so bounds === window. */
const BASE: ResolveAnchorPositionArgs = {
  anchor: { x: 100, y: 300, width: 40, height: 40 },
  overlay: { width: 200, height: 150 },
  layer: { x: 0, y: 0, width: 400, height: 800 },
  windowWidth: 400,
  windowHeight: 800,
  preferredSide: 'bottom',
  align: 'start',
  offset: 0,
  screenMargin: 8,
  maxOverlayHeight: Infinity,
}

function resolve(overrides: Partial<ResolveAnchorPositionArgs> = {}) {
  return resolveAnchorPosition({ ...BASE, ...overrides })
}

function withRTL(isRTL: boolean, fn: () => void) {
  const original = I18nManager.isRTL
  Object.defineProperty(I18nManager, 'isRTL', {
    configurable: true,
    get: () => isRTL,
  })
  try {
    fn()
  } finally {
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      get: () => original,
    })
  }
}

describe('resolveAnchorPosition', () => {
  it('places the overlay below the anchor, aligned to its start edge', () => {
    expect(resolve()).toEqual({
      top: 340,
      left: 100,
      side: 'bottom',
      // windowHeight - screenMargin - overlay top
      maxHeight: 452,
      transformOrigin: 'left top',
    })
  })

  it('adds the offset to the gap and takes it out of the available space', () => {
    const position = resolve({ offset: 8 })
    expect(position.top).toBe(348)
    expect(position.maxHeight).toBe(444)
  })

  it('returns layer coordinates, not window coordinates', () => {
    const position = resolve({
      layer: { x: 20, y: 50, width: 380, height: 750 },
    })
    expect(position.top).toBe(290)
    expect(position.left).toBe(80)
  })
})

// A `PortalHost` mounted below an app bar and above a tab bar — the common case,
// and the one the window-only math got wrong. Placing against the window let a
// capped overlay end up taller than the region it can be seen in, stranding its
// last items below the layer's clip where no scroll could reach them.
describe('resolveAnchorPosition — layer bounds', () => {
  const INSET_LAYER = {
    // 100dp app bar above, 60dp tab bar below.
    layer: { x: 0, y: 100, width: 400, height: 640 },
    windowWidth: 400,
    windowHeight: 800,
  }

  it('caps maxHeight at the layer bottom, not the window bottom', () => {
    const position = resolve({
      ...INSET_LAYER,
      anchor: { x: 100, y: 300, width: 40, height: 40 },
      overlay: { width: 200, height: 900 },
    })
    // Layer bottom is 740 in window coords; 8dp margin leaves 732.
    expect(position.side).toBe('bottom')
    expect(position.maxHeight).toBe(392)
    // …and the capped overlay ends exactly on the layer's inner bottom edge.
    expect(position.top + position.maxHeight).toBe(632)
  })

  it('keeps a capped overlay inside the layer it is clipped by', () => {
    const position = resolve({
      ...INSET_LAYER,
      anchor: { x: 100, y: 300, width: 40, height: 40 },
      overlay: { width: 200, height: 900 },
    })
    expect(position.top).toBeGreaterThanOrEqual(0)
    expect(position.top + position.maxHeight).toBeLessThanOrEqual(
      INSET_LAYER.layer.height,
    )
  })

  it('measures space above from the layer top, not the window top', () => {
    const position = resolve({
      ...INSET_LAYER,
      anchor: { x: 100, y: 700, width: 40, height: 40 },
      overlay: { width: 200, height: 900 },
    })
    // Space below the anchor is 740 - 8 - 740 = -8; above is 700 - 108 = 592.
    expect(position.side).toBe('top')
    expect(position.maxHeight).toBe(592)
    // Pinned to the layer's inner top edge, which is 8dp inside the layer.
    expect(position.top).toBe(8)
  })

  it('shifts horizontally against the layer edges', () => {
    const position = resolve({
      layer: { x: 40, y: 0, width: 200, height: 800 },
      windowWidth: 400,
      windowHeight: 800,
      anchor: { x: 200, y: 300, width: 40, height: 40 },
      overlay: { width: 150, height: 100 },
    })
    // Layer spans 40–240 in window coords; the 150dp overlay pins at 240-8-150
    // = 82, which is 42 inside the layer.
    expect(position.left).toBe(42)
  })

  it('never places outside the window when the layer overflows it', () => {
    const position = resolve({
      // A host inside a scrolled container, taller than the viewport.
      layer: { x: 0, y: -200, width: 400, height: 1400 },
      windowWidth: 400,
      windowHeight: 800,
      anchor: { x: 100, y: 300, width: 40, height: 40 },
      overlay: { width: 200, height: 900 },
    })
    // Bounds clamp to the window: 800 - 8 - 340 = 452.
    expect(position.maxHeight).toBe(452)
  })
})

describe('resolveAnchorPosition — collision flipping', () => {
  it('flips above the anchor when it does not fit below and above is roomier', () => {
    // spaceBelow 52, spaceAbove 692 — the 150dp overlay only fits above.
    const position = resolve({
      anchor: { x: 100, y: 700, width: 40, height: 40 },
    })
    expect(position.side).toBe('top')
    expect(position.top).toBe(550)
    expect(position.maxHeight).toBe(692)
    expect(position.transformOrigin).toBe('left bottom')
  })

  it('stays on the preferred side when the other side is no roomier', () => {
    // spaceBelow 132, spaceAbove 12 — the overlay fits neither, so flipping
    // would only move the clipping to the worse side.
    const position = resolve({
      anchor: { x: 100, y: 20, width: 40, height: 40 },
      windowHeight: 200,
    })
    expect(position.side).toBe('bottom')
    expect(position.top).toBe(60)
    expect(position.maxHeight).toBe(132)
  })

  it('pins a flipped overlay to the screen margin when it is still too tall', () => {
    const position = resolve({
      anchor: { x: 100, y: 200, width: 40, height: 40 },
      windowHeight: 300,
      overlay: { width: 200, height: 400 },
    })
    expect(position.side).toBe('top')
    expect(position.maxHeight).toBe(192)
    expect(position.top).toBe(8)
  })

  it('reaches a fixed point — re-resolving with the capped height does not flip back', () => {
    const args = {
      anchor: { x: 100, y: 700, width: 40, height: 40 },
    }
    const first = resolve(args)
    // What the overlay reports on its second layout pass, after the consumer
    // applies `maxHeight`. A side decision that changed here would oscillate.
    const second = resolve({
      ...args,
      overlay: { width: 200, height: Math.min(150, first.maxHeight) },
    })
    expect(second.side).toBe(first.side)
    expect(second.maxHeight).toBe(first.maxHeight)
  })
})

describe('resolveAnchorPosition — consumer height cap', () => {
  it('shortens the overlay below the available space', () => {
    const position = resolve({
      overlay: { width: 200, height: 900 },
      maxOverlayHeight: 280,
    })
    // 452 is available; the cap wins because it is smaller.
    expect(position.maxHeight).toBe(280)
  })

  it('never lets the cap exceed the available space', () => {
    const position = resolve({
      overlay: { width: 200, height: 900 },
      maxOverlayHeight: 5000,
    })
    // A cap past the visible region would place items where nothing can reach
    // them, so the space still wins.
    expect(position.maxHeight).toBe(452)
  })

  it('does not flip a capped overlay off a side it fits on', () => {
    // 250dp below, 600dp above, 900dp of natural content. Uncapped this flips
    // above; capped to 200dp it fits below and must stay there.
    const args = {
      anchor: { x: 100, y: 500, width: 40, height: 40 },
      layer: { x: 0, y: 0, width: 400, height: 798 },
      windowHeight: 798,
      overlay: { width: 200, height: 900 },
    }
    expect(resolve(args).side).toBe('top')
    expect(resolve({ ...args, maxOverlayHeight: 200 }).side).toBe('bottom')
  })

  it('still reaches a fixed point with a cap applied', () => {
    const args = {
      overlay: { width: 200, height: 900 },
      maxOverlayHeight: 280,
    }
    const first = resolve(args)
    // The surface now measures at the capped height, which is what feeds the
    // next pass. The side and the cap both have to hold.
    const second = resolve({
      ...args,
      overlay: { width: 200, height: first.maxHeight },
    })
    expect(second.side).toBe(first.side)
    expect(second.maxHeight).toBe(first.maxHeight)
    expect(second.top).toBe(first.top)
  })
})

describe('resolveAnchorPosition — alignment', () => {
  // Wide enough that alignment is never masked by an edge clamp. The layer has
  // to grow with the window — bounds are the intersection of the two.
  const WIDE = {
    windowWidth: 600,
    layer: { x: 0, y: 0, width: 600, height: 800 },
    anchor: { x: 250, y: 300, width: 40, height: 40 },
  }

  it('aligns the overlay end to the anchor end', () => {
    const position = resolve({ ...WIDE, align: 'end' })
    expect(position.left).toBe(90)
    expect(position.transformOrigin).toBe('right top')
  })

  it('centers the overlay on the anchor', () => {
    const position = resolve({ ...WIDE, align: 'center' })
    expect(position.left).toBe(170)
    expect(position.transformOrigin).toBe('center top')
  })

  it('treats start as the right edge in RTL', () => {
    withRTL(true, () => {
      const position = resolve(WIDE)
      expect(position.left).toBe(90)
      expect(position.transformOrigin).toBe('right top')
    })
  })

  it('treats end as the left edge in RTL', () => {
    withRTL(true, () => {
      const position = resolve({ ...WIDE, align: 'end' })
      expect(position.left).toBe(250)
      expect(position.transformOrigin).toBe('left top')
    })
  })
})

describe('resolveAnchorPosition — edge shifting', () => {
  it('shifts back in from the trailing screen edge', () => {
    const position = resolve({
      anchor: { x: 380, y: 300, width: 40, height: 40 },
    })
    // windowWidth - screenMargin - overlay width
    expect(position.left).toBe(192)
  })

  it('shifts back in from the leading screen edge', () => {
    const position = resolve({
      anchor: { x: 0, y: 300, width: 40, height: 40 },
      align: 'end',
    })
    expect(position.left).toBe(8)
  })

  it('pins an overlay wider than the window to the leading margin', () => {
    const position = resolve({ overlay: { width: 500, height: 150 } })
    expect(position.left).toBe(8)
  })
})
