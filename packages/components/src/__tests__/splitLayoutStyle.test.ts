import { StyleSheet } from 'react-native'
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
      [{ margin: 0 }, undefined, { width: 120 }],
    ])
    expect(outer).toEqual({ margin: 0 })
    expect(StyleSheet.flatten(inner)).toEqual({ opacity: 0.5, width: 120 })
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

  it('makes the inner node grow when flex or flexGrow moves out', () => {
    expect(StyleSheet.flatten(splitLayoutStyle({ flex: 1 }).inner)).toEqual({
      flexGrow: 1,
    })
    expect(StyleSheet.flatten(splitLayoutStyle({ flexGrow: 2 }).inner)).toEqual(
      { flexGrow: 1 },
    )
    expect(splitLayoutStyle({ flexShrink: 1 }).inner).toEqual([])
    expect(splitLayoutStyle({ flex: 0 }).inner).toEqual([])
  })
})
