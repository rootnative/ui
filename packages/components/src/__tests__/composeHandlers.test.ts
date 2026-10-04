import { composeHandlers } from '../internal/composeHandlers'

describe('composeHandlers', () => {
  it('runs the consumer handler, then the component handler', () => {
    const order: string[] = []
    const own = {
      onPressIn: () => order.push('own:in'),
      onPressOut: () => order.push('own:out'),
    }
    const consumer = { onPressIn: () => order.push('theirs:in') }

    const merged = composeHandlers(own, consumer)
    merged.onPressIn()
    merged.onPressOut()

    expect(order).toEqual(['theirs:in', 'own:in', 'own:out'])
  })

  it('passes a key the consumer did not set through untouched', () => {
    const own = { onHoverIn: () => {} }
    const merged = composeHandlers(own, { onHoverIn: null })
    expect(merged.onHoverIn).toBe(own.onHoverIn)
  })

  it('does not add a key the component does not own', () => {
    const own = { onHoverIn: () => {} }
    const merged = composeHandlers(own, {})
    expect(Object.keys(merged)).toEqual(['onHoverIn'])
  })
})
