import type { JsonLd } from '../types'

type Compactable = Record<string, unknown>

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object')
    return Object.keys(value as object).length === 0
  if (typeof value === 'number') return !Number.isFinite(value)
  return false
}

function compactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(compactValue).filter((item) => !isEmpty(item))
    return items
  }
  if (value !== null && typeof value === 'object') {
    return compactObject(value as Compactable)
  }
  return typeof value === 'string' ? value.trim() : value
}

/**
 * Removes every empty field, at every depth: `undefined`, `null`, `""`, `[]`,
 * `{}`, and a non-finite number. A builder never writes an empty field.
 */
export function compactObject<T extends Compactable>(input: T): T {
  const output: Compactable = {}
  for (const [key, raw] of Object.entries(input)) {
    const value = compactValue(raw)
    if (!isEmpty(value)) output[key] = value
  }
  return output as T
}

/** Builds a `JsonLd` with `@context` and `@type` set and empty fields removed. */
export function jsonLd(type: string, fields: Compactable): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...compactObject(fields),
  }
}

/** A nested object without `@context`. */
export function thing(type: string, fields: Compactable): Compactable {
  return { '@type': type, ...compactObject(fields) }
}

/** A `Person`, from a plain name or an object. Returns `undefined` for an empty input. */
export function personRef(
  input: string | { name: string; url?: string } | undefined,
): Compactable | undefined {
  if (!input) return undefined
  if (typeof input === 'string') {
    return input.trim() ? thing('Person', { name: input }) : undefined
  }
  return input.name.trim()
    ? thing('Person', { name: input.name, url: input.url })
    : undefined
}

/** A `Place`, from a plain name or an object. Returns `undefined` for an empty input. */
export function placeRef(
  input: string | { name: string; address?: string } | undefined,
): Compactable | undefined {
  if (!input) return undefined
  if (typeof input === 'string') {
    return input.trim() ? thing('Place', { name: input }) : undefined
  }
  return input.name.trim()
    ? thing('Place', { name: input.name, address: input.address })
    : undefined
}
