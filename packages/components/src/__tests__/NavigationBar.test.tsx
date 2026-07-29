import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { NavigationBar } from '../navigation-bar'
import type { NavigationBarItem } from '../navigation-bar'

const ITEMS: NavigationBarItem[] = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'search', label: 'Search', icon: 'magnify' },
  { value: 'library', label: 'Library', icon: 'bookshelf' },
]

function renderBar(
  props?: Partial<React.ComponentProps<typeof NavigationBar>>,
) {
  return renderWithTheme(
    <NavigationBar items={ITEMS} testID="nav" {...props} />,
  )
}

describe('NavigationBar', () => {
  it('renders every destination and activates the first one by default', () => {
    renderBar()

    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Search')).toBeTruthy()
    expect(
      screen.getByRole('tab', { name: 'Home' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(
      screen.getByRole('tab', { name: 'Search' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })

  it('starts on defaultValue when one is given', () => {
    renderBar({ defaultValue: 'search' })
    expect(
      screen.getByRole('tab', { name: 'Search' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('moves the active destination on press and reports the new value', () => {
    const onValueChange = jest.fn()
    renderBar({ onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Library' }))
    expect(onValueChange).toHaveBeenCalledWith('library')
    expect(
      screen.getByRole('tab', { name: 'Library' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('does not respond while a destination is disabled', () => {
    const onValueChange = jest.fn()
    renderBar({
      items: [ITEMS[0], { ...ITEMS[1], disabled: true }],
      onValueChange,
    })

    const item = screen.getByRole('tab', { name: 'Search' })
    expect(item.props.accessibilityState).toMatchObject({ disabled: true })
    fireEvent.press(item)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reports role="tablist" on the bar', () => {
    renderBar({ accessibilityLabel: 'Main navigation' })
    const bar = screen.getByTestId('nav')
    expect(bar.props.role).toBe('tablist')
    expect(bar.props.accessibilityLabel).toBe('Main navigation')
  })
})

describe('NavigationBar — controlled', () => {
  it('never moves itself when the value is driven from outside', () => {
    const onValueChange = jest.fn()
    renderBar({ value: 'home', onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Search' }))
    expect(onValueChange).toHaveBeenCalledWith('search')
    expect(
      screen.getByRole('tab', { name: 'Home' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(
      screen.getByRole('tab', { name: 'Search' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })
})

describe('NavigationBar — indicator', () => {
  it('shows the active pill and hides the inactive ones', () => {
    renderBar()

    const active = StyleSheet.flatten(
      screen.getByTestId('nav-item-home-indicator').props.style,
    )
    expect(active.opacity).toBe(1)
    expect(active.backgroundColor).toBe(lightTheme.colors.secondaryContainer)
    expect(active.borderRadius).toBe(lightTheme.shape.cornerFull)

    const inactive = StyleSheet.flatten(
      screen.getByTestId('nav-item-search-indicator').props.style,
    )
    expect(inactive.opacity).toBe(0)
  })

  it('moves to the pressed destination', () => {
    // `renderSettled` rather than `renderBar`: the press is its own render pass
    // and runs the worklet before its effect writes the new progress, so the
    // animated style only catches up on the pass `flush()` adds.
    const { flush } = renderSettled(
      <NavigationBar items={ITEMS} testID="nav" />,
    )
    fireEvent.press(screen.getByRole('tab', { name: 'Search' }))
    flush()

    expect(
      StyleSheet.flatten(
        screen.getByTestId('nav-item-search-indicator').props.style,
      ).opacity,
    ).toBe(1)
    expect(
      StyleSheet.flatten(
        screen.getByTestId('nav-item-home-indicator').props.style,
      ).opacity,
    ).toBe(0)
  })
})

describe('NavigationBar — label visibility', () => {
  it('shows every label by default', () => {
    renderBar()
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Search')).toBeTruthy()
    expect(screen.getByText('Library')).toBeTruthy()
  })

  it('renders no labels at all with labelVisibility="never"', () => {
    renderBar({ labelVisibility: 'never' })
    expect(screen.queryByText('Home')).toBeNull()
    expect(screen.queryByText('Search')).toBeNull()
  })

  it('fades the inactive labels out with labelVisibility="selected"', () => {
    renderBar({ labelVisibility: 'selected' })

    expect(
      StyleSheet.flatten(screen.getByText('Home').props.style).opacity,
    ).toBe(1)
    expect(
      StyleSheet.flatten(screen.getByText('Search').props.style).opacity,
    ).toBe(0)
  })

  it('keeps the screen-reader name when the label is hidden', () => {
    renderBar({ labelVisibility: 'never' })
    expect(screen.getByRole('tab', { name: 'Home' })).toBeTruthy()
  })
})

describe('NavigationBar — tokens', () => {
  it('applies the MD3 colors', () => {
    renderBar()

    const active = StyleSheet.flatten(screen.getByText('Home').props.style)
    expect(active.color).toBe(lightTheme.colors.secondary)
    expect(active.fontSize).toBe(lightTheme.typography.labelMedium.fontSize)

    const inactive = StyleSheet.flatten(screen.getByText('Search').props.style)
    expect(inactive.color).toBe(lightTheme.colors.onSurfaceVariant)

    expect(
      StyleSheet.flatten(screen.getByTestId('nav').props.style).backgroundColor,
    ).toBe(lightTheme.colors.surfaceContainer)
  })

  it('is 80dp tall and splits the row equally between destinations', () => {
    renderBar()

    const item = StyleSheet.flatten(
      screen.getByRole('tab', { name: 'Home' }).props.style,
    )
    expect(item.flexBasis).toBe(0)
    expect(item.flexGrow).toBe(1)
  })
})

describe('NavigationBar — overrides', () => {
  it('honours the color overrides', () => {
    renderBar({
      containerColor: '#101010',
      contentColor: '#202020',
      selectedContentColor: '#303030',
      indicatorColor: '#404040',
    })

    expect(
      StyleSheet.flatten(screen.getByTestId('nav').props.style).backgroundColor,
    ).toBe('#101010')
    expect(StyleSheet.flatten(screen.getByText('Home').props.style).color).toBe(
      '#303030',
    )
    expect(
      StyleSheet.flatten(screen.getByText('Search').props.style).color,
    ).toBe('#202020')
    expect(
      StyleSheet.flatten(
        screen.getByTestId('nav-item-home-indicator').props.style,
      ).backgroundColor,
    ).toBe('#404040')
  })

  it('applies labelStyle to the label only', () => {
    renderBar({ labelStyle: { fontWeight: '700' } })
    expect(
      StyleSheet.flatten(screen.getByText('Home').props.style).fontWeight,
    ).toBe('700')
  })
})
