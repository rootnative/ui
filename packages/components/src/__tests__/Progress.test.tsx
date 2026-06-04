import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
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
