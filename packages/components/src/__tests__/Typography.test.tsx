import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
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
})
