import { ThemeProvider } from '@rootnative/core'
import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { useStateLayer } from '../internal/useStateLayer'

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe('useStateLayer', () => {
  it('returns the gesture-layer surface: style, handlers, states', () => {
    const { result } = renderHook(
      () => useStateLayer({ rest: '#6750a4', content: '#ffffff' }),
      { wrapper },
    )
    expect(result.current.style).toBeDefined()
    expect(result.current.handlers).toBeDefined()
    expect(result.current.states).toBeDefined()
  })

  it('rests on the variant container color', () => {
    const { result } = renderHook(
      () => useStateLayer({ rest: '#6750a4', content: '#ffffff' }),
      { wrapper },
    )
    expect(result.current.style).toMatchObject({ backgroundColor: '#6750a4' })
  })

  it('rests on the containerColor override when provided', () => {
    const { result } = renderHook(
      () =>
        useStateLayer({
          rest: '#6750a4',
          content: '#ffffff',
          containerColor: '#ff0000',
        }),
      { wrapper },
    )
    expect(result.current.style).toMatchObject({ backgroundColor: '#ff0000' })
  })

  it('exposes the per-state progress shared values at rest', () => {
    const { result } = renderHook(
      () => useStateLayer({ rest: 'transparent', content: '#6750a4' }),
      { wrapper },
    )
    const { states } = result.current
    expect(states.hovered.value).toBe(0)
    expect(states.focused.value).toBe(0)
    expect(states.focusVisible.value).toBe(0)
    expect(states.pressed.value).toBe(0)
    expect(states.disabled.value).toBe(0)
  })

  it('drives the disabled progress from the disabled option', () => {
    const { result } = renderHook(
      () =>
        useStateLayer({
          rest: '#6750a4',
          content: '#ffffff',
          disabled: true,
          disabledContainerColor: 'rgba(29, 27, 32, 0.12)',
        }),
      { wrapper },
    )
    expect(result.current.states.disabled.value).toBe(1)
  })
})
