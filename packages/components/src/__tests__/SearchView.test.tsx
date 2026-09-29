import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { createRef } from 'react'
import { BackHandler, Platform, StyleSheet, Text } from 'react-native'
import type { TextInput, View } from 'react-native'
import { PortalHost } from '../portal/PortalHost'
import { SearchView } from '../search-view/SearchView'
import {
  SEARCH_VIEW_DOCKED_MIN_HEIGHT,
  SEARCH_VIEW_HEADER_HEIGHT,
} from '../search-view/styles'
import type { SearchViewProps } from '../search-view/types'

jest.mock('@rootnative/core', () => {
  const actual = jest.requireActual('@rootnative/core')
  return { ...actual, useBreakpoint: jest.fn(() => 'compact') }
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockedUseBreakpoint = require('@rootnative/core')
  .useBreakpoint as jest.Mock

function renderView(props?: Partial<SearchViewProps>) {
  return renderWithTheme(
    <PortalHost>
      <SearchView
        visible
        onDismiss={jest.fn()}
        placeholder="Search mail"
        testID="view"
        {...props}
      >
        <Text>Suggestions</Text>
      </SearchView>
    </PortalHost>,
  )
}

function styleOf(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style)
}

beforeEach(() => {
  mockedUseBreakpoint.mockReturnValue('compact')
})

describe('SearchView', () => {
  it('renders nothing while not visible', () => {
    renderView({ visible: false })
    expect(screen.queryByText('Suggestions')).toBeNull()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('renders a modal dialog named by its placeholder, with the body inside', () => {
    renderView()
    const surface = screen.getByTestId('view')
    expect(surface.props.role).toBe('dialog')
    expect(surface.props['aria-modal']).toBe(true)
    expect(surface.props.accessibilityViewIsModal).toBe(true)
    expect(surface.props.accessibilityLabel).toBe('Search mail')
    expect(screen.getByText('Suggestions')).toBeTruthy()
  })

  it('lets an explicit accessibilityLabel and role win', () => {
    renderView({ accessibilityLabel: 'Search contacts', role: 'alertdialog' })
    const surface = screen.getByTestId('view')
    expect(surface.props.accessibilityLabel).toBe('Search contacts')
    expect(surface.props.role).toBe('alertdialog')
  })

  it('has a searchbox with a Search key, auto-focused on native', () => {
    renderView()
    const input = screen.getByRole('searchbox')
    expect(input.props.accessibilityLabel).toBe('Search mail')
    expect(input.props.returnKeyType).toBe('search')
    expect(input.props.autoFocus).toBe(Platform.OS !== 'web')
  })

  it('has a 72dp header that is a search landmark', () => {
    renderView()
    const input = screen.getByRole('searchbox')
    const header = input.parent?.parent
    expect(header?.props.accessibilityRole).toBe('search')
    expect(StyleSheet.flatten(header?.props.style).height).toBe(
      SEARCH_VIEW_HEADER_HEIGHT,
    )
  })

  it('closes from the back button', () => {
    const onDismiss = jest.fn()
    renderView({ onDismiss })
    fireEvent.press(screen.getByLabelText('Back'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('names the back button from its prop', () => {
    renderView({ backAccessibilityLabel: 'Close search view' })
    expect(screen.getByLabelText('Close search view')).toBeTruthy()
  })

  it('reports typing and submits the query with onSearch', () => {
    const onChangeText = jest.fn()
    const onSearch = jest.fn()
    renderView({ value: 'rain', onChangeText, onSearch })
    const input = screen.getByRole('searchbox')
    expect(input.props.value).toBe('rain')
    fireEvent.changeText(input, 'rainbow')
    expect(onChangeText).toHaveBeenCalledWith('rainbow')
    fireEvent(input, 'submitEditing')
    expect(onSearch).toHaveBeenCalledWith('rain')
  })

  it('holds its own query when uncontrolled', () => {
    const onSearch = jest.fn()
    renderView({ defaultValue: 'sun', onSearch })
    const input = screen.getByRole('searchbox')
    expect(input.props.defaultValue).toBe('sun')
    fireEvent.changeText(input, 'sunset')
    fireEvent(input, 'submitEditing')
    expect(onSearch).toHaveBeenCalledWith('sunset')
  })

  it('shows a clear button only while the input holds text', () => {
    renderView({ value: '' })
    expect(screen.queryByLabelText('Clear search')).toBeNull()

    screen.unmount()
    renderView({ value: 'rain' })
    expect(screen.getByLabelText('Clear search')).toBeTruthy()

    screen.unmount()
    renderView({ value: 'rain', showClearButton: false })
    expect(screen.queryByLabelText('Clear search')).toBeNull()
  })

  it('empties the input through onChangeText and calls onClear', () => {
    const onChangeText = jest.fn()
    const onClear = jest.fn()
    renderView({ value: 'rain', onChangeText, onClear })
    fireEvent.press(screen.getByLabelText('Clear search'))
    expect(onChangeText).toHaveBeenCalledWith('')
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders trailing actions after the clear button', () => {
    const onPress = jest.fn()
    renderView({
      value: 'rain',
      actions: [{ icon: 'microphone', accessibilityLabel: 'Voice', onPress }],
    })
    fireEvent.press(screen.getByLabelText('Voice'))
    expect(onPress).toHaveBeenCalledTimes(1)
    const labels = screen
      .getAllByRole('button')
      .map((node) => node.props.accessibilityLabel)
    expect(labels.indexOf('Clear search')).toBeLessThan(labels.indexOf('Voice'))
  })

  it('forwards a ref to the input', () => {
    const ref = createRef<TextInput>()
    renderView({ ref })
    expect(ref.current).not.toBeNull()
    expect(typeof ref.current?.focus).toBe('function')
  })

  it('forwards inputProps to the input', () => {
    renderView({ inputProps: { autoCapitalize: 'none' } })
    expect(screen.getByRole('searchbox').props.autoCapitalize).toBe('none')
  })
})

describe('SearchView — layout', () => {
  it('is full screen on a compact window, with no dismiss area', () => {
    renderView()
    expect(styleOf('view').flex).toBe(1)
    expect(styleOf('view').borderRadius).toBeUndefined()
    expect(screen.queryByTestId('view-dismiss')).toBeNull()
  })

  it('docks on a wider window, at the extra-large corner and the minimum height', () => {
    mockedUseBreakpoint.mockReturnValue('expanded')
    renderView()
    const style = styleOf('view')
    expect(style.borderRadius).toBe(lightTheme.shape.cornerExtraLarge)
    expect(style.minHeight).toBe(SEARCH_VIEW_DOCKED_MIN_HEIGHT)
    expect(style.flex).toBeUndefined()
  })

  it('closes a docked view from a press outside it', () => {
    mockedUseBreakpoint.mockReturnValue('medium')
    const onDismiss = jest.fn()
    renderView({ onDismiss })
    fireEvent.press(screen.getByTestId('view-dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('follows an explicit layout over the breakpoint', () => {
    renderView({ layout: 'docked' })
    expect(styleOf('view').minHeight).toBe(SEARCH_VIEW_DOCKED_MIN_HEIGHT)

    screen.unmount()
    mockedUseBreakpoint.mockReturnValue('expanded')
    renderView({ layout: 'fullscreen' })
    expect(styleOf('view').flex).toBe(1)
  })

  it('waits for the anchor measurement before it mounts a docked surface', () => {
    const anchor = createRef<View>()
    renderView({ layout: 'docked', anchor })
    // No anchor node to measure, so the surface never mounts.
    expect(screen.queryByTestId('view')).toBeNull()
    expect(screen.getByTestId('view-dismiss')).toBeTruthy()
  })

  it('lets a docked body take its content height, and a full-screen body fill', () => {
    mockedUseBreakpoint.mockReturnValue('expanded')
    renderView()
    // With `flex: 1`, Yoga gives the body no intrinsic height, so a docked
    // surface stayed at its 240dp minimum and cut the list after three rows.
    expect(styleOf('view-body')).toEqual({ flexShrink: 1, minHeight: 0 })

    screen.unmount()
    mockedUseBreakpoint.mockReturnValue('compact')
    renderView()
    expect(styleOf('view-body').flex).toBe(1)
  })

  it('applies the container color to the surface', () => {
    renderView({ containerColor: '#123456' })
    expect(styleOf('view').backgroundColor).toBe('#123456')
  })
})

describe('SearchView — Android back', () => {
  const originalOS = Platform.OS

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS })
  })

  it('closes on the hardware back button on Android', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' })
    const onDismiss = jest.fn()
    const remove = jest.fn()
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockReturnValue({ remove })
    const { unmount } = renderView({ onDismiss })

    const handler = spy.mock.calls[0][1] as () => boolean
    expect(handler()).toBe(true)
    expect(onDismiss).toHaveBeenCalledTimes(1)

    unmount()
    expect(remove).toHaveBeenCalled()
    spy.mockRestore()
  })
})
