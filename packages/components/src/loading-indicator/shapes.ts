// MD3 Expressive LoadingIndicator shape geometry.
//
// The reference implementation (androidx `graphics-shapes`) morphs between
// `RoundedPolygon`s of *different* vertex counts using non-trivial feature
// matching. We can't port that whole algorithm, so we take the documented
// alternative: sample every shape to the SAME fixed number of points evenly
// spaced by angle around its centre, which makes morphing a plain per-point
// linear interpolation (no feature matching). At a high sample count the
// visual result is faithful to the rounded-polygon silhouettes.
//
// Each shape is a closed loop of `SAMPLE_COUNT` points in a unit space
// centred on (0,0) with radius ~1, rendered as a smooth path via Catmull-Rom
// → cubic Bézier conversion (so the sampled polygon reads as the rounded,
// organic Material "blob", not a hard polygon).

/**
 * Points sampled per shape. Must be identical for every shape so the morph
 * is a straight index-wise lerp. 72 (every 5°) is smooth enough for the
 * 38dp indicator while keeping the generated path string short.
 */
export const SAMPLE_COUNT = 72

export interface Point {
  x: number
  y: number
}

/**
 * A radial shape: `radius(theta)` returns the distance from centre at angle
 * `theta` (radians). Sampling this at `SAMPLE_COUNT` even angles yields the
 * point loop. `rotation` pre-rotates the shape (radians).
 */
interface RadialShape {
  radius: (theta: number) => number
  rotation?: number
}

// --- The 7 indeterminate shapes, as radial functions -----------------------
// These approximate the Material shapes by their dominant harmonic (a base
// radius modulated by a cosine of `k * theta`), which reproduces the petal /
// lobe / star silhouette. Amplitudes are tuned to read like the reference
// (soft burst, cookies, pentagon, pill, sunny, oval) rather than to match
// vertex coordinates exactly — an intentional approximation, see file header.

const softBurst: RadialShape = {
  // 10 shallow lobes.
  radius: (t) => 1 + 0.12 * Math.cos(10 * t),
}

const cookie9: RadialShape = {
  // 9-pointed star, moderate depth.
  radius: (t) => 1 + 0.28 * Math.cos(9 * t),
  rotation: -Math.PI / 2,
}

const pentagon: RadialShape = {
  // 5 rounded lobes.
  radius: (t) => 1 + 0.18 * Math.cos(5 * t),
}

const pill: RadialShape = {
  // Elongated: a strong 2nd harmonic makes a rounded capsule.
  radius: (t) => 1 + 0.34 * Math.cos(2 * t),
}

const sunny: RadialShape = {
  // 8-point sun/burst.
  radius: (t) => 1 + 0.22 * Math.cos(8 * t),
}

const cookie4: RadialShape = {
  // 4 deep lobes.
  radius: (t) => 1 + 0.3 * Math.cos(4 * t),
  rotation: Math.PI / 4,
}

const oval: RadialShape = {
  // Gentle 2nd harmonic, rotated — a tilted oval.
  radius: (t) => 1 + 0.2 * Math.cos(2 * t),
  rotation: -Math.PI / 4,
}

const circle: RadialShape = {
  radius: () => 1,
}

/** Indeterminate morph cycle (wraps last → first). */
export const INDETERMINATE_SHAPES: RadialShape[] = [
  softBurst,
  cookie9,
  pentagon,
  pill,
  sunny,
  cookie4,
  oval,
]

/** Determinate morph cycle: circle → soft burst as progress goes 0 → 1. */
export const DETERMINATE_SHAPES: RadialShape[] = [circle, softBurst]

function sample(shape: RadialShape): Point[] {
  const rot = shape.rotation ?? 0
  const points: Point[] = []
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const theta = (i / SAMPLE_COUNT) * 2 * Math.PI
    const r = shape.radius(theta)
    points.push({
      x: r * Math.cos(theta + rot),
      y: r * Math.sin(theta + rot),
    })
  }
  return points
}

/** Pre-sampled point loops, one per shape, all `SAMPLE_COUNT` long. */
export const INDETERMINATE_POINTS: Point[][] = INDETERMINATE_SHAPES.map(sample)
export const DETERMINATE_POINTS: Point[][] = DETERMINATE_SHAPES.map(sample)

/**
 * Build a closed SVG path from a point loop using a Catmull-Rom spline
 * converted to cubic Béziers, so the sampled points render as a smooth
 * rounded outline. Coordinates are scaled by `scale` and offset to `center`.
 *
 * Worklet-safe: pure arithmetic and string building, no closures over
 * non-worklet values. Callers that run this on the UI thread must add the
 * `'worklet'` directive at the call site (a plain function reference can be
 * workletized by Reanimated when invoked inside a worklet).
 */
export function pointsToPath(
  points: Point[],
  scale: number,
  center: number,
  rotation: number,
): string {
  'worklet'
  // Rotation is applied to the points here (rather than an SVG group
  // transform) so the whole indicator is a single animated `d` string — no
  // `<g>` origin/transform props, which react-native-svg-web maps poorly.
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const n = points.length
  const rx = (p: Point) => center + (p.x * cos - p.y * sin) * scale
  const ry = (p: Point) => center + (p.x * sin + p.y * cos) * scale
  let d = ''
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    // Catmull-Rom tangents in the pre-rotation frame, then rotate the four
    // control/anchor points into place.
    const t1x = p1.x + (p2.x - p0.x) / 6
    const t1y = p1.y + (p2.y - p0.y) / 6
    const t2x = p2.x - (p3.x - p1.x) / 6
    const t2y = p2.y - (p3.y - p1.y) / 6
    const c1x = center + (t1x * cos - t1y * sin) * scale
    const c1y = center + (t1x * sin + t1y * cos) * scale
    const c2x = center + (t2x * cos - t2y * sin) * scale
    const c2y = center + (t2x * sin + t2y * cos) * scale
    if (i === 0) {
      d = `M ${rx(p1)} ${ry(p1)}`
    }
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${rx(p2)} ${ry(p2)}`
  }
  return d + ' Z'
}
