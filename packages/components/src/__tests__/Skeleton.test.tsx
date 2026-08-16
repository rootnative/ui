import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Skeleton } from '../skeleton'

const flatten = (testID: string) =>
  StyleSheet.flatten(
    screen.getByTestId(testID, { includeHiddenElements: true }).props.style,
  )

describe('Skeleton', () => {
  it('is hidden from the accessibility tree', () => {
    renderWithTheme(<Skeleton testID="skeleton" />)
    expect(
      screen.getByTestId('skeleton', { includeHiddenElements: true }).props[
        'aria-hidden'
      ],
    ).toBe(true)
  })

  it('defaults to a full-width, 16dp-tall rounded block', () => {
    renderWithTheme(<Skeleton testID="skeleton" />)
    const style = flatten('skeleton')
    expect(style.width).toBe('100%')
    expect(style.height).toBe(16)
    expect(style.borderRadius).toBe(lightTheme.shape.cornerSmall)
  })

  it('reads surfaceContainerHighest as its default color', () => {
    renderWithTheme(<Skeleton testID="skeleton" />)
    expect(flatten('skeleton').backgroundColor).toBe(
      lightTheme.colors.surfaceContainerHighest,
    )
  })

  it('containerColor overrides the block color', () => {
    renderWithTheme(<Skeleton testID="skeleton" containerColor="#123456" />)
    expect(flatten('skeleton').backgroundColor).toBe('#123456')
  })

  it('applies width and height props', () => {
    renderWithTheme(<Skeleton testID="skeleton" width={120} height={24} />)
    const style = flatten('skeleton')
    expect(style.width).toBe(120)
    expect(style.height).toBe(24)
  })

  it('shape="circle" uses the full corner radius', () => {
    renderWithTheme(
      <Skeleton testID="skeleton" shape="circle" width={40} height={40} />,
    )
    expect(flatten('skeleton').borderRadius).toBe(lightTheme.shape.cornerFull)
  })

  it('shape="rectangle" uses square corners', () => {
    renderWithTheme(<Skeleton testID="skeleton" shape="rectangle" />)
    expect(flatten('skeleton').borderRadius).toBe(lightTheme.shape.cornerNone)
  })

  it('style prop wins over the size props', () => {
    renderWithTheme(
      <Skeleton testID="skeleton" width={120} style={styles.override} />,
    )
    expect(flatten('skeleton').width).toBe(64)
  })

  it('animated={false} renders a static block with the same styles', () => {
    renderWithTheme(<Skeleton testID="skeleton" animated={false} />)
    const style = flatten('skeleton')
    expect(style.width).toBe('100%')
    expect(style.height).toBe(16)
    expect(style.backgroundColor).toBe(
      lightTheme.colors.surfaceContainerHighest,
    )
    expect(
      screen.getByTestId('skeleton', { includeHiddenElements: true }).props[
        'aria-hidden'
      ],
    ).toBe(true)
  })

  it('spreads RN view props onto the root node', () => {
    renderWithTheme(<Skeleton testID="skeleton" nativeID="probe" />)
    expect(
      screen.getByTestId('skeleton', { includeHiddenElements: true }).props
        .nativeID,
    ).toBe('probe')
  })
})

const styles = StyleSheet.create({
  override: {
    width: 64,
  },
})
