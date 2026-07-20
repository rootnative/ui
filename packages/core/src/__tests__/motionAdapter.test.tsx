import { useNamedTransitions } from '@rootnative/inertia'
import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { ThemeProvider } from '../provider/ThemeProvider'
import { darkTheme } from '../theme/dark'
import { lightTheme } from '../theme/light'
import { motionTransitions } from '../theme/motionAdapter'

describe('motionTransitions', () => {
  const transitions = motionTransitions(lightTheme.motion)

  it('maps the state-layer timings onto the MD3 duration tokens', () => {
    expect(transitions['state-hover']).toMatchObject({
      type: 'timing',
      duration: lightTheme.motion.durationShort3,
    })
    expect(transitions['state-press']).toMatchObject({
      type: 'timing',
      duration: lightTheme.motion.durationShort2,
    })
    expect(transitions['state-focus']).toMatchObject({
      type: 'timing',
      duration: lightTheme.motion.durationShort4,
    })
  })

  it('builds the standard easing from the CSS token', () => {
    for (const name of ['state-hover', 'state-press', 'state-focus'] as const) {
      const config = transitions[name]
      expect(config).toHaveProperty('easing')
      expect((config as { easing: unknown }).easing).toBeDefined()
    }
  })

  it('exposes the spring tokens verbatim', () => {
    expect(transitions['spring-fast-spatial']).toEqual({
      type: 'spring',
      tension: 380,
      friction: 33,
      mass: 1,
    })
    expect(transitions['spring-default-spatial']).toEqual({
      type: 'spring',
      tension: 380,
      friction: 26,
      mass: 1,
    })
  })
})

describe('ThemeProvider motion registration', () => {
  it('registers the named transitions for descendants', () => {
    function wrapper({ children }: { children: ReactNode }) {
      return <ThemeProvider>{children}</ThemeProvider>
    }
    const { result } = renderHook(() => useNamedTransitions(), { wrapper })
    expect(Object.keys(result.current).sort()).toEqual([
      'spring-default-spatial',
      'spring-fast-spatial',
      'state-focus',
      'state-hover',
      'state-press',
    ])
  })

  it('registers the provided theme motion tokens, not the defaults', () => {
    function wrapper({ children }: { children: ReactNode }) {
      return <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
    }
    const { result } = renderHook(() => useNamedTransitions(), { wrapper })
    expect(result.current['state-hover']).toMatchObject({
      duration: darkTheme.motion.durationShort3,
    })
  })
})
