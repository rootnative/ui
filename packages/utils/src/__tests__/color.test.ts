import { alphaColor, blendColor } from '../color'

describe('alphaColor', () => {
  it.each([
    ['#ff0000', 'rgba(255, 0, 0, 0.5)'],
    ['#f00', 'rgba(255, 0, 0, 0.5)'],
    ['#ff000080', 'rgba(255, 0, 0, 0.5)'],
    ['rgb(255, 0, 0)', 'rgba(255, 0, 0, 0.5)'],
    ['rgba(255, 0, 0, 0.1)', 'rgba(255, 0, 0, 0.5)'],
    ['hsl(0, 100%, 50%)', 'rgba(255, 0, 0, 0.5)'],
    ['red', 'rgba(255, 0, 0, 0.5)'],
  ])('reads %s as red and applies the alpha', (input, expected) => {
    expect(alphaColor(input, 0.5)).toBe(expected)
  })

  it('clamps the alpha to 0..1', () => {
    expect(alphaColor('#ff0000', 2)).toBe('rgba(255, 0, 0, 1)')
    expect(alphaColor('#ff0000', -1)).toBe('rgba(255, 0, 0, 0)')
  })

  it('returns an unreadable colour unchanged', () => {
    expect(alphaColor('not-a-colour', 0.5)).toBe('not-a-colour')
  })
})

describe('blendColor', () => {
  it('blends an opaque overlay onto an opaque base', () => {
    expect(blendColor('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)')
  })

  it.each([
    ['#f00', '#000', 'rgb(230, 0, 0)'],
    ['rgb(255, 0, 0)', 'black', 'rgb(230, 0, 0)'],
    ['red', 'hsl(0, 0%, 0%)', 'rgb(230, 0, 0)'],
  ])('reads %s and %s like hex', (base, overlay, expected) => {
    // A filled component with `containerColor="red"` keeps a red container
    // under its 10% press layer instead of turning into a 10% tint of black.
    expect(blendColor(base, overlay, 0.1)).toBe(expected)
  })

  it('returns the overlay at its alpha when the base is not opaque', () => {
    expect(blendColor('transparent', '#000000', 0.1)).toBe('rgba(0, 0, 0, 0.1)')
    expect(blendColor('rgba(255, 0, 0, 0.5)', '#000000', 0.1)).toBe(
      'rgba(0, 0, 0, 0.1)',
    )
  })

  it('returns the overlay at its alpha when a colour is unreadable', () => {
    expect(blendColor('nope', '#000000', 0.1)).toBe('rgba(0, 0, 0, 0.1)')
  })
})
