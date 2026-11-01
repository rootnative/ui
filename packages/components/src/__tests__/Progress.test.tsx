import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Circle, Path } from 'react-native-svg'
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

  it('keeps a consumer onLayout beside its own width measurement', () => {
    const onLayout = jest.fn()
    renderWithTheme(<LinearProgress progress={0.5} onLayout={onLayout} />)
    fireEvent(screen.getByRole('progressbar'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 240, height: 4 } },
    })
    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(onLayout.mock.calls[0][0].nativeEvent.layout.width).toBe(240)
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

describe('Progress wavy variant', () => {
  function paths(testID: string) {
    return screen.getByTestId(testID).findAllByType(Path as never) as {
      props: { stroke?: string }
    }[]
  }

  it('LinearProgress: the flat variant draws no SVG path', () => {
    renderWithTheme(<LinearProgress progress={0.5} testID="linear" />)
    expect(paths('linear')).toHaveLength(0)
  })

  it('LinearProgress: wavy draws the indicator as a stroked path in contentColor', () => {
    renderWithTheme(
      <LinearProgress
        progress={0.5}
        wavy
        contentColor="#123456"
        testID="linear"
      />,
    )
    const p = paths('linear')
    expect(p).toHaveLength(1)
    expect(p[0].props.stroke).toBe('#123456')
  })

  it('LinearProgress: wavy grows the bar by twice the wave amplitude', () => {
    renderWithTheme(<LinearProgress progress={0.5} wavy testID="linear" />)
    const flat = StyleSheet.flatten(screen.getByTestId('linear').props.style)
    expect(flat.height).toBe(10)
  })

  it('LinearProgress: wavy indeterminate draws a path too', () => {
    renderWithTheme(<LinearProgress wavy testID="linear" />)
    expect(paths('linear')).toHaveLength(1)
  })

  it('LinearProgress: wavy keeps the accessibility value', () => {
    renderWithTheme(<LinearProgress progress={0.42} wavy />)
    const bar = screen.getByRole('progressbar')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 42 })
  })

  it('CircularProgress: wavy replaces the arc circle with a path', () => {
    renderWithTheme(
      <CircularProgress
        progress={0.5}
        wavy
        contentColor="#123456"
        testID="c"
      />,
    )
    const circles = screen.getByTestId('c').findAllByType(Circle as never)
    expect(circles).toHaveLength(1)
    const p = paths('c')
    expect(p).toHaveLength(1)
    expect(p[0].props.stroke).toBe('#123456')
  })

  it('CircularProgress: wavy keeps the 48dp container', () => {
    renderWithTheme(<CircularProgress progress={0.5} wavy testID="c" />)
    const flat = StyleSheet.flatten(screen.getByTestId('c').props.style)
    expect(flat.width).toBe(48)
    expect(flat.height).toBe(48)
  })
})
