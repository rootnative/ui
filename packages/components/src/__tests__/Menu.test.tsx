import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { fireEvent, screen, within } from '@testing-library/react-native'
import { useState } from 'react'
import type {
  MeasureInWindowOnSuccessCallback,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { I18nManager, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../button'
import { Divider } from '../divider'
import { __resetWarnOnceForTests } from '../internal/warnOnce'
import { Menu, MenuGroup } from '../menu'
import { PortalHost } from '../portal/PortalHost'

type MeasureInWindow = (callback: MeasureInWindowOnSuccessCallback) => void

/**
 * Native RTL. React Native applies `left` to the right side while
 * `doLeftAndRightSwapInRTL` is on, the default.
 */
function setDirection(isRTL: boolean, doLeftAndRightSwapInRTL: boolean) {
  Object.defineProperty(I18nManager, 'isRTL', {
    value: isRTL,
    configurable: true,
  })
  Object.defineProperty(I18nManager, 'doLeftAndRightSwapInRTL', {
    value: doLeftAndRightSwapInRTL,
    configurable: true,
  })
}

const originalDirection = {
  isRTL: I18nManager.isRTL,
  doLeftAndRightSwapInRTL: I18nManager.doLeftAndRightSwapInRTL,
}

function renderMenu(ui: React.ReactElement) {
  return renderWithTheme(<PortalHost>{ui}</PortalHost>)
}

/** The uncontrolled shape: a trigger the menu hooks itself. */
function UncontrolledMenu(props: Partial<React.ComponentProps<typeof Menu>>) {
  return (
    <Menu anchor={<Button>Actions</Button>} testID="menu" {...props}>
      <Menu.Item label="Edit" />
      <Menu.Item label="Delete" />
    </Menu>
  )
}

/**
 * The surface is looked up by `testID`, not by `role="menu"`: the surface is
 * deliberately not an accessibility element — marking it one would collapse the
 * items beneath it into a single node for screen readers — and RNTL's `byRole`
 * only matches accessibility elements.
 */
async function open() {
  fireEvent.press(screen.getByRole('button', { name: 'Actions' }))
  return screen.findByTestId('menu')
}

/** Top-left, top-right, bottom-left and bottom-right radius. */
function cornersOf(node: { props: { style?: unknown } }) {
  const style = getStyle(node)
  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomLeftRadius,
    style.borderBottomRightRadius,
  ]
}

function corners(testID: string) {
  return cornersOf(screen.getByTestId(testID))
}

describe('Menu', () => {
  it('renders the anchor and nothing else while closed', () => {
    renderMenu(<UncontrolledMenu />)
    expect(screen.getByText('Actions')).toBeTruthy()
    expect(screen.queryByTestId('menu')).toBeNull()
    expect(screen.queryByText('Edit')).toBeNull()
  })

  it('opens on an anchor press when it manages its own visibility', async () => {
    renderMenu(<UncontrolledMenu />)
    await open()
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it("still calls the anchor's own onPress", async () => {
    const onPress = jest.fn()
    renderMenu(
      <Menu anchor={<Button onPress={onPress}>Actions</Button>} testID="menu">
        <Menu.Item label="Edit" />
      </Menu>,
    )
    await open()
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('closes on an item press, after running the item handler', async () => {
    const onItemPress = jest.fn()
    const onDismiss = jest.fn()
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        onDismiss={onDismiss}
        testID="menu"
      >
        <Menu.Item label="Edit" onPress={onItemPress} />
      </Menu>,
    )
    await open()

    fireEvent.press(screen.getByText('Edit'))
    expect(onItemPress).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('keeps itself open for an item with closeOnPress={false}', async () => {
    const onDismiss = jest.fn()
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        onDismiss={onDismiss}
        testID="menu"
      >
        <Menu.Item label="Show hidden" closeOnPress={false} />
      </Menu>,
    )
    await open()

    fireEvent.press(screen.getByText('Show hidden'))
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByTestId('menu')).toBeTruthy()
  })

  it('dismisses on an outside press', async () => {
    const onDismiss = jest.fn()
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        onDismiss={onDismiss}
        testID="menu"
      >
        <Menu.Item label="Edit" />
      </Menu>,
    )
    await open()

    fireEvent.press(screen.getByLabelText('Close menu'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('honours a custom dismiss label', async () => {
    renderMenu(<UncontrolledMenu dismissAccessibilityLabel="Dismiss actions" />)
    await open()
    expect(screen.getByLabelText('Dismiss actions')).toBeTruthy()
  })

  it('renders arbitrary children alongside items', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Edit" />
        <Divider testID="menu-divider" />
        <Menu.Item label="Delete" />
      </Menu>,
    )
    await open()
    expect(screen.getByTestId('menu-divider')).toBeTruthy()
  })
})

describe('Menu — controlled', () => {
  it('never toggles itself when visibility is driven from outside', () => {
    const onDismiss = jest.fn()
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        visible={false}
        onDismiss={onDismiss}
        testID="menu"
      >
        <Menu.Item label="Edit" />
      </Menu>,
    )

    fireEvent.press(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.queryByTestId('menu')).toBeNull()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('stays open after an item press until the consumer closes it', async () => {
    const onDismiss = jest.fn()
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        visible
        onDismiss={onDismiss}
        testID="menu"
      >
        <Menu.Item label="Edit" />
      </Menu>,
    )
    await screen.findByTestId('menu')

    fireEvent.press(screen.getByText('Edit'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('menu')).toBeTruthy()
  })
})

describe('Menu — tokens and accessibility', () => {
  it('applies the MD3 container tokens', async () => {
    renderMenu(<UncontrolledMenu />)
    const surface = await open()

    const style = StyleSheet.flatten(surface.props.style)
    expect(style.backgroundColor).toBe(lightTheme.colors.surfaceContainer)
    expect(style.borderRadius).toBe(lightTheme.shape.cornerExtraSmall)
    expect(style.minWidth).toBe(112)
    expect(style.maxWidth).toBe(280)
  })

  it('honours the containerColor override', async () => {
    renderMenu(<UncontrolledMenu containerColor="#FF0000" />)
    const surface = await open()
    expect(StyleSheet.flatten(surface.props.style).backgroundColor).toBe(
      '#FF0000',
    )
  })

  it('reports role="menu" on the surface and role="menuitem" on its items', async () => {
    renderMenu(<UncontrolledMenu />)
    const surface = await open()
    expect(surface.props.role).toBe('menu')
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })
})

// Everything above runs with `position === null`, because the RN jest preset
// stubs `measureInWindow` with a `jest.fn()` that never invokes its callback.
// That leaves the seam between resolved geometry and the rendered surface
// untested — and it is the seam that has broken twice: once placing against the
// window instead of the overlay layer, once capping the ScrollView instead of
// the surface it could not bound. So feed the measurement in.
describe('Menu — resolved placement', () => {
  const LAYER = { x: 0, y: 0, width: 400, height: 800 }
  const ANCHOR = { x: 100, y: 300, width: 40, height: 40 }

  beforeEach(() => {
    jest
      .spyOn(
        // React Native 0.88 types `View` as a function component, so its
        // prototype carries no `measureInWindow` in the types. The jest mock
        // of `View` is still a class, and the spy lands on it.
        View.prototype as unknown as { measureInWindow: MeasureInWindow },
        'measureInWindow',
      )
      .mockImplementation(function (
        this: { props?: { style?: StyleProp<ViewStyle> } },
        callback: MeasureInWindowOnSuccessCallback,
      ) {
        // The two measured views are the overlay layer and the anchor wrapper;
        // only the layer absolute-fills with `box-none`. Read it out of the
        // resolved style, not a prop — react-native-web deprecated the prop
        // spelling, so the components carry the flag in `style`.
        const rect =
          StyleSheet.flatten(this.props?.style)?.pointerEvents === 'box-none'
            ? LAYER
            : ANCHOR
        callback(rect.x, rect.y, rect.width, rect.height)
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    setDirection(
      originalDirection.isRTL,
      originalDirection.doLeftAndRightSwapInRTL,
    )
  })

  /** Reports a menu taller than the space below the anchor. */
  function layOutSurface(surface: ReturnType<typeof screen.getByTestId>) {
    fireEvent(surface, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 900 } },
    })
  }

  it('positions the surface against the anchor and caps it at the space below', async () => {
    renderMenu(<UncontrolledMenu />)
    layOutSurface(await open())

    const style = StyleSheet.flatten(screen.getByTestId('menu').props.style)
    expect(style.top).toBe(340)
    expect(style.left).toBe(100)
    // 800 window - 8 margin - 340 top.
    expect(style.maxHeight).toBe(452)
    expect(style.transformOrigin).toBe('left top')
  })

  // `start` is the anchor's right edge in RTL: 140 - 200 leaves the screen,
  // so the menu pins to the 8dp margin, at the physical left.
  it('writes the physical position into right in RTL', async () => {
    setDirection(true, true)
    renderMenu(<UncontrolledMenu />)
    layOutSurface(await open())

    const style = StyleSheet.flatten(screen.getByTestId('menu').props.style)
    expect(style.right).toBe(8)
    expect(style.left).toBeUndefined()
    expect(style.transformOrigin).toBe('right top')
  })

  it('caps the surface at maxHeight when the consumer asks for less', async () => {
    renderMenu(<UncontrolledMenu maxHeight={280} />)
    layOutSurface(await open())

    const style = StyleSheet.flatten(screen.getByTestId('menu').props.style)
    expect(style.maxHeight).toBe(280)
    // Still on the preferred side — a cap must not flip the menu.
    expect(style.top).toBe(340)
  })

  it('ignores a maxHeight larger than the space available', async () => {
    renderMenu(<UncontrolledMenu maxHeight={5000} />)
    layOutSurface(await open())

    expect(
      StyleSheet.flatten(screen.getByTestId('menu').props.style).maxHeight,
    ).toBe(452)
  })
})

// What a device settles on after the entrance, which the rest of this file
// cannot see: `renderWithTheme` is a single pass, so the surface reads its
// `initial` (opacity 0, scale 0.8) and stays there. Worth its own coverage
// because Menu's `animate` target is *conditional* — it only leaves HIDDEN once
// the anchor geometry resolves, and that is the whole anti-flash guarantee.
describe('Menu — settled entrance', () => {
  const LAYER = { x: 0, y: 0, width: 400, height: 800 }
  const ANCHOR = { x: 100, y: 300, width: 40, height: 40 }

  function mockMeasure() {
    jest
      .spyOn(
        // React Native 0.88 types `View` as a function component, so its
        // prototype carries no `measureInWindow` in the types. The jest mock
        // of `View` is still a class, and the spy lands on it.
        View.prototype as unknown as { measureInWindow: MeasureInWindow },
        'measureInWindow',
      )
      .mockImplementation(function (
        this: { props?: { style?: StyleProp<ViewStyle> } },
        callback: MeasureInWindowOnSuccessCallback,
      ) {
        const rect =
          StyleSheet.flatten(this.props?.style)?.pointerEvents === 'box-none'
            ? LAYER
            : ANCHOR
        callback(rect.x, rect.y, rect.width, rect.height)
      })
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('settles on its animate target once the geometry resolves', async () => {
    mockMeasure()
    const { flush } = renderSettled(
      <PortalHost>
        <UncontrolledMenu />
      </PortalHost>,
    )
    fireEvent(await open(), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 120 } },
    })
    flush()

    const style = getStyle(screen.getByTestId('menu'))
    expect(style.opacity).toBe(1)
    expect(style.transform).toEqual([{ scale: 1 }])
  })

  it('stays hidden while the anchor is unmeasured', async () => {
    // No `measureInWindow` stub, so `position` stays null and `animate` is still
    // HIDDEN — a flush cannot reveal the surface. An unpositioned menu must not
    // appear in the corner on its way to being placed.
    const { flush } = renderSettled(
      <PortalHost>
        <UncontrolledMenu />
      </PortalHost>,
    )
    await open()
    flush()

    const style = getStyle(screen.getByTestId('menu'))
    expect(style.opacity).toBe(0)
    expect(style.transform).toEqual([{ scale: 0.8 }])
  })
})

describe('Menu.Item', () => {
  it('renders a leading icon, a label, and trailing text', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Settings" leadingIcon="cog" trailingText="⌘," />
      </Menu>,
    )
    await open()

    expect(screen.getByText('Settings')).toBeTruthy()
    expect(screen.getByText('⌘,')).toBeTruthy()
    // The MaterialDesignIcons mock renders the icon name as text.
    expect(
      screen.getByText('cog', { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  it('applies the MD3 item metrics and label token', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Edit" testID="item" />
      </Menu>,
    )
    await open()

    const container = StyleSheet.flatten(screen.getByTestId('item').props.style)
    expect(container.minHeight).toBe(48)
    expect(container.paddingHorizontal).toBe(12)
    expect(container.justifyContent).toBe('center')

    const label = StyleSheet.flatten(screen.getByText('Edit').props.style)
    expect(label.color).toBe(lightTheme.colors.onSurface)
    expect(label.fontSize).toBe(lightTheme.typography.labelLarge.fontSize)
  })

  it('does not respond while disabled', async () => {
    const onPress = jest.fn()
    const onDismiss = jest.fn()
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        onDismiss={onDismiss}
        testID="menu"
      >
        <Menu.Item label="Edit" onPress={onPress} disabled testID="item" />
      </Menu>,
    )
    await open()

    const item = screen.getByTestId('item')
    expect(item.props.accessibilityState).toEqual({ disabled: true })
    fireEvent.press(item)
    expect(onPress).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('applies the contentColor override to the label', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Delete" contentColor="#B3261E" />
      </Menu>,
    )
    await open()

    const style = StyleSheet.flatten(screen.getByText('Delete').props.style)
    expect(style.color).toBe('#B3261E')
  })

  it('marks the anchor as opening a menu, and tracks whether it is open', async () => {
    renderMenu(<UncontrolledMenu />)
    const anchor = () => screen.getByRole('button', { name: 'Actions' })

    // `aria-expanded` is asserted through `accessibilityState`, not the prop
    // itself: RN's Pressable normalizes the ARIA spelling into the nested
    // object on its way to the host component, and the nested object is what
    // VoiceOver reads. `aria-haspopup` has no native equivalent, so it passes
    // through untouched for react-native-web to pick up.
    expect(anchor().props['aria-haspopup']).toBe('menu')
    expect(anchor().props.accessibilityState.expanded).toBe(false)

    await open()
    expect(anchor().props.accessibilityState.expanded).toBe(true)
  })

  it('marks a controlled anchor the same way', () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} visible onDismiss={jest.fn()}>
        <Menu.Item label="Edit" />
      </Menu>,
    )
    const anchor = screen.getByRole('button', { name: 'Actions' })
    expect(anchor.props['aria-haspopup']).toBe('menu')
    expect(anchor.props.accessibilityState.expanded).toBe(true)
  })

  it('throws when used outside a Menu', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderWithTheme(<Menu.Item label="orphan" />)).toThrow(
      /must be rendered inside a <Menu>/,
    )
    errorSpy.mockRestore()
  })
})

