import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
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

  it('is a navigation landmark around a named tablist', () => {
    renderBar({ accessibilityLabel: 'Main navigation' })
    expect(screen.getByTestId('nav').props.role).toBe('navigation')
    const tablist = screen.getByTestId('nav-tablist')
    expect(tablist.props.role).toBe('tablist')
    expect(tablist.props.accessibilityLabel).toBe('Main navigation')
  })

  it('takes a role from the props', () => {
    renderBar({ role: 'tablist' })
    expect(screen.getByTestId('nav').props.role).toBe('tablist')
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

type Style = Record<string, unknown>

/** Every node's flattened style, in tree order. */
function styles(node: unknown): Style[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(styles)
  const { props, children } = node as {
    props?: { style?: unknown }
    children?: unknown[]
  }
  const own = props?.style ? [StyleSheet.flatten(props.style) as Style] : []
  return [...own, ...(children ?? []).flatMap(styles)]
}

/** The view that places the floating capsule in its parent. */
function track(): Style {
  const found = styles(screen.toJSON()).find(
    (style) => style.position === 'absolute' && style.left === 0,
  )
  if (!found) throw new Error('no track')
  return found
}

function insetsOf(bottom: number, left = 0, right = 0) {
  return {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, bottom, left, right },
  }
}

describe('NavigationBar — floating', () => {
  it('shows an icon for each destination and names it with the label', () => {
    renderBar({ variant: 'floating' })

    expect(screen.queryByText('Home')).toBeNull()
    expect(screen.queryByText('Search')).toBeNull()
    expect(
      screen.getByRole('tab', { name: 'Home' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(screen.getByRole('tab', { name: 'Library' })).toBeTruthy()
  })

  it('is a navigation landmark around a named tablist', () => {
    renderBar({ variant: 'floating', accessibilityLabel: 'Main navigation' })
    expect(screen.getByTestId('nav').props.role).toBe('navigation')
    const tablist = screen.getByTestId('nav-tablist')
    expect(tablist.props.role).toBe('tablist')
    expect(tablist.props.accessibilityLabel).toBe('Main navigation')
  })

  it('moves the active destination on press', () => {
    const onValueChange = jest.fn()
    renderBar({ variant: 'floating', onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Search' }))
    expect(onValueChange).toHaveBeenCalledWith('search')
    expect(
      screen.getByRole('tab', { name: 'Search' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('is a 64dp capsule, at most 480 wide, on surfaceContainer', () => {
    renderBar({ variant: 'floating' })

    const capsule = StyleSheet.flatten(screen.getByTestId('nav').props.style)
    expect(capsule).toMatchObject({
      width: '100%',
      maxWidth: 480,
      borderRadius: lightTheme.shape.cornerFull,
      backgroundColor: lightTheme.colors.surfaceContainer,
    })
    expect(
      StyleSheet.flatten(screen.getByTestId('nav-tablist').props.style),
    ).toMatchObject({ height: 64, padding: 6, gap: 4 })
  })

  it('fills each destination with its indicator', () => {
    renderBar({ variant: 'floating' })

    // The docked bar lays the indicator out in a 56×32 pill. The floating
    // pill grows to fill the destination instead.
    const all = styles(screen.toJSON())
    expect(all.some((style) => style.width === 56)).toBe(false)
    const item = StyleSheet.flatten(
      screen.getByRole('tab', { name: 'Home' }).props.style,
    )
    expect(item).toMatchObject({ flexGrow: 1, flexBasis: 0 })
    expect(item.paddingHorizontal).toBeUndefined()
    expect(
      StyleSheet.flatten(
        screen.getByTestId('nav-item-home-indicator').props.style,
      ).opacity,
    ).toBe(1)
  })

  it('keeps the color overrides', () => {
    renderBar({
      variant: 'floating',
      containerColor: '#101010',
      indicatorColor: '#404040',
    })

    expect(
      StyleSheet.flatten(screen.getByTestId('nav').props.style).backgroundColor,
    ).toBe('#101010')
    expect(
      StyleSheet.flatten(
        screen.getByTestId('nav-item-home-indicator').props.style,
      ).backgroundColor,
    ).toBe('#404040')
  })

  it('sits 16 from the edges outside a SafeAreaProvider', () => {
    renderBar({ variant: 'floating' })
    expect(track()).toMatchObject({
      bottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
      pointerEvents: 'box-none',
    })
  })

  it('floats over a bottom inset that holds only a gesture handle', () => {
    renderWithTheme(
      <SafeAreaProvider initialMetrics={insetsOf(34)}>
        <NavigationBar items={ITEMS} variant="floating" />
      </SafeAreaProvider>,
    )
    expect(track().bottom).toBe(16)
  })

  it('stays above a taller bottom inset', () => {
    renderWithTheme(
      <SafeAreaProvider initialMetrics={insetsOf(48)}>
        <NavigationBar items={ITEMS} variant="floating" />
      </SafeAreaProvider>,
    )
    expect(track().bottom).toBe(64)
  })

  it('keeps the gap inside the side insets', () => {
    renderWithTheme(
      <SafeAreaProvider initialMetrics={insetsOf(21, 59, 47)}>
        <NavigationBar items={ITEMS} variant="floating" />
      </SafeAreaProvider>,
    )
    expect(track()).toMatchObject({ paddingLeft: 75, paddingRight: 63 })
  })

  // The floating bar shows no label and reads the bottom inset by itself.
  // The directive is the assertion: it fails the build if the union ever
  // stops rejecting the docked props. The type error is on the attribute,
  // because `never` rejects its value, so the directive sits above it.
  it('rejects the docked props at the type level', () => {
    renderWithTheme(
      <NavigationBar
        items={ITEMS}
        variant="floating"
        // @ts-expect-error - a floating bar shows no label
        labelVisibility="always"
        testID="nav"
      />,
    )
    // A consumer on plain JS gets no type error, so the label stays hidden.
    expect(screen.queryByText('Home')).toBeNull()
  })
})
