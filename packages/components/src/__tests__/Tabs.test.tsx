import { lightTheme } from '@rootnative/core'
import { renderSettled, renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Tabs } from '../tabs'
import type { TabItem } from '../tabs'

const ITEMS: TabItem[] = [
  { value: 'flights', label: 'Flights' },
  { value: 'trips', label: 'Trips' },
  { value: 'explore', label: 'Explore' },
]

function renderTabs(props?: Partial<React.ComponentProps<typeof Tabs>>) {
  return renderWithTheme(<Tabs items={ITEMS} testID="tabs" {...props} />)
}

/**
 * Feed the row the geometry the indicator is placed from. Two layout events
 * per tab: the tab's own box (from the pressable) and its content box — firing
 * on the label finds the content view, which is the nearest ancestor with an
 * `onLayout`.
 */
function layOutTab(name: string, x: number, width: number, content: number) {
  fireEvent(screen.getByRole('tab', { name }), 'layout', {
    nativeEvent: { layout: { x, y: 0, width, height: 48 } },
  })
  fireEvent(screen.getByText(name), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: content, height: 20 } },
  })
}

function layOutRow() {
  layOutTab('Flights', 0, 120, 60)
  layOutTab('Trips', 120, 120, 40)
  layOutTab('Explore', 240, 120, 70)
}