/**
 * The MD3 menu tokens give a selected item `secondaryContainer` and
 * `onSecondaryContainer`. The web roles are in `web/aria.web.test.tsx`; native
 * keeps `menuitem`, because Android drops a role it doesn't know.
 */
describe('Menu.Item — selected and checked', () => {
  function renderItems(items: React.ReactNode) {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        {items}
      </Menu>,
    )
    return open()
  }

  function iconColor(name: string) {
    return screen.getByText(name, { includeHiddenElements: true }).props.color
  }

  it.each([
    ['selected', { selected: true }],
    ['checked', { checked: true }],
  ] as const)(
    'draws a %s item on secondaryContainer, with onSecondaryContainer content',
    async (_, state) => {
      await renderItems(
        <Menu.Item
          label="Name"
          leadingIcon="sort"
          trailingText="A–Z"
          trailingIcon="check"
          testID="item"
          {...state}
        />,
      )

      const { colors } = lightTheme
      expect(getStyle(screen.getByTestId('item')).backgroundColor).toBe(
        colors.secondaryContainer,
      )
      expect(getStyle(screen.getByText('Name')).color).toBe(
        colors.onSecondaryContainer,
      )
      expect(getStyle(screen.getByText('A–Z')).color).toBe(
        colors.onSecondaryContainer,
      )
      expect(iconColor('sort')).toBe(colors.onSecondaryContainer)
      expect(iconColor('check')).toBe(colors.onSecondaryContainer)
    },
  )

  it.each([
    ['selected', { selected: false }],
    ['checked', { checked: false }],
  ] as const)(
    'keeps the plain item colors on an item that is not %s',
    async (_, state) => {
      await renderItems(
        <Menu.Item label="Size" leadingIcon="sort" testID="item" {...state} />,
      )

      const { colors } = lightTheme
      expect(getStyle(screen.getByTestId('item')).backgroundColor).toBe(
        'transparent',
      )
      expect(getStyle(screen.getByText('Size')).color).toBe(colors.onSurface)
      expect(iconColor('sort')).toBe(colors.onSurfaceVariant)
    },
  )

  it('reports the state through aria-checked and keeps role="menuitem"', async () => {
    await renderItems(
      <>
        <Menu.Item label="Name" selected testID="selected" />
        <Menu.Item label="Size" selected={false} testID="unselected" />
        <Menu.Item label="Show hidden" checked testID="checked" />
        <Menu.Item label="Wrap lines" checked={false} testID="unchecked" />
        <Menu.Item label="Done" testID="plain" />
      </>,
    )

    const checkedOf = (testID: string) =>
      screen.getByTestId(testID).props.accessibilityState.checked
    expect(checkedOf('selected')).toBe(true)
    expect(checkedOf('unselected')).toBe(false)
    expect(checkedOf('checked')).toBe(true)
    expect(checkedOf('unchecked')).toBe(false)
    expect(checkedOf('plain')).toBeUndefined()
    expect(screen.getAllByRole('menuitem')).toHaveLength(5)
  })

  it('draws a disabled selected item on the MD3 disabled container, with the plain colors', async () => {
    await renderItems(
      <Menu.Item
        label="Name"
        leadingIcon="sort"
        selected
        disabled
        testID="item"
      />,
    )

    const { colors, stateLayer } = lightTheme
    const item = screen.getByTestId('item')
    expect(getStyle(item).backgroundColor).toBe(
      alphaColor(colors.onSurface, stateLayer.disabledContainerOpacity),
    )
    expect(getStyle(screen.getByText('Name')).color).toBe(colors.onSurface)
    expect(iconColor('sort')).toBe(colors.onSurfaceVariant)
    expect(item.props.accessibilityState).toEqual({
      disabled: true,
      checked: true,
    })
  })

  it('lets containerColor and contentColor replace the selected colors', async () => {
    await renderItems(
      <Menu.Item
        label="Name"
        leadingIcon="sort"
        selected
        containerColor="#FF0000"
        contentColor="#00FF00"
        testID="item"
      />,
    )

    expect(getStyle(screen.getByTestId('item')).backgroundColor).toBe('#FF0000')
    expect(getStyle(screen.getByText('Name')).color).toBe('#00FF00')
    expect(iconColor('sort')).toBe('#00FF00')
  })

  // `selected` and `checked` are two kinds of choice, so the type takes one.
  // The directive below is the assertion: it fails the type check if the
  // union stops rejecting the pair.
  it('rejects selected and checked together at the type level', async () => {
    await renderItems(
      // @ts-expect-error - an item is a radio choice or a checkbox, not both
      <Menu.Item label="Name" selected={false} checked testID="item" />,
    )
    // A consumer on plain JS gets no type error, so `selected` wins.
    expect(screen.getByTestId('item').props.accessibilityState.checked).toBe(
      false,
    )
  })
})

