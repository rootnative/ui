import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet, View } from 'react-native'
import { Icon } from '../icon'

// A decorative icon is `aria-hidden` at its root, so the default queries skip
// it. Every lookup here opts hidden elements in.
const hidden = { includeHiddenElements: true }

describe('Icon', () => {
  it('renders a string name through the default resolver at 24dp', () => {
    renderWithTheme(<Icon source="home" testID="icon" />)
    // The jest mock renders the icon name as text.
    expect(screen.getByText('home', hidden)).toBeTruthy()
    const box = StyleSheet.flatten(
      screen.getByTestId('icon', hidden).props.style,
    )
    expect(box.width).toBe(24)
    expect(box.height).toBe(24)
  })

  it('passes size and the onSurface default color to the glyph', () => {
    renderWithTheme(<Icon source="home" size={40} testID="icon" />)
    const glyph = screen.getByText('home', hidden)
    expect(glyph.props.size).toBe(40)
    expect(glyph.props.color).toBe(lightTheme.colors.onSurface)
    expect(
      StyleSheet.flatten(screen.getByTestId('icon', hidden).props.style).width,
    ).toBe(40)
  })

  it('honours the color override', () => {
    renderWithTheme(<Icon source="home" color="#FF0000" />)
    expect(screen.getByText('home', hidden).props.color).toBe('#FF0000')
  })

  it('renders a pre-rendered element as is', () => {
    renderWithTheme(<Icon source={<View testID="custom" />} />)
    expect(screen.getByTestId('custom', hidden)).toBeTruthy()
  })

  it('calls a render function with size and color', () => {
    const source = jest.fn(() => <View testID="fn" />)
    renderWithTheme(<Icon source={source} size={32} color="#00FF00" />)
    expect(source).toHaveBeenCalledWith({ size: 32, color: '#00FF00' })
    expect(screen.getByTestId('fn', hidden)).toBeTruthy()
  })

  it('uses the theme iconResolver for a string name', () => {
    const iconResolver = jest.fn(() => <View testID="resolved" />)
    renderWithTheme(<Icon source="home" />, { iconResolver })
    expect(iconResolver).toHaveBeenCalledWith('home', {
      size: 24,
      color: lightTheme.colors.onSurface,
    })
    expect(screen.getByTestId('resolved', hidden)).toBeTruthy()
  })

  it('is hidden from assistive technology without a label', () => {
    renderWithTheme(<Icon source="home" testID="icon" />)
    const box = screen.getByTestId('icon', hidden)
    expect(box.props['aria-hidden']).toBe(true)
    expect(box.props.role).toBeUndefined()
  })

  it('is exposed as a named image with a label, glyph still hidden', () => {
    renderWithTheme(<Icon source="home" accessibilityLabel="Home" />)
    const image = screen.getByRole('img', { name: 'Home' })
    expect(image.props['aria-hidden']).toBeUndefined()
    expect(screen.getByText('home', hidden)).toBeTruthy()
    expect(
      screen.UNSAFE_getAllByProps({ 'aria-hidden': true }).length,
    ).toBeGreaterThan(0)
  })
})
