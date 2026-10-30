import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { BottomAppBar } from '../bottom-app-bar'
import { BOTTOM_APP_BAR_HEIGHT } from '../bottom-app-bar/styles'

const ACTIONS = [
  { icon: 'magnify', accessibilityLabel: 'Search' },
  { icon: 'delete-outline', accessibilityLabel: 'Delete' },
]

describe('BottomAppBar', () => {
  it('renders each action as a button with its label', () => {
    renderWithTheme(<BottomAppBar actions={ACTIONS} />)
    expect(screen.getByLabelText('Search')).toBeTruthy()
    expect(screen.getByLabelText('Delete')).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('calls the onPress of the action that was pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <BottomAppBar
        actions={[{ icon: 'magnify', accessibilityLabel: 'Search', onPress }]}
      />,
    )
    fireEvent.press(screen.getByLabelText('Search'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call the onPress of a disabled action', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <BottomAppBar
        actions={[
          {
            icon: 'magnify',
            accessibilityLabel: 'Search',
            onPress,
            disabled: true,
          },
        ]}
      />,
    )
    fireEvent.press(screen.getByLabelText('Search'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders the fab after the actions and calls its onPress', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <BottomAppBar
        actions={ACTIONS}
        fab={{ icon: 'plus', accessibilityLabel: 'Add', onPress }}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[2].props.accessibilityLabel).toBe('Add')
    fireEvent.press(buttons[2])
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders an extended fab from its label', () => {
    renderWithTheme(
      <BottomAppBar fab={{ icon: 'pencil-outline', label: 'Compose' }} />,
    )
    expect(screen.getByText('Compose')).toBeTruthy()
    expect(screen.getByRole('button').props.accessibilityLabel).toBe('Compose')
  })

  it('colors the fab as the secondary variant by default', () => {
    renderWithTheme(
      <BottomAppBar fab={{ icon: 'plus', accessibilityLabel: 'Add' }} />,
    )
    const flat = StyleSheet.flatten(screen.getByRole('button').props.style)
    expect(flat.backgroundColor).toBe(lightTheme.colors.secondaryContainer)
  })

  it('takes a fab variant', () => {
    renderWithTheme(
      <BottomAppBar
        fab={{ icon: 'plus', accessibilityLabel: 'Add', variant: 'tertiary' }}
      />,
    )
    const flat = StyleSheet.flatten(screen.getByRole('button').props.style)
    expect(flat.backgroundColor).toBe(lightTheme.colors.tertiaryContainer)
  })

  it('renders custom leading content', () => {
    renderWithTheme(
      <BottomAppBar leading={<Text testID="custom-leading">Custom</Text>} />,
    )
    expect(screen.getByTestId('custom-leading')).toBeTruthy()
  })

  // `leading` and `actions` fill the same slot, so the type makes them
  // mutually exclusive. @ts-expect-error is the assertion: it fails the
  // build if the union ever stops rejecting the pair.
  it('rejects actions and leading together at the type level', () => {
    renderWithTheme(
      // @ts-expect-error - leading cannot be combined with actions
      <BottomAppBar
        actions={ACTIONS}
        leading={<Text testID="custom-leading">Custom</Text>}
      />,
    )
    // A consumer on plain JS gets no type error, so `leading` must keep
    // winning rather than rendering both slots.
    expect(screen.queryByLabelText('Search')).toBeNull()
    expect(screen.getByTestId('custom-leading')).toBeTruthy()
  })

  it('is a toolbar of the bar height on a surfaceContainer background', () => {
    renderWithTheme(<BottomAppBar actions={ACTIONS} testID="bar" />)
    const bar = screen.getByTestId('bar')
    expect(bar.props.role).toBe('toolbar')
    expect(StyleSheet.flatten(bar.props.style).backgroundColor).toBe(
      lightTheme.colors.surfaceContainer,
    )
    expect(StyleSheet.flatten(bar.props.children.props.style).height).toBe(
      BOTTOM_APP_BAR_HEIGHT,
    )
  })

  it('lets a consumer role replace the toolbar', () => {
    renderWithTheme(
      <BottomAppBar actions={ACTIONS} role="navigation" testID="bar" />,
    )
    expect(screen.getByTestId('bar').props.role).toBe('navigation')
  })

  it('wraps the row in a bottom SafeAreaView with insetBottom', () => {
    renderWithTheme(<BottomAppBar actions={ACTIONS} insetBottom testID="bar" />)
    const safeArea = screen.getByTestId('bar').props.children
    expect(safeArea.props.edges).toEqual(['bottom'])
  })

  describe('overrides', () => {
    it('applies containerColor to the bar background', () => {
      renderWithTheme(
        <BottomAppBar
          actions={ACTIONS}
          containerColor="#FF0000"
          testID="bar"
        />,
      )
      const flat = StyleSheet.flatten(screen.getByTestId('bar').props.style)
      expect(flat.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the action icons', () => {
      renderWithTheme(<BottomAppBar actions={ACTIONS} contentColor="#00FF00" />)
      const icon = screen.getByText('magnify', { includeHiddenElements: true })
      expect(icon.props.color).toBe('#00FF00')
    })

    it('colors the action icons onSurfaceVariant by default', () => {
      renderWithTheme(<BottomAppBar actions={ACTIONS} />)
      const icon = screen.getByText('magnify', { includeHiddenElements: true })
      expect(icon.props.color).toBe(lightTheme.colors.onSurfaceVariant)
    })

    it('applies the style prop to the bar', () => {
      renderWithTheme(
        <BottomAppBar
          actions={ACTIONS}
          style={{ opacity: 0.5 }}
          testID="bar"
        />,
      )
      const flat = StyleSheet.flatten(screen.getByTestId('bar').props.style)
      expect(flat.opacity).toBe(0.5)
    })
  })
})
