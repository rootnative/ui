import { renderWithTheme } from '@rootnative/utils/test'
import type { ReactElement } from 'react'
import { BackHandler, Platform, Text } from 'react-native'
import { BottomSheet } from '../bottom-sheet'
import { Dialog } from '../dialog'
import { Menu } from '../menu'
import { NavigationDrawer } from '../navigation-drawer'
import { PortalHost } from '../portal/PortalHost'
import { SearchView } from '../search-view'
import { Tooltip } from '../tooltip'

/**
 * Every overlay that answers the Android back button, through the one
 * `useBackHandlerDismiss` hook. `open` renders the surface in the state that
 * must subscribe; `locked` renders it in a state that must not: closed, not
 * dismissable, or the plain Tooltip that takes itself down.
 */
const CASES: {
  name: string
  open: (onDismiss: () => void) => ReactElement
  locked: (onDismiss: () => void) => ReactElement
}[] = [
  {
    name: 'Dialog',
    open: (onDismiss) => (
      <PortalHost>
        <Dialog visible onDismiss={onDismiss}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
    locked: (onDismiss) => (
      <PortalHost>
        <Dialog visible dismissable={false} onDismiss={onDismiss}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
  },
  {
    name: 'BottomSheet (modal)',
    open: (onDismiss) => (
      <PortalHost>
        <BottomSheet visible onDismiss={onDismiss}>
          <Text>Sheet</Text>
        </BottomSheet>
      </PortalHost>
    ),
    locked: (onDismiss) => (
      <PortalHost>
        <BottomSheet visible dismissable={false} onDismiss={onDismiss}>
          <Text>Sheet</Text>
        </BottomSheet>
      </PortalHost>
    ),
  },
  {
    name: 'Menu',
    open: (onDismiss) => (
      <PortalHost>
        <Menu visible anchor={null} onDismiss={onDismiss}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>
    ),
    locked: (onDismiss) => (
      <PortalHost>
        <Menu visible={false} anchor={null} onDismiss={onDismiss}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>
    ),
  },
  {
    name: 'Tooltip (rich)',
    open: (onDismiss) => (
      <PortalHost>
        <Tooltip visible variant="rich" anchor={null} onDismiss={onDismiss}>
          Rich
        </Tooltip>
      </PortalHost>
    ),
    // A plain tooltip never swallows a back press.
    locked: (onDismiss) => (
      <PortalHost>
        <Tooltip visible anchor={null} onDismiss={onDismiss}>
          Plain
        </Tooltip>
      </PortalHost>
    ),
  },
  {
    name: 'NavigationDrawer (modal)',
    open: (onDismiss) => (
      <PortalHost>
        <NavigationDrawer variant="modal" visible onDismiss={onDismiss}>
          <NavigationDrawer.Item value="home" label="Home" />
        </NavigationDrawer>
      </PortalHost>
    ),
    locked: (onDismiss) => (
      <PortalHost>
        <NavigationDrawer
          variant="modal"
          visible
          dismissable={false}
          onDismiss={onDismiss}
        >
          <NavigationDrawer.Item value="home" label="Home" />
        </NavigationDrawer>
      </PortalHost>
    ),
  },
  {
    name: 'SearchView',
    open: (onDismiss) => (
      <PortalHost>
        <SearchView visible onDismiss={onDismiss} placeholder="Search" />
      </PortalHost>
    ),
    locked: (onDismiss) => (
      <PortalHost>
        <SearchView
          visible={false}
          onDismiss={onDismiss}
          placeholder="Search"
        />
      </PortalHost>
    ),
  },
]

describe('Android back dismisses an open overlay', () => {
  const originalOS = Platform.OS
  let spy: jest.SpyInstance
  let remove: jest.Mock

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'android' })
    remove = jest.fn()
    spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockReturnValue({ remove })
  })

  afterEach(() => {
    spy.mockRestore()
    Object.defineProperty(Platform, 'OS', { value: originalOS })
  })

  describe.each(CASES)('$name', ({ open, locked }) => {
    it('subscribes while open, dismisses, and unsubscribes on unmount', () => {
      const onDismiss = jest.fn()
      const { unmount } = renderWithTheme(open(onDismiss))

      expect(spy).toHaveBeenCalledTimes(1)
      const handler = spy.mock.calls[0][1] as () => boolean
      expect(handler()).toBe(true)
      expect(onDismiss).toHaveBeenCalledTimes(1)

      unmount()
      expect(remove).toHaveBeenCalledTimes(1)
    })

    it('does not subscribe when there is nothing to dismiss', () => {
      renderWithTheme(locked(jest.fn()))
      expect(spy).not.toHaveBeenCalled()
    })
  })

  it('does not subscribe off Android', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' })
    renderWithTheme(CASES[0].open(jest.fn()))
    expect(spy).not.toHaveBeenCalled()
  })
})
