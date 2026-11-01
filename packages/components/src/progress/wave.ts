// Path builders for the MD3 Expressive wavy indicators. Each one runs on the
// UI thread inside a `useAnimatedProps` worklet, so it reads only numbers and
// returns one `d` string. The wave is a sine sampled into straight segments:
// with a 4 dp round-joined stroke and 16 samples per wavelength the segments
// are not visible, and the string stays cheap to build each frame.

export const WAVE_SAMPLES_PER_WAVELENGTH = 16

/** Below this amplitude the wave is drawn as a straight line. */
const FLAT_AMPLITUDE = 0.05

function round(n: number): string {
  'worklet'
  return (Math.round(n * 100) / 100).toString()
}

/**
 * A wave along the x axis from `startX` to `endX`, centered on `centerY`.
 * `phase` is a fraction of one wavelength; the wave moves toward +x as it
 * rises. Returns an empty string when the span is empty.
 */
export function linearWavePath(
  startX: number,
  endX: number,
  centerY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
): string {
  'worklet'
  if (endX <= startX) return ''
  if (amplitude < FLAT_AMPLITUDE) {
    return `M${round(startX)} ${round(centerY)}L${round(endX)} ${round(centerY)}`
  }
  const step = wavelength / WAVE_SAMPLES_PER_WAVELENGTH
  const k = (2 * Math.PI) / wavelength
  const shift = phase * 2 * Math.PI
  let d = ''
  for (let x = startX; x < endX; x += step) {
    const y = centerY + amplitude * Math.sin(k * x - shift)
    d += `${d === '' ? 'M' : 'L'}${round(x)} ${round(y)}`
  }
  const yEnd = centerY + amplitude * Math.sin(k * endX - shift)
  d += `L${round(endX)} ${round(yEnd)}`
  return d
}

/**
 * A wave around a circle of `radius`, from `startAngle` to `endAngle` in
 * radians, clockwise. `waves` is the whole number of wavelengths around the
 * full circle, so the wave meets itself when the arc closes. `phase` is a
 * fraction of one wavelength. Returns an empty string when the arc is empty.
 */
export function circularWavePath(
  cx: number,
  cy: number,
  radius: number,
  amplitude: number,
  waves: number,
  phase: number,
  startAngle: number,
  endAngle: number,
): string {
  'worklet'
  if (endAngle <= startAngle) return ''
  const flat = amplitude < FLAT_AMPLITUDE
  const step = (2 * Math.PI) / (waves * WAVE_SAMPLES_PER_WAVELENGTH)
  const shift = phase * 2 * Math.PI
  const radiusAt = (a: number) =>
    flat ? radius : radius + amplitude * Math.sin(waves * a - shift)
  let d = ''
  for (let a = startAngle; a < endAngle; a += step) {
    const r = radiusAt(a)
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    d += `${d === '' ? 'M' : 'L'}${round(x)} ${round(y)}`
  }
  const rEnd = radiusAt(endAngle)
  d += `L${round(cx + rEnd * Math.cos(endAngle))} ${round(cy + rEnd * Math.sin(endAngle))}`
  return d
}
