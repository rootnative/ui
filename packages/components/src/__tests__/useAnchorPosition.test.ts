import { I18nManager } from 'react-native'
import type { ResolveAnchorPositionArgs } from '../internal/useAnchorPosition'
import { resolveAnchorPosition } from '../internal/useAnchorPosition'

// The hook's React half cannot be exercised in a test renderer: the React
// Native jest preset stubs `measureInWindow` with a `jest.fn()` that never
// invokes its callback, so no anchor rect ever reaches it. The geometry is the
// part with the decisions in it, and it is pure — so it is tested directly.

const BASE: ResolveAnchorPositionArgs = {
  anchor: { x: 100, y: 300, width: 40, height: 40 },
  overlay: { width: 200, height: 150 },
  layerOrigin: { x: 0, y: 0 },
  windowWidth: 400,
  windowHeight: 800,
  preferredSide: 'bottom',
  align: 'start',
  offset: 0,
  screenMargin: 8,
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

  it('subtracts the overlay layer origin so a nested host still lands right', () => {
    const position = resolve({ layerOrigin: { x: 20, y: 50 } })
    expect(position.top).toBe(290)
    expect(position.left).toBe(80)
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

describe('resolveAnchorPosition — alignment', () => {
  const WIDE = {
    windowWidth: 600,
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