/**
 * The MD3 Expressive vertical menu. The values come from the Compose
 * `SegmentedMenuTokens` and `StandardMenuTokens`; see `menu/styles.ts`.
 */
describe('Menu — vertical', () => {
  const { colors, shape, stateLayer, typography } = lightTheme

  function renderVertical(items: React.ReactNode) {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu" variant="vertical">
        {items}
      </Menu>,
    )
    return open()
  }

  function iconOf(name: string) {
    return screen.getByText(name, { includeHiddenElements: true }).props
  }

  it('applies the vertical container tokens', async () => {
    const surface = await renderVertical(<Menu.Item label="Edit" />)

    const style = getStyle(surface)
    expect(style.backgroundColor).toBe(colors.surfaceContainerLow)
    expect(style.borderRadius).toBe(shape.cornerLarge)
    const list = screen.UNSAFE_getByType(ScrollView)
    expect(StyleSheet.flatten(list.props.contentContainerStyle)).toEqual({
      paddingVertical: 2,
    })
  })

  it('applies the vertical item metrics and type', async () => {
    await renderVertical(
      <Menu.Item
        label="Edit"
        leadingIcon="pencil"
        trailingText="⌘E"
        testID="item"
      />,
    )

    const container = getStyle(screen.getByTestId('item'))
    expect(container.minHeight).toBe(44)
    expect(container.minWidth).toBe(104)
    expect(container.marginHorizontal).toBe(4)
    expect(container.paddingHorizontal).toBe(12)
    expect(container.paddingVertical).toBe(8)

    const label = getStyle(screen.getByText('Edit'))
    expect(label.fontSize).toBe(typography.bodyLarge.fontSize)
    expect(label.color).toBe(colors.onSurface)
    expect(getStyle(screen.getByText('⌘E')).fontSize).toBe(
      typography.labelSmall.fontSize,
    )
    expect(iconOf('pencil').size).toBe(20)
    expect(iconOf('pencil').color).toBe(colors.onSurfaceVariant)
  })

  it('rounds the outer corners of the first and the last item', async () => {
    const small = shape.cornerExtraSmall
    const outer = shape.cornerMedium
    await renderVertical(
      <>
        {['first', 'middle'].map((id) => (
          <Menu.Item key={id} label={id} testID={id} />
        ))}
        <Divider />
        <Menu.Item label="last" testID="last" />
      </>,
    )

    expect(corners('first')).toEqual([outer, outer, small, small])
    expect(corners('middle')).toEqual([small, small, small, small])
    expect(corners('last')).toEqual([small, small, outer, outer])
  })

  it('sees the items in two fragments, and keeps their keys apart', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const small = shape.cornerExtraSmall
    const outer = shape.cornerMedium
    await renderVertical(
      <>
        <>
          <Menu.Item key="same" label="A" testID="a" />
        </>
        <>
          <Menu.Item key="same" label="B" testID="b" />
        </>
      </>,
    )

    expect(corners('a')).toEqual([outer, outer, small, small])
    expect(corners('b')).toEqual([small, small, outer, outer])
    const keyWarnings = errorSpy.mock.calls.filter((call) =>
      String(call[0]).includes('same key'),
    )
    expect(keyWarnings).toEqual([])
    errorSpy.mockRestore()
  })

  it('gives one item alone the small corners on every side', async () => {
    await renderVertical(<Menu.Item label="Edit" testID="item" />)
    const small = shape.cornerExtraSmall
    expect(corners('item')).toEqual([small, small, small, small])
  })

  it('places only the items it can see, and gives an item inside another component the middle shape', async () => {
    function OwnItem() {
      return <Menu.Item label="Own" testID="own" />
    }
    const small = shape.cornerExtraSmall
    const outer = shape.cornerMedium
    await renderVertical(
      <>
        <Menu.Item label="A" testID="a" />
        <OwnItem />
        <Menu.Item label="B" testID="b" />
      </>,
    )

    expect(corners('a')).toEqual([outer, outer, small, small])
    expect(corners('own')).toEqual([small, small, small, small])
    expect(corners('b')).toEqual([small, small, outer, outer])
  })

  it.each([
    ['selected', { selected: true }],
    ['checked', { checked: true }],
  ] as const)(
    'draws a %s item on tertiaryContainer, with 12dp corners',
    async (_, state) => {
      await renderVertical(
        <Menu.Item label="Name" leadingIcon="sort" testID="item" {...state} />,
      )

      expect(getStyle(screen.getByTestId('item')).backgroundColor).toBe(
        colors.tertiaryContainer,
      )
      expect(getStyle(screen.getByText('Name')).color).toBe(
        colors.onTertiaryContainer,
      )
      expect(iconOf('sort').color).toBe(colors.onTertiaryContainer)
      const selected = shape.cornerMedium
      expect(corners('item')).toEqual([selected, selected, selected, selected])
    },
  )

  it('morphs an item to the selected shape when it becomes selected', async () => {
    function SelectOnPress() {
      const [on, setOn] = useState(false)
      return (
        <Menu.Item
          label="Name"
          selected={on}
          closeOnPress={false}
          onPress={() => setOn(true)}
          testID="item"
        />
      )
    }
    const { flush } = renderSettled(
      <PortalHost>
        <Menu
          anchor={<Button>Actions</Button>}
          testID="menu"
          variant="vertical"
        >
          <SelectOnPress />
        </Menu>
      </PortalHost>,
    )
    await open()
    const small = shape.cornerExtraSmall
    expect(corners('item')).toEqual([small, small, small, small])

    fireEvent.press(screen.getByTestId('item'))
    flush()

    const selected = shape.cornerMedium
    expect(corners('item')).toEqual([selected, selected, selected, selected])
  })

  it('keeps a disabled selected item on tertiaryContainer, at 38%', async () => {
    await renderVertical(
      <Menu.Item label="Name" selected disabled testID="item" />,
    )

    expect(getStyle(screen.getByTestId('item')).backgroundColor).toBe(
      alphaColor(colors.tertiaryContainer, stateLayer.disabledOpacity),
    )
    expect(getStyle(screen.getByText('Name')).color).toBe(
      colors.onTertiaryContainer,
    )
  })

  it('gives the disabled content of an unselected item onSurface', async () => {
    await renderVertical(
      <Menu.Item label="Edit" leadingIcon="pencil" disabled testID="item" />,
    )

    expect(getStyle(screen.getByText('Edit')).color).toBe(colors.onSurface)
    expect(iconOf('pencil').color).toBe(colors.onSurface)
  })

  it('leaves the baseline menu as it was', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Edit" leadingIcon="pencil" selected testID="item" />
      </Menu>,
    )
    const surface = await open()

    expect(getStyle(surface).borderRadius).toBe(shape.cornerExtraSmall)
    const item = getStyle(screen.getByTestId('item'))
    expect(item.backgroundColor).toBe(colors.secondaryContainer)
    expect(item.minHeight).toBe(48)
    expect(item.borderTopLeftRadius).toBeUndefined()
    expect(getStyle(screen.getByText('Edit')).fontSize).toBe(
      typography.labelLarge.fontSize,
    )
    expect(iconOf('pencil').size).toBe(24)
  })
})

