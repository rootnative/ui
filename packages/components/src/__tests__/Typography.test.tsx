import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import type { TypographyVariant } from '../typography/types'
import { Typography } from '../typography/Typography'

describe('Typography', () => {
  it('renders children text', () => {
    renderWithTheme(<Typography>Hello world</Typography>)
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('assigns header role for heading variants', () => {
    renderWithTheme(<Typography variant="headlineLarge">Page Title</Typography>)
    expect(screen.getByRole('header')).toBeTruthy()
  })

  it('does not assign header role for body variants', () => {
    renderWithTheme(<Typography variant="bodyMedium">Body text</Typography>)
    expect(screen.queryByRole('header')).toBeNull()
  })

  it('uses bodyMedium variant by default', () => {
    renderWithTheme(<Typography>Default text</Typography>)
    expect(screen.queryByRole('header')).toBeNull()
  })

  describe('overrides', () => {
    it('applies the color prop to the text', () => {
      renderWithTheme(<Typography color="#FF0000">Red text</Typography>)
      const text = screen.getByText('Red text')
      const flatStyle = StyleSheet.flatten(text.props.style)
      expect(flatStyle.color).toBe('#FF0000')
    })

    it('color prop takes priority over style.color', () => {
      renderWithTheme(
        <Typography color="#FF0000" style={{ color: '#00FF00' }}>
          Red wins
        </Typography>,
      )
      const text = screen.getByText('Red wins')
      const flatStyle = StyleSheet.flatten(text.props.style)
      expect(flatStyle.color).toBe('#FF0000')
    })

    it('style.color overrides the default theme color', () => {
      renderWithTheme(
        <Typography style={{ color: '#00FF00' }}>Green text</Typography>,
      )
      const text = screen.getByText('Green text')
      const flatStyle = StyleSheet.flatten(text.props.style)
      expect(flatStyle.color).toBe('#00FF00')
    })
  })

  // TypographyVariant is `keyof Typography`. It used to be a hand-written union
  // in this package that listed only the 15 base roles, so the 15 Expressive
  // `*Emphasized` tokens existed in the theme but were unreachable through the
  // prop. These two tests fail if the union narrows again: the first at
  // runtime, the second at `tsc` (an emphasized variant stops type-checking).
  describe('variant covers the whole theme type scale', () => {
    const variants = Object.keys(lightTheme.typography) as TypographyVariant[]

    it('accepts every token in the theme typography map', () => {
      expect(variants).toHaveLength(30)
      expect(variants).toContain('titleMediumEmphasized')
    })

    it.each(variants)("renders %s with that token's style", (variant) => {
      renderWithTheme(<Typography variant={variant}>Scale</Typography>)
      const flatStyle = StyleSheet.flatten(
        screen.getByText('Scale').props.style,
      )
      const token = lightTheme.typography[variant]
      expect(flatStyle.fontSize).toBe(token.fontSize)
      expect(flatStyle.fontWeight).toBe(token.fontWeight)
      expect(flatStyle.letterSpacing).toBe(token.letterSpacing)
    })

    it('applies the emphasized weight and tracking, not the base ones', () => {
      renderWithTheme(
        <Typography variant="titleMediumEmphasized">Emphasized</Typography>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByText('Emphasized').props.style,
      )
      expect(flatStyle.fontWeight).toBe('700')
      expect(flatStyle.fontWeight).not.toBe(
        lightTheme.typography.titleMedium.fontWeight,
      )
    })
  })
})
