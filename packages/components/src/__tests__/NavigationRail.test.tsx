import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { NavigationRail } from '../navigation-rail'
import type { NavigationRailItem } from '../navigation-rail'

const ITEMS: NavigationRailItem[] = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'search', label: 'Search', icon: 'magnify' },
  { value: 'library', label: 'Library', icon: 'bookshelf' },
]

function renderRail(
  props?: Partial<React.ComponentProps<typeof NavigationRail>>,
) {
  return renderWithTheme(
    <NavigationRail items={ITEMS} testID="rail" {...props} />,
  )
}

describe('NavigationRail', () => {
  it('renders every destination and activates the first one by default', () => {
    renderRail()

    expect(screen.getByText('Home')).toBeTruthy()
    expect(
      screen.getByRole('tab', { name: 'Home' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(
      screen.getByRole('tab', { name: 'Search' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })

  it('starts on defaultValue when one is given', () => {
    renderRail({ defaultValue: 'search' })
    expect(
      screen.getByRole('tab', { name: 'Search' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('moves the active destination on press and reports the new value', () => {
    const onValueChange = jest.fn()
    renderRail({ onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Library' }))
    expect(onValueChange).toHaveBeenCalledWith('library')
    expect(
      screen.getByRole('tab', { name: 'Library' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('never moves itself when the value is driven from outside', () => {
    const onValueChange = jest.fn()
    renderRail({ value: 'home', onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Search' }))
    expect(onValueChange).toHaveBeenCalledWith('search')
    expect(
      screen.getByRole('tab', { name: 'Home' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('does not respond while a destination is disabled', () => {
    const onValueChange = jest.fn()
    renderRail({
      items: [ITEMS[0], { ...ITEMS[1], disabled: true }],
      onValueChange,
    })

    const item = screen.getByRole('tab', { name: 'Search' })
    expect(item.props.accessibilityState).toMatchObject({ disabled: true })
    fireEvent.press(item)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('renders the header above the destinations', () => {
    renderRail({ header: <Text>Menu</Text> })
    expect(screen.getByText('Menu')).toBeTruthy()
  })

  it('groups the destinations as a tablist and names the rail', () => {
    renderRail({ accessibilityLabel: 'Main navigation' })
    const destinations = screen.getByTestId('rail-destinations')
    expect(destinations.props.role).toBe('tablist')
    expect(destinations.props.accessibilityLabel).toBe('Main navigation')
  })
})

describe('NavigationRail — indicator', () => {
  it('shows the active pill and hides the inactive ones', () => {
    renderRail()

    const active = StyleSheet.flatten(
      screen.getByTestId('rail-item-home-indicator').props.style,
    )
    expect(active.opacity).toBe(1)
    expect(active.backgroundColor).toBe(lightTheme.colors.secondaryContainer)

    const inactive = StyleSheet.flatten(
      screen.getByTestId('rail-item-search-indicator').props.style,
    )
    expect(inactive.opacity).toBe(0)
  })

  it('moves to the pressed destination', () => {
    const { flush } = renderSettled(
      <NavigationRail items={ITEMS} testID="rail" />,
    )
    fireEvent.press(screen.getByRole('tab', { name: 'Search' }))
    flush()

    expect(
      StyleSheet.flatten(
        screen.getByTestId('rail-item-search-indicator').props.style,
      ).opacity,
    ).toBe(1)
    expect(
      StyleSheet.flatten(
        screen.getByTestId('rail-item-home-indicator').props.style,
      ).opacity,
    ).toBe(0)
  })
})

describe('NavigationRail — label visibility', () => {
  it('renders no labels with labelVisibility="never" and keeps the name', () => {
    renderRail({ labelVisibility: 'never' })
    expect(screen.queryByText('Home')).toBeNull()
    expect(screen.getByRole('tab', { name: 'Home' })).toBeTruthy()
  })

  it('fades the inactive labels out with labelVisibility="selected"', () => {
    renderRail({ labelVisibility: 'selected' })
    expect(
      StyleSheet.flatten(screen.getByText('Home').props.style).opacity,
    ).toBe(1)
    expect(
      StyleSheet.flatten(screen.getByText('Search').props.style).opacity,
    ).toBe(0)
  })
})

describe('NavigationRail — tokens', () => {
  it('is 80dp wide on a surface background', () => {
    renderRail()
    const root = StyleSheet.flatten(screen.getByTestId('rail').props.style)
    expect(root.width).toBe(80)
    expect(root.backgroundColor).toBe(lightTheme.colors.surface)
  })

  it('sizes each destination as an 80dp block at least 56dp tall', () => {
    renderRail()
    const item = StyleSheet.flatten(
      screen.getByRole('tab', { name: 'Home' }).props.style,
    )
    expect(item.width).toBe(80)
    expect(item.minHeight).toBe(56)
  })

  it('applies the MD3 colors', () => {
    renderRail()
    const active = StyleSheet.flatten(screen.getByText('Home').props.style)
    expect(active.color).toBe(lightTheme.colors.secondary)
    expect(active.fontSize).toBe(lightTheme.typography.labelMedium.fontSize)
    const inactive = StyleSheet.flatten(screen.getByText('Search').props.style)
    expect(inactive.color).toBe(lightTheme.colors.onSurfaceVariant)
  })

  it('aligns the destinations per `align`', () => {
    const { rerender } = renderRail()
    const column = () =>
      StyleSheet.flatten(screen.getByTestId('rail-destinations').props.style)
    expect(column().justifyContent).toBe('flex-start')

    rerender(<NavigationRail items={ITEMS} testID="rail" align="center" />)
    expect(column().justifyContent).toBe('center')

    rerender(<NavigationRail items={ITEMS} testID="rail" align="bottom" />)
    expect(column().justifyContent).toBe('flex-end')
  })
})

describe('NavigationRail — overrides', () => {
  it('honours the color overrides', () => {
    renderRail({
      containerColor: '#101010',
      contentColor: '#202020',
      selectedContentColor: '#303030',
      indicatorColor: '#404040',
    })

    expect(
      StyleSheet.flatten(screen.getByTestId('rail').props.style)
        .backgroundColor,
    ).toBe('#101010')
    expect(StyleSheet.flatten(screen.getByText('Home').props.style).color).toBe(
      '#303030',
    )
    expect(
      StyleSheet.flatten(screen.getByText('Search').props.style).color,
    ).toBe('#202020')
    expect(
      StyleSheet.flatten(
        screen.getByTestId('rail-item-home-indicator').props.style,
      ).backgroundColor,
    ).toBe('#404040')
  })

  it('applies labelStyle to the label only', () => {
    renderRail({ labelStyle: { fontWeight: '700' } })
    expect(
      StyleSheet.flatten(screen.getByText('Home').props.style).fontWeight,
    ).toBe('700')
  })
})