const styles = StyleSheet.create({
  marked: { marginTop: 7 },
})

/**
 * The groups of the MD3 Expressive vertical menu. The values come from the
 * Compose `MenuDefaults` and `Menu.kt`; see `menu/styles.ts`.
 */
describe('Menu.Group', () => {
  const { colors, elevation, shape, typography } = lightTheme
  const large = shape.cornerLarge
  const small = shape.cornerSmall
  const itemOuter = shape.cornerMedium
  const itemInner = shape.cornerExtraSmall

  function renderGroups(
    groups: React.ReactNode,
    props: Partial<React.ComponentProps<typeof Menu>> = {},
  ) {
    renderMenu(
      <Menu
        anchor={<Button>Actions</Button>}
        testID="menu"
        variant="vertical"
        {...props}
      >
        {groups}
      </Menu>,
    )
    return open()
  }

  /** The root view of each `Menu.Group`, in order, implicit groups too. */
  function groupRoots() {
    return screen
      .UNSAFE_getAllByType(MenuGroup)
      .map((group) => group.findAllByType(View)[0])
  }

  function hostView(node: ReturnType<typeof screen.getByText>) {
    for (let n = node.parent; n; n = n.parent) {
      const type: unknown = n.type
      if (type === 'View') return n
    }
    throw new Error('no host View above the node')
  }

  it('draws each group on its own elevated surface, with its position shape', async () => {
    await renderGroups(
      <>
        <Menu.Group label="Sort by">
          <Menu.Item label="Name" />
          <Menu.Item label="Size" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Show hidden files" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Archive" />
        </Menu.Group>
      </>,
    )

    const roots = groupRoots()
    expect(roots.map(cornersOf)).toEqual([
      [large, large, small, small],
      [small, small, small, small],
      [small, small, large, large],
    ])
    for (const root of roots) {
      const style = getStyle(root)
      expect(style.backgroundColor).toBe(colors.surfaceContainerLow)
      expect(style.paddingVertical).toBe(2)
      expect(style.shadowOpacity).toBe(elevation.level2.shadowOpacity)
      expect(style.overflow).toBeUndefined()
    }
  })

  it('makes the menu surface a clear column, with the groups 2dp apart', async () => {
    const surface = await renderGroups(
      <>
        <Menu.Group>
          <Menu.Item label="Name" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Archive" />
        </Menu.Group>
      </>,
    )

    const style = getStyle(surface)
    expect(style.backgroundColor).toBeUndefined()
    expect(style.borderRadius).toBeUndefined()
    expect(style.shadowOpacity).toBeUndefined()
    const list = screen.UNSAFE_getByType(ScrollView)
    const room =
      elevation.level2.shadowRadius +
      Math.abs(elevation.level2.shadowOffset.height)
    expect(StyleSheet.flatten(list.props.style)).toEqual({
      flexShrink: 1,
      marginHorizontal: -room,
      marginVertical: -room,
    })
    expect(StyleSheet.flatten(list.props.contentContainerStyle)).toEqual({
      paddingHorizontal: room,
      paddingVertical: room,
      gap: 2,
    })
  })

  it('keeps the shadow room at the sides only while the groups scroll', async () => {
    await renderGroups(
      <>
        <Menu.Group>
          <Menu.Item label="Name" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Archive" />
        </Menu.Group>
      </>,
    )
    const room =
      elevation.level2.shadowRadius +
      Math.abs(elevation.level2.shadowOffset.height)
    const list = () => screen.UNSAFE_getByType(ScrollView)
    const layout = (height: number) => ({
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height } },
    })

    // The groups fit: the scroll view is as tall as its content.
    fireEvent(list(), 'contentSizeChange', 200, 300)
    fireEvent(list(), 'layout', layout(300))
    expect(StyleSheet.flatten(list().props.style).marginVertical).toBe(-room)

    // The menu caps below the groups, so they scroll.
    fireEvent(list(), 'layout', layout(200))
    expect(StyleSheet.flatten(list().props.style)).toEqual({
      flexShrink: 1,
      marginHorizontal: -room,
      marginVertical: 0,
    })
    expect(StyleSheet.flatten(list().props.contentContainerStyle)).toEqual({
      paddingHorizontal: room,
      paddingVertical: 0,
      gap: 2,
    })
  })

  it('leaves the scroll view of a menu with no groups as it was', async () => {
    await renderGroups(<Menu.Item label="Name" />)
    const list = screen.UNSAFE_getByType(ScrollView)
    expect(list.props.onContentSizeChange).toBeUndefined()
    expect(list.props.onLayout).toBeUndefined()
  })

  it('places the items of each group on their own', async () => {
    await renderGroups(
      <>
        <Menu.Group>
          <Menu.Item label="A" testID="a" />
          <Menu.Item label="B" testID="b" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="C" testID="c" />
        </Menu.Group>
      </>,
    )

    expect(corners('a')).toEqual([itemOuter, itemOuter, itemInner, itemInner])
    expect(corners('b')).toEqual([itemInner, itemInner, itemOuter, itemOuter])
    expect(corners('c')).toEqual([itemInner, itemInner, itemInner, itemInner])
  })

  it('renders the label above the items, in labelLarge and onSurface', async () => {
    await renderGroups(
      <>
        <Menu.Group label="Sort by" testID="sort">
          <Menu.Item label="Name" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Archive" />
        </Menu.Group>
      </>,
    )

    const texts = within(screen.getByTestId('sort'))
      .getAllByText(/.+/)
      .map((node) => node.props.children)
    expect(texts).toEqual(['Sort by', 'Name'])
    const label = screen.getByText('Sort by')
    expect(getStyle(label)).toMatchObject({
      fontSize: typography.labelLarge.fontSize,
      fontWeight: typography.labelLarge.fontWeight,
      color: colors.onSurface,
    })
    expect(getStyle(hostView(label))).toEqual({
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 32,
      paddingStart: 12,
      paddingEnd: 4,
    })
  })

  it('puts the children outside a group in a group of their own', async () => {
    await renderGroups(
      <>
        <Menu.Item label="Edit" testID="edit" />
        <Menu.Group label="Sort by">
          <Menu.Item label="Name" />
        </Menu.Group>
        <Menu.Item label="Copy" testID="copy" />
        <Menu.Item label="Paste" testID="paste" />
      </>,
    )

    const roots = groupRoots()
    expect(roots).toHaveLength(3)
    expect(roots.map((root) => getStyle(root).backgroundColor)).toEqual([
      colors.surfaceContainerLow,
      colors.surfaceContainerLow,
      colors.surfaceContainerLow,
    ])
    expect(corners('edit')).toEqual([
      itemInner,
      itemInner,
      itemInner,
      itemInner,
    ])
    expect(corners('copy')).toEqual([
      itemOuter,
      itemOuter,
      itemInner,
      itemInner,
    ])
    expect(corners('paste')).toEqual([
      itemInner,
      itemInner,
      itemOuter,
      itemOuter,
    ])
  })

  it('sees the groups in an array and in a fragment', async () => {
    await renderGroups(
      <>
        {['A', 'B'].map((name) => (
          <Menu.Group key={name} label={name}>
            <Menu.Item label={`${name} item`} />
          </Menu.Group>
        ))}
        <>
          <Menu.Group label="C">
            <Menu.Item label="C item" />
          </Menu.Group>
        </>
      </>,
    )

    expect(groupRoots().map(cornersOf)).toEqual([
      [large, large, small, small],
      [small, small, small, small],
      [small, small, large, large],
    ])
  })

  it('keeps one group on the menu surface', async () => {
    const surface = await renderGroups(
      <Menu.Group label="Sort by" testID="group">
        <Menu.Item label="Name" testID="a" />
        <Menu.Item label="Size" testID="b" />
      </Menu.Group>,
    )

    expect(getStyle(surface)).toMatchObject({
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: large,
    })
    const group = getStyle(screen.getByTestId('group'))
    expect(group.backgroundColor).toBeUndefined()
    expect(group.shadowOpacity).toBeUndefined()
    expect(group.borderTopLeftRadius).toBeUndefined()
    expect(screen.getByText('Sort by')).toBeTruthy()
    expect(corners('a')).toEqual([itemOuter, itemOuter, itemInner, itemInner])
    expect(corners('b')).toEqual([itemInner, itemInner, itemOuter, itemOuter])
  })

  it('colors each group with the containerColor of the menu', async () => {
    await renderGroups(
      <>
        <Menu.Group>
          <Menu.Item label="Name" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Archive" />
        </Menu.Group>
      </>,
      { containerColor: '#123456' },
    )

    expect(groupRoots().map((root) => getStyle(root).backgroundColor)).toEqual([
      '#123456',
      '#123456',
    ])
  })

  it('applies style to the group', async () => {
    await renderGroups(
      <>
        <Menu.Group testID="group" style={styles.marked}>
          <Menu.Item label="Name" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Archive" />
        </Menu.Group>
      </>,
    )

    expect(getStyle(screen.getByTestId('group'))).toMatchObject({
      backgroundColor: colors.surfaceContainerLow,
      marginTop: 7,
    })
  })

  it('renders its children with no label in a baseline menu, and warns', async () => {
    __resetWarnOnceForTests()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Group label="Sort by">
          <Menu.Item label="Name" />
        </Menu.Group>
      </Menu>,
    )
    await open()

    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.queryByText('Sort by')).toBeNull()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Menu.Group> works in a vertical menu only'),
    )
    errorSpy.mockRestore()
  })

  it('throws when used outside a Menu', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      renderWithTheme(
        <Menu.Group>
          <Text>Orphan</Text>
        </Menu.Group>,
      ),
    ).toThrow('<Menu.Group> must be rendered inside a <Menu>.')
    errorSpy.mockRestore()
  })
})

