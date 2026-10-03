import { clipDescription, isoDuration, serializeJsonLd } from '../index'

describe('clipDescription', () => {
  it('returns the text unchanged at the limit', () => {
    const text = 'a'.repeat(160)
    expect(clipDescription(text)).toBe(text)
  })

  it('clips at a word boundary over the limit and adds one ellipsis', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(10)
    const clipped = clipDescription(text)
    expect(clipped.length).toBeLessThanOrEqual(160)
    expect(clipped.endsWith('…')).toBe(true)
    expect(clipped).not.toMatch(/\s…$/)
    expect(clipped).not.toMatch(/[.,]…$/)
    expect(clipped.slice(0, -1)).toBe(
      text
        .slice(0, clipped.length - 1)
        .trimEnd()
        .replace(/\.$/, ''),
    )
  })

  it('collapses line breaks and repeated spaces', () => {
    expect(clipDescription('  one\n\ntwo   three\tfour ')).toBe(
      'one two three four',
    )
  })

  it('honours a custom limit', () => {
    expect(clipDescription('one two three four five', 10)).toBe('one two…')
  })

  it('cuts a single long word hard', () => {
    expect(clipDescription('a'.repeat(30), 10)).toBe('aaaaaaaaa…')
  })
})

describe('isoDuration', () => {
  it('writes hours only', () => {
    expect(isoDuration(120)).toBe('PT2H')
  })

  it('writes minutes only', () => {
    expect(isoDuration(45)).toBe('PT45M')
  })

  it('writes hours and minutes', () => {
    expect(isoDuration(150)).toBe('PT2H30M')
  })

  it('returns null for the 0 sentinel, a negative number, and NaN', () => {
    expect(isoDuration(0)).toBeNull()
    expect(isoDuration(-5)).toBeNull()
    expect(isoDuration(Number.NaN)).toBeNull()
    expect(isoDuration(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it('rounds a fraction to the nearest minute', () => {
    expect(isoDuration(89.6)).toBe('PT1H30M')
  })
})

describe('serializeJsonLd', () => {
  it('escapes every < as \\u003c and stays valid JSON', () => {
    const text = serializeJsonLd({ a: '<b></b>' })
    expect(text).toBe('{"a":"\\u003cb>\\u003c/b>"}')
    expect(JSON.parse(text)).toEqual({ a: '<b></b>' })
  })
})
