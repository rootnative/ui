import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Divider } from '../divider'

function flatten(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style)
}

describe('Divider', () => {
  it('renders a 1dp horizontal line in outlineVariant by default', () => {
    renderWithTheme(<Divider testID="divider" />)
    const style = flatten('divider')
    expect(style.height).toBe(1)
    expect(style.width).toBeUndefined()
    expect(style.backgroundColor).toBe(lightTheme.colors.outlineVariant)
  })

  it('has no insets by default', () => {
    renderWithTheme(<Divider testID="divider" />)
    const style = flatten('divider')
    expect(style.marginStart).toBe(0)
    expect(style.marginEnd).toBe(0)
  })

  it('applies the MD3 list inset (56dp) when inset is true', () => {
    renderWithTheme(<Divider testID="divider" inset />)
    expect(flatten('divider').marginStart).toBe(56)
  })

  it('accepts a numeric leading and trailing inset', () => {
    renderWithTheme(<Divider testID="divider" inset={16} insetEnd={24} />)
    const style = flatten('divider')
    expect(style.marginStart).toBe(16)
    expect(style.marginEnd).toBe(24)
  })

  it('renders a stretched vertical line when orientation is vertical', () => {
    renderWithTheme(<Divider testID="divider" orientation="vertical" />)
    const style = flatten('divider')
    expect(style.width).toBe(1)
    expect(style.height).toBeUndefined()
    expect(style.alignSelf).toBe('stretch')
  })

  it('maps insets to the vertical axis when orientation is vertical', () => {
    renderWithTheme(
      <Divider
        testID="divider"
        orientation="vertical"
        inset={8}
        insetEnd={4}
      />,
    )
    const style = flatten('divider')
    expect(style.marginTop).toBe(8)
    expect(style.marginBottom).toBe(4)
  })

  it('honours the thickness override', () => {
    renderWithTheme(<Divider testID="divider" thickness={2} />)
    expect(flatten('divider').height).toBe(2)
  })

  it('honours the containerColor override', () => {
    renderWithTheme(<Divider testID="divider" containerColor="#FF0000" />)
    expect(flatten('divider').backgroundColor).toBe('#FF0000')
  })

  it('merges the style prop last', () => {
    renderWithTheme(
      <Divider
        testID="divider"
        containerColor="#FF0000"
        style={styles.green}
      />,
    )
    expect(flatten('divider').backgroundColor).toBe('#00FF00')
  })
})

const styles = StyleSheet.create({
  green: { backgroundColor: '#00FF00' },
})