/**
 * React Native's default layout conformance keeps a legacy Yoga rule: a
 * `flexGrow` child grows a row that is as wide as its content to all the
 * width it can get. A menu is as wide as its content, so one such child
 * between an item label and the surface opened every menu at its 280dp
 * maximum. Jest computes no layout, so these tests read the styles.
 */
describe('Menu — the width follows the items', () => {
  type Node = ReturnType<typeof screen.getByText>

  /** Host nodes from `node` up to `surface`, with their flattened styles. */
  function hostChain(node: Node, surface: Node) {
    const chain: { type: string; style: ViewStyle }[] = []
    for (let n: Node | null = node; n; n = n.parent) {
      if (typeof n.type === 'string') {
        chain.push({
          type: n.type,
          style: StyleSheet.flatten(n.props.style) ?? {},
        })
      }
      if (n === surface) return chain
    }
    throw new Error('the node is not inside the surface')
  }

  function growsInARow(chain: { type: string; style: ViewStyle }[]) {
    return chain.flatMap(({ type, style }, index) => {
      const parent = chain[index + 1]?.style
      const isRow = parent?.flexDirection?.startsWith('row') ?? false
      const grow =
        (style.flexGrow ?? 0) > 0 ||
        (typeof style.flex === 'number' && style.flex > 0)
      return isRow && grow ? [type] : []
    })
  }

  it('no node between an item and the surface grows a row', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Developer" leadingIcon="cog" trailingText="⌘D" />
        <Menu.Item label="Help" trailingIcon="open-in-new" />
      </Menu>,
    )
    const surface = await open()
    for (const text of ['Developer', '⌘D', 'Help']) {
      expect(growsInARow(hostChain(screen.getByText(text), surface))).toEqual(
        [],
      )
    }
  })

  it('no node between an item or a group label and the surface grows a row, in a menu of groups', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu" variant="vertical">
        <Menu.Group label="Sort by">
          <Menu.Item label="Developer" leadingIcon="cog" trailingText="⌘D" />
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label="Help" trailingIcon="open-in-new" />
        </Menu.Group>
      </Menu>,
    )
    const surface = await open()
    for (const text of ['Sort by', 'Developer', '⌘D', 'Help']) {
      expect(growsInARow(hostChain(screen.getByText(text), surface))).toEqual(
        [],
      )
    }
  })

  it('the first trailing element takes the free space with an auto margin', async () => {
    renderMenu(
      <Menu anchor={<Button>Actions</Button>} testID="menu">
        <Menu.Item label="Copy" trailingText="⌘C" />
        <Menu.Item label="Help" trailingIcon="open-in-new" />
        <Menu.Item label="Paste" trailingText="⌘V" trailingIcon="check" />
      </Menu>,
    )
    await open()
    const marginOf = (node: Node | null) =>
      node ? StyleSheet.flatten(node.props.style)?.marginStart : undefined
    const iconView = (name: string) =>
      screen.getByText(name, { includeHiddenElements: true }).parent?.parent ??
      null

    expect(marginOf(screen.getByText('⌘C'))).toBe('auto')
    expect(marginOf(screen.getByText('⌘V'))).toBe('auto')
    expect(marginOf(iconView('open-in-new'))).toBe('auto')
    expect(marginOf(iconView('check'))).toBeUndefined()
  })
})
