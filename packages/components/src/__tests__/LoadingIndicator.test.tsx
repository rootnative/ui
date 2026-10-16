import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { LoadingIndicator } from '../loading-indicator/LoadingIndicator'
import {
  DETERMINATE_POINTS,
  INDETERMINATE_POINTS,
  pointsToPath,
  SAMPLE_COUNT,
} from '../loading-indicator/shapes'

describe('LoadingIndicator', () => {
  it('renders with the progressbar accessibility role', () => {
    renderWithTheme(<LoadingIndicator accessibilityLabel="Loading" />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('is indeterminate (no accessibilityValue) when progress is omitted', () => {
    renderWithTheme(<LoadingIndicator accessibilityLabel="Loading" />)
    const node = screen.getByRole('progressbar')
    expect(node.props.accessibilityValue).toBeUndefined()
  })

  it('exposes a percentage accessibilityValue in determinate mode', () => {
    renderWithTheme(
      <LoadingIndicator progress={0.42} accessibilityLabel="Loading" />,
    )
    const node = screen.getByRole('progressbar')
    expect(node.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 42 })
  })

  it('clamps out-of-range progress into 0–100', () => {
    renderWithTheme(
      <LoadingIndicator progress={1.8} accessibilityLabel="Loading" />,
    )
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(
      100,
    )
  })

  it('renders without crashing in contained mode', () => {
    renderWithTheme(<LoadingIndicator contained accessibilityLabel="Loading" />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })
})

/**
 * Records the value that a shared value holds when a `withRepeat` loop is
 * assigned to it. Reanimated runs each turn of a loop from that value, so a
 * loop that starts at its target never moves.
 */
function recordLoopStarts(): number[] {
  const starts: number[] = []
  let loopPending = false
  const useSharedValue = Reanimated.useSharedValue
  const instrumented = new WeakSet<object>()

  jest
    .spyOn(Reanimated, 'useSharedValue')
    .mockImplementation((initial: unknown) => {
      const sv = useSharedValue(initial)
      if (!instrumented.has(sv)) {
        instrumented.add(sv)
        let current = sv.value
        Object.defineProperty(sv, 'value', {
          get: () => current,
          set: (next) => {
            if (loopPending) starts.push(current as number)
            loopPending = false
            current = next
          },
        })
      }
      return sv
    })
  jest.spyOn(Reanimated, 'withRepeat').mockImplementation((animation) => {
    loopPending = true
    return animation
  })
  return starts
}

describe('LoadingIndicator spin', () => {
  afterEach(() => jest.restoreAllMocks())

  it('starts the indeterminate spin at 0', () => {
    const starts = recordLoopStarts()
    renderWithTheme(<LoadingIndicator accessibilityLabel="Loading" />)
    expect(starts).toEqual([0])
  })

  it('runs no loop in determinate mode', () => {
    const starts = recordLoopStarts()
    renderWithTheme(
      <LoadingIndicator progress={0.4} accessibilityLabel="Loading" />,
    )
    expect(starts).toEqual([])
  })

  it('starts the spin at 0 again when it becomes indeterminate again', () => {
    const starts = recordLoopStarts()
    const { rerender } = renderWithTheme(
      <LoadingIndicator accessibilityLabel="Loading" />,
    )
    rerender(<LoadingIndicator progress={0.4} accessibilityLabel="Loading" />)
    rerender(<LoadingIndicator accessibilityLabel="Loading" />)
    expect(starts).toEqual([0, 0])
  })
})

describe('LoadingIndicator shapes', () => {
  it('samples every shape to the same point count (morph is index-wise lerp)', () => {
    for (const pts of INDETERMINATE_POINTS) {
      expect(pts).toHaveLength(SAMPLE_COUNT)
    }
    for (const pts of DETERMINATE_POINTS) {
      expect(pts).toHaveLength(SAMPLE_COUNT)
    }
  })

  it('has 7 indeterminate shapes and 2 determinate shapes', () => {
    expect(INDETERMINATE_POINTS).toHaveLength(7)
    expect(DETERMINATE_POINTS).toHaveLength(2)
  })

  it('the determinate cycle starts from a circle (constant radius)', () => {
    const circle = DETERMINATE_POINTS[0]
    const radii = circle.map((p) => Math.hypot(p.x, p.y))
    const first = radii[0]
    for (const r of radii) {
      expect(Math.abs(r - first)).toBeLessThan(1e-9)
    }
  })

  it('pointsToPath builds a closed cubic path scaled and centered', () => {
    const d = pointsToPath(DETERMINATE_POINTS[0], 19, 24, 0)
    expect(d.startsWith('M ')).toBe(true)
    expect(d.trimEnd().endsWith('Z')).toBe(true)
    // One cubic segment per sampled point.
    expect(d.split('C').length - 1).toBe(SAMPLE_COUNT)
    // Circle of radius 1 * scale 19 around center 24 stays within [5, 43].
    const coords = d
      .replace(/[MCZ]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
    for (const c of coords) {
      expect(c).toBeGreaterThanOrEqual(4)
      expect(c).toBeLessThanOrEqual(44)
    }
  })
})