describe('Tabs', () => {
  it('renders every tab and activates the first one by default', () => {
    renderTabs()

    expect(screen.getByText('Flights')).toBeTruthy()
    expect(screen.getByText('Trips')).toBeTruthy()
    expect(
      screen.getByRole('tab', { name: 'Flights' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(
      screen.getByRole('tab', { name: 'Trips' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })

  it('starts on defaultValue when one is given', () => {
    renderTabs({ defaultValue: 'trips' })
    expect(
      screen.getByRole('tab', { name: 'Trips' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('moves the active tab on press and reports the new value', () => {
    const onValueChange = jest.fn()
    renderTabs({ onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Explore' }))
    expect(onValueChange).toHaveBeenCalledWith('explore')
    expect(
      screen.getByRole('tab', { name: 'Explore' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
  })

  it('does not respond while an item is disabled', () => {
    const onValueChange = jest.fn()
    renderTabs({
      items: [ITEMS[0], { ...ITEMS[1], disabled: true }],
      onValueChange,
    })

    const tab = screen.getByRole('tab', { name: 'Trips' })
    expect(tab.props.accessibilityState).toMatchObject({ disabled: true })
    fireEvent.press(tab)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('draws the bottom divider unless it is turned off', () => {
    renderTabs()
    expect(screen.getByTestId('tabs-divider')).toBeTruthy()

    screen.unmount()
    renderTabs({ showDivider: false })
    expect(screen.queryByTestId('tabs-divider')).toBeNull()
  })

  it('reports role="tablist" on the row', () => {
    renderTabs({ accessibilityLabel: 'Sections' })
    const row = screen.getByTestId('tabs')
    expect(row.props.role).toBe('tablist')
    expect(row.props.accessibilityLabel).toBe('Sections')
  })
})

describe('Tabs — controlled', () => {
  it('never moves itself when the value is driven from outside', () => {
    const onValueChange = jest.fn()
    renderTabs({ value: 'flights', onValueChange })

    fireEvent.press(screen.getByRole('tab', { name: 'Trips' }))
    expect(onValueChange).toHaveBeenCalledWith('trips')
    expect(
      screen.getByRole('tab', { name: 'Flights' }).props.accessibilityState,
    ).toMatchObject({ selected: true })
    expect(
      screen.getByRole('tab', { name: 'Trips' }).props.accessibilityState,
    ).toMatchObject({ selected: false })
  })
})

describe('Tabs — indicator', () => {
  it('stays unmounted until the active tab has been measured', () => {
    renderTabs()
    expect(screen.queryByTestId('tabs-indicator')).toBeNull()

    layOutRow()
    expect(screen.getByTestId('tabs-indicator')).toBeTruthy()
  })

  it('matches the label width and centres under the tab on a primary row', () => {
    renderTabs()
    layOutRow()

    const style = StyleSheet.flatten(
      screen.getByTestId('tabs-indicator').props.style,
    )
    // 60dp of label, centred in a 120dp tab starting at 0.
    expect(style.width).toBe(60)
    expect(style.transform).toEqual([{ translateX: 30 }])
    expect(style.height).toBe(3)
    expect(style.backgroundColor).toBe(lightTheme.colors.primary)
  })

  it('never shrinks below the 24dp minimum', () => {
    renderTabs()
    layOutTab('Flights', 0, 120, 8)

    const style = StyleSheet.flatten(
      screen.getByTestId('tabs-indicator').props.style,
    )
    expect(style.width).toBe(24)
    expect(style.transform).toEqual([{ translateX: 48 }])
  })

  it('spans the whole tab on a secondary row, at 2dp', () => {
    renderTabs({ variant: 'secondary', defaultValue: 'trips' })
    layOutRow()

    const style = StyleSheet.flatten(
      screen.getByTestId('tabs-indicator').props.style,
    )
    expect(style.width).toBe(120)
    expect(style.transform).toEqual([{ translateX: 120 }])
    expect(style.height).toBe(2)
  })

  // MD3 caps the primary indicator on its top edge only and leaves the
  // secondary one a plain rule. Rounding all four corners of either would lift
  // it off the tab it marks.
  it('rounds the top edge of a primary indicator and nothing else', () => {
    renderTabs()
    layOutRow()

    const style = StyleSheet.flatten(
      screen.getByTestId('tabs-indicator').props.style,
    )
    expect(style.borderTopLeftRadius).toBe(3)
    expect(style.borderTopRightRadius).toBe(3)
    expect(style.borderRadius).toBeUndefined()
    expect(style.borderBottomLeftRadius).toBeUndefined()
    expect(style.borderBottomRightRadius).toBeUndefined()
  })

  it('leaves a secondary indicator square', () => {
    renderTabs({ variant: 'secondary' })
    layOutRow()

    const style = StyleSheet.flatten(
      screen.getByTestId('tabs-indicator').props.style,
    )
    expect(style.borderTopLeftRadius).toBe(0)
    expect(style.borderTopRightRadius).toBe(0)
  })

  it('follows the selection', () => {
    // `renderSettled` rather than `renderTabs`: the press is its own render pass
    // and runs the worklet before its effect writes the new progress, so without
    // the pass `flush()` adds this asserts the geometry of the tab that was just
    // deselected.
    const { flush } = renderSettled(<Tabs items={ITEMS} testID="tabs" />)
    layOutRow()
    fireEvent.press(screen.getByRole('tab', { name: 'Explore' }))
    flush()

    const style = StyleSheet.flatten(
      screen.getByTestId('tabs-indicator').props.style,
    )
    expect(style.width).toBe(70)
    // 240 tab start + (120 - 70) / 2.
    expect(style.transform).toEqual([{ translateX: 265 }])
  })
})

describe('Tabs — tokens', () => {
  it('applies the MD3 primary colors', () => {
    renderTabs()

    const active = StyleSheet.flatten(screen.getByText('Flights').props.style)
    expect(active.color).toBe(lightTheme.colors.primary)
    expect(active.fontSize).toBe(lightTheme.typography.titleSmall.fontSize)

    const inactive = StyleSheet.flatten(screen.getByText('Trips').props.style)
    expect(inactive.color).toBe(lightTheme.colors.onSurfaceVariant)

    expect(
      StyleSheet.flatten(screen.getByTestId('tabs').props.style)
        .backgroundColor,
    ).toBe(lightTheme.colors.surface)
  })

  it('activates with onSurface on a secondary row', () => {
    renderTabs({ variant: 'secondary' })
    expect(
      StyleSheet.flatten(screen.getByText('Flights').props.style).color,
    ).toBe(lightTheme.colors.onSurface)
  })

  it('is 48dp tall, and 64dp when a primary tab stacks an icon over its label', () => {
    renderTabs()
    expect(
      StyleSheet.flatten(
        screen.getByRole('tab', { name: 'Flights' }).props.style,
      ).minHeight,
    ).toBe(48)

    screen.unmount()
    renderTabs({
      items: [{ value: 'flights', label: 'Flights', icon: 'airplane' }],
    })
    expect(
      StyleSheet.flatten(
        screen.getByRole('tab', { name: 'Flights' }).props.style,
      ).minHeight,
    ).toBe(64)
  })

  it('keeps a secondary tab at 48dp with its icon inline', () => {
    renderTabs({
      variant: 'secondary',
      items: [{ value: 'flights', label: 'Flights', icon: 'airplane' }],
    })
    expect(
      StyleSheet.flatten(
        screen.getByRole('tab', { name: 'Flights' }).props.style,
      ).minHeight,
    ).toBe(48)
  })

  it('divides the row equally when fixed and floors tab width when scrollable', () => {
    renderTabs()
    expect(
      StyleSheet.flatten(screen.getByRole('tab', { name: 'Trips' }).props.style)
        .flexBasis,
    ).toBe(0)

    screen.unmount()
    renderTabs({ scrollable: true })
    const style = StyleSheet.flatten(
      screen.getByRole('tab', { name: 'Trips' }).props.style,
    )
    expect(style.minWidth).toBe(90)
    expect(style.flexBasis).toBeUndefined()
  })
})

describe('Tabs — overrides', () => {
  it('honours the color overrides', () => {
    renderTabs({
      containerColor: '#101010',
      contentColor: '#202020',
      selectedContentColor: '#303030',
      indicatorColor: '#404040',
    })
    layOutRow()

    expect(
      StyleSheet.flatten(screen.getByTestId('tabs').props.style)
        .backgroundColor,
    ).toBe('#101010')
    expect(
      StyleSheet.flatten(screen.getByText('Flights').props.style).color,
    ).toBe('#303030')
    expect(
      StyleSheet.flatten(screen.getByText('Trips').props.style).color,
    ).toBe('#202020')
    expect(
      StyleSheet.flatten(screen.getByTestId('tabs-indicator').props.style)
        .backgroundColor,
    ).toBe('#404040')
  })

  it('applies labelStyle to the label only', () => {
    renderTabs({ labelStyle: { fontWeight: '700' } })
    expect(
      StyleSheet.flatten(screen.getByText('Flights').props.style).fontWeight,
    ).toBe('700')
  })
})
