import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, View } from 'react-native'
import { Button } from '../button'
import { Divider } from '../divider'
import { Menu } from '../menu'
import { PortalHost } from '../portal/PortalHost'

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
    jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
      this: { props?: { pointerEvents?: string } },
      callback,
    ) {
      // The two measured views are the overlay layer and the anchor wrapper;
      // only the layer absolute-fills with `box-none`.
      const rect = this.props?.pointerEvents === 'box-none' ? LAYER : ANCHOR
      callback(rect.x, rect.y, rect.width, rect.height)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
    // The MaterialCommunityIcons mock renders the icon name as text.
    expect(screen.getByText('cog')).toBeTruthy()
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

  it('throws when used outside a Menu', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderWithTheme(<Menu.Item label="orphan" />)).toThrow(
      /must be rendered inside a <Menu>/,
    )
    errorSpy.mockRestore()
  })
})
