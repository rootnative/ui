import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Circle } from 'react-native-svg'
import { CircularProgress } from '../progress/CircularProgress'
import { LinearProgress } from '../progress/LinearProgress'

describe('LinearProgress', () => {
  it('renders with progressbar role', () => {
    renderWithTheme(<LinearProgress progress={0.5} />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('reports current value via accessibilityValue when determinate', () => {
    renderWithTheme(<LinearProgress progress={0.42} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 42 })
  })

  it('clamps progress above 1', () => {
    renderWithTheme(<LinearProgress progress={1.5} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 })
  })

  it('clamps progress below 0', () => {
    renderWithTheme(<LinearProgress progress={-0.2} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 0 })
  })

  it('omits accessibilityValue when indeterminate', () => {
    renderWithTheme(<LinearProgress />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toBeUndefined()
  })

  it('forwards accessibilityLabel', () => {
    renderWithTheme(
      <LinearProgress progress={0.5} accessibilityLabel="Loading" />,
    )
    expect(screen.getByLabelText('Loading')).toBeTruthy()
  })
})

describe('CircularProgress', () => {
  it('renders with progressbar role', () => {
    renderWithTheme(<CircularProgress progress={0.5} />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('reports current value via accessibilityValue when determinate', () => {
    renderWithTheme(<CircularProgress progress={0.75} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 75 })
  })

  it('omits accessibilityValue when indeterminate', () => {
    renderWithTheme(<CircularProgress />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toBeUndefined()
  })

  it('forwards accessibilityLabel', () => {
    renderWithTheme(
      <CircularProgress progress={0.5} accessibilityLabel="Saving" />,
    )
    expect(screen.getByLabelText('Saving')).toBeTruthy()
  })

  it('defaults to a 48dp container per MD3', () => {
    renderWithTheme(<CircularProgress progress={0.5} testID="circular" />)
    const flatStyle = StyleSheet.flatten(
      screen.getByTestId('circular').props.style,
    )
    expect(flatStyle.width).toBe(48)
    expect(flatStyle.height).toBe(48)
  })
})

/**
 * These pin the *meaning* of the two color props, which the API-freeze pass
 * changed: `containerColor` used to paint the active indicator (contradicting
 * the library's own override contract) and the track lived on a separate
 * `trackColor`. Nothing asserted either one, which is how the inversion went
 * unnoticed — so assert the mapping in both directions, one prop at a time,
 * with the un-overridden side pinned to its theme default.
 */
describe('Progress color props', () => {
  function backgroundColors(root: { props: unknown }): string[] {
    const found: string[] = []
    const visit = (node: unknown) => {
      if (typeof node !== 'object' || node === null) return
      const el = node as {
        props?: { style?: unknown }
        children?: unknown[]
      }
      const bg = (StyleSheet.flatten(el.props?.style as never) ?? {}) as {
        backgroundColor?: unknown
      }
      if (typeof bg.backgroundColor === 'string') found.push(bg.backgroundColor)
      el.children?.forEach(visit)
    }
    visit(root)
    return found
  }

  it('LinearProgress: containerColor paints the track, not the indicator', () => {
    renderWithTheme(<LinearProgress progress={0.5} containerColor="#ABCDEF" />)
    const colors = backgroundColors(screen.getByRole('progressbar'))
    expect(colors).toContain('#ABCDEF')
    // The indicator keeps the theme default rather than picking up the override.
    expect(colors).toContain(lightTheme.colors.primary)
  })

  it('LinearProgress: contentColor paints the indicator, not the track', () => {
    renderWithTheme(<LinearProgress progress={0.5} contentColor="#123456" />)
    const colors = backgroundColors(screen.getByRole('progressbar'))
    expect(colors).toContain('#123456')
    expect(colors).toContain(lightTheme.colors.secondaryContainer)
  })

  it('CircularProgress: containerColor strokes the track, contentColor the arc', () => {
    renderWithTheme(
      <CircularProgress
        progress={0.5}
        containerColor="#ABCDEF"
        contentColor="#123456"
        testID="circular"
      />,
    )
    const strokes = screen
      .getByTestId('circular')
      .findAllByType(Circle as never)
      .map((c: { props: { stroke?: string } }) => c.props.stroke)
    // Track is rendered first, indicator second.
    expect(strokes).toEqual(['#ABCDEF', '#123456'])
  })
})
