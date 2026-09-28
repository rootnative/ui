import { renderHook } from '@testing-library/react-native'
import { Dimensions } from 'react-native'
import { useBreakpoint, useWindowDimensions } from '../index'

// Native never hydrates, so the hook must return the measured window from
// the first render. The static-export case needs a DOM and lives in the
// components web project (`hydration.web.test.tsx`).
describe('useWindowDimensions', () => {
  it('returns the measured window on the first render', () => {
    const { result } = renderHook(() => useWindowDimensions())
    expect(result.current).toEqual(Dimensions.get('window'))
    expect(result.current.width).toBeGreaterThan(0)
  })

  it('agrees with useBreakpoint', () => {
    const { result } = renderHook(() => ({
      width: useWindowDimensions().width,
      breakpoint: useBreakpoint(),
    }))
    expect(result.current.width).toBe(Dimensions.get('window').width)
    expect(result.current.breakpoint).toBe(
      result.current.width >= 600 ? 'medium' : 'compact',
    )
  })
})
