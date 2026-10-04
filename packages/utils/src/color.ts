import { processColor } from 'react-native'

interface Channels {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Every colour form React Native accepts: 3, 4, 6 and 8 digit hex, `rgb()`,
 * `rgba()`, `hsl()`, `hsla()`, `hwb()`, and the named colours.
 * `processColor` returns an ARGB integer on every platform, so one parser
 * serves native and web.
 */
function parseColor(color: string): Channels | null {
  const argb = processColor(color)
  if (typeof argb !== 'number') return null
  return {
    a: (argb >>> 24) & 0xff,
    r: (argb >>> 16) & 0xff,
    g: (argb >>> 8) & 0xff,
    b: argb & 0xff,
  }
}

function clampAlpha(alpha: number): number {
  return Math.max(0, Math.min(1, alpha))
}

/** The colour at the given alpha. An alpha the colour already had is replaced. */
export function alphaColor(color: string, alpha: number): string {
  const channels = parseColor(color)
  const boundedAlpha = clampAlpha(alpha)

  if (!channels) {
    return color
  }

  return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${boundedAlpha})`
}

/**
 * The opaque result of `overlay` at `overlayAlpha` on top of `base`. A base
 * that is not fully opaque has no single result, because the colour behind it
 * is unknown, so the overlay is returned at its alpha instead.
 */
export function blendColor(
  base: string,
  overlay: string,
  overlayAlpha: number,
): string {
  const baseChannels = parseColor(base)
  const overlayChannels = parseColor(overlay)
  const boundedAlpha = clampAlpha(overlayAlpha)

  if (!baseChannels || !overlayChannels || baseChannels.a < 0xff) {
    return alphaColor(overlay, boundedAlpha)
  }

  const r = Math.round(
    (1 - boundedAlpha) * baseChannels.r + boundedAlpha * overlayChannels.r,
  )
  const g = Math.round(
    (1 - boundedAlpha) * baseChannels.g + boundedAlpha * overlayChannels.g,
  )
  const b = Math.round(
    (1 - boundedAlpha) * baseChannels.b + boundedAlpha * overlayChannels.b,
  )

  return `rgb(${r}, ${g}, ${b})`
}
