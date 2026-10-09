import { Text } from 'react-native'
import { plainTextOf } from '../internal/plainText'

describe('plainTextOf', () => {
  it('reads one string or one number', () => {
    expect(plainTextOf('Delete file?')).toBe('Delete file?')
    expect(plainTextOf(3)).toBe('3')
    expect(plainTextOf('')).toBe('')
  })

  it('joins the parts of JSX text with an expression', () => {
    const tries = 2
    const element = <>You guessed in {tries} tries</>
    const { children } = element.props
    expect(Array.isArray(children)).toBe(true)
    expect(plainTextOf(children)).toBe('You guessed in 2 tries')
  })

  it('skips the parts that React renders as nothing', () => {
    expect(plainTextOf(['Saved', null, undefined, false, '.'])).toBe('Saved.')
    expect(plainTextOf([['a', 1], 'b'])).toBe('a1b')
  })

  it('returns undefined when a child is an element', () => {
    expect(plainTextOf(<Text>Bold</Text>)).toBeUndefined()
    expect(plainTextOf(['Delete ', <Text key="name">notes</Text>, '?'])).toBe(
      undefined,
    )
  })

  it('returns undefined when there is no child', () => {
    expect(plainTextOf(undefined)).toBeUndefined()
    expect(plainTextOf(null)).toBeUndefined()
    expect(plainTextOf([])).toBeUndefined()
    expect(plainTextOf(false)).toBeUndefined()
  })
})
