import { StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import { splitLayoutStyle } from '../internal/splitLayoutStyle'

describe('splitLayoutStyle', () => {
  it('sends the layout keys out and the rest in', () => {
    const { outer, inner } = splitLayoutStyle({
      alignSelf: 'center',
      marginTop: 12,
      position: 'absolute',
      right: 16,
      zIndex: 2,
      opacity: 0.5,
      borderRadius: 4,
    })
    expect(outer).toEqual({
      alignSelf: 'center',
      marginTop: 12,
      position: 'absolute',
      right: 16,
      zIndex: 2,
    })
    expect(StyleSheet.flatten(inner)).toEqual({ opacity: 0.5, borderRadius: 4 })
  })

  it('returns the same object when the style has no layout key', () => {
    const style = { opacity: 0.5 }
    const { outer, inner } = splitLayoutStyle(style)
    expect(outer).toBeUndefined()
    expect(inner).toBe(style)
  })

  it('walks nested arrays and skips falsy entries, and a later key wins', () => {
    const { outer, inner } = splitLayoutStyle([
      { margin: 8, opacity: 0.5 },
      false,
      null,
      [{ margin: 0 }, undefined, { height: 120 }],
    ])
    expect(outer).toEqual({ margin: 0 })
    expect(StyleSheet.flatten(inner)).toEqual({ opacity: 0.5, height: 120 })
  })

  it('keeps a Reanimated animated style whole on the inner node', () => {
    const animated = {
      viewDescriptors: {},
      initial: { value: { marginTop: 4 } },
    } as unknown as { marginTop: number }
    const { outer, inner } = splitLayoutStyle([
      { alignSelf: 'center' },
      animated,
    ])
    expect(outer).toEqual({ alignSelf: 'center' })
    expect(inner).toEqual([animated])
    expect((inner as unknown[])[0]).toBe(animated)
  })

  it('keeps a layout key whose value is a shared value on the inner node', () => {
    const shared = { value: 12 }
    const style = { marginTop: shared, alignSelf: 'center' } as unknown as {
      marginTop: number
      alignSelf: 'center'
    }
    const { outer, inner } = splitLayoutStyle(style)
    expect(outer).toEqual({ alignSelf: 'center' })
    expect(StyleSheet.flatten(inner)).toEqual({ marginTop: shared })
  })

  it('makes the frame and the inner node fill a growing outer view', () => {
    for (const style of [
      { flex: 1 },
      { flexGrow: 2 },
      { alignSelf: 'stretch' },
    ]) {
      const { frame, inner } = splitLayoutStyle(style as ViewStyle)
      expect(frame).toEqual({ alignSelf: 'stretch', flexGrow: 1 })
      expect(StyleSheet.flatten(inner)).toEqual({ flexGrow: 1, width: '100%' })
    }
    for (const style of [
      { flexShrink: 1 },
      { flex: 0 },
      { alignSelf: 'center' },
    ]) {
      const { frame, inner } = splitLayoutStyle(style as ViewStyle)
      expect(frame).toBeUndefined()
      expect(inner).toEqual([])
    }
  })

  it('sends a width out, and the frame and the inner node fill it', () => {
    const { outer, frame, inner } = splitLayoutStyle({ width: '50%' })
    expect(outer).toEqual({ width: '50%' })
    expect(frame).toEqual({ minWidth: '100%' })
    expect(StyleSheet.flatten(inner)).toEqual({ width: 'auto' })
  })

  it('a growing outer view with a width fills, and does not take the width rule', () => {
    const { frame } = splitLayoutStyle({ width: 120, flex: 1 })
    expect(frame).toEqual({ alignSelf: 'stretch', flexGrow: 1 })
  })

  it('sends minWidth and maxWidth out only with a width', () => {
    const withWidth = splitLayoutStyle([
      { minWidth: 100 },
      { width: '100%', maxWidth: 300 },
    ])
    expect(withWidth.outer).toEqual({
      minWidth: 100,
      width: '100%',
      maxWidth: 300,
    })

    const alone = splitLayoutStyle({ minWidth: 100, maxWidth: '50%' })
    expect(alone.outer).toBeUndefined()
    expect(alone.frame).toBeUndefined()
    expect(StyleSheet.flatten(alone.inner)).toEqual({
      minWidth: 100,
      maxWidth: '50%',
    })
  })

  it('keeps width auto on the inner node', () => {
    const style = { width: 'auto' as const, minWidth: 100 }
    const { outer, frame, inner } = splitLayoutStyle(style)
    expect(outer).toBeUndefined()
    expect(frame).toBeUndefined()
    expect(inner).toBe(style)
  })

  it('gives no frame style when no key sizes the outer view', () => {
    expect(splitLayoutStyle({ marginTop: 8 }).frame).toBeUndefined()
    expect(splitLayoutStyle({ opacity: 0.5 }).frame).toBeUndefined()
  })

  it('with fill false, sends the layout keys out and adds no fill', () => {
    const grows = splitLayoutStyle({ flex: 1, opacity: 0.5 }, { fill: false })
    expect(grows.outer).toEqual({ flex: 1 })
    expect(grows.frame).toBeUndefined()
    expect(StyleSheet.flatten(grows.inner)).toEqual({ opacity: 0.5 })

    const sized = splitLayoutStyle(
      { width: 120, maxWidth: 200 },
      { fill: false },
    )
    expect(sized.outer).toEqual({ width: 120, maxWidth: 200 })
    expect(sized.frame).toBeUndefined()
    expect(StyleSheet.flatten(sized.inner)).toEqual({})
  })
})
