import { DEFAULT_DESCRIPTION_LIMIT } from './site'

const ELLIPSIS = '…'

/**
 * Collapses whitespace and clips a description to `limit` characters. A clipped
 * text ends at a word boundary and carries one ellipsis character.
 */
export function clipDescription(
  text: string,
  limit: number = DEFAULT_DESCRIPTION_LIMIT,
): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= limit) return flat
  const room = Math.max(limit - ELLIPSIS.length, 0)
  const head = flat.slice(0, room)
  const lastSpace = head.lastIndexOf(' ')
  const cut = lastSpace > 0 ? head.slice(0, lastSpace) : head
  return `${cut.replace(/[\s,;:.–—-]+$/, '')}${ELLIPSIS}`
}

/**
 * Turns a duration in minutes into an ISO 8601 duration, for example
 * `PT2H30M`. Returns `null` for `0`, a negative number, or a non-finite number,
 * so a `0` sentinel from an API never reaches the JSON-LD.
 */
export function isoDuration(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  const whole = Math.round(minutes)
  if (whole === 0) return null
  const hours = Math.floor(whole / 60)
  const rest = whole % 60
  const parts = ['PT']
  if (hours > 0) parts.push(`${hours}H`)
  if (rest > 0) parts.push(`${rest}M`)
  return parts.join('')
}

/**
 * Serialises a JSON-LD object for a `<script>` body. `<` is written as
 * `<`, so a `</script>` inside a title cannot end the tag.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
