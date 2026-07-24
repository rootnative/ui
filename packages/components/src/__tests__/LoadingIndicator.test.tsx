import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
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
