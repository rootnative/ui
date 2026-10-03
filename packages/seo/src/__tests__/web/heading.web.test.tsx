import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { Text, type TextProps } from 'react-native'
import { Heading } from '../../react'

describe('Heading on the web', () => {
  it('renders <h2> for level 2', () => {
    render(<Heading level={2}>Cast</Heading>)
    const node = screen.getByText('Cast')
    expect(node.tagName).toBe('H2')
    expect(node.getAttribute('aria-level')).toBe('2')
  })

  it.each([1, 3, 6] as const)('renders <h%i>', (level) => {
    render(<Heading level={level}>Title</Heading>)
    expect(screen.getByText('Title').tagName).toBe(`H${level}`)
  })

  it('renders through the `as` component and keeps its props', () => {
    const Fancy: ComponentType<TextProps & { tone?: string }> = ({
      tone: _tone,
      ...props
    }) => <Text {...props} testID="fancy" />
    render(
      <Heading level={3} as={Fancy} tone="loud">
        Crew
      </Heading>,
    )
    const node = screen.getByText('Crew')
    expect(node.tagName).toBe('H3')
    expect(node.getAttribute('data-testid')).toBe('fancy')
  })
})
