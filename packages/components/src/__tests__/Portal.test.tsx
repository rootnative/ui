import { renderWithTheme } from '@rootnative/utils/test'
import { screen, within } from '@testing-library/react-native'
import { Text, View } from 'react-native'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { PortalHost } from '../portal/PortalHost'

/** Tree order of every `layer-*` testID currently rendered. */
function stackOrder() {
  return screen.getAllByTestId(/^layer-/).map((node) => node.props.testID)
}

describe('Portal', () => {
  it('renders children inside the host', async () => {
    renderWithTheme(
      <PortalHost>
        <Text>app</Text>
        <Portal>
          <Text>portal-child</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('portal-child')).toBeTruthy()
    expect(screen.getByText('app')).toBeTruthy()
  })

  it('removes children when Portal unmounts', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <Portal>
          <Text>visible</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('visible')).toBeTruthy()
    rerender(
      <PortalHost>
        <Text>app</Text>
      </PortalHost>,
    )
    expect(screen.queryByText('visible')).toBeNull()
  })

  it('updates content when Portal children change', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <Portal>
          <Text>first</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('first')).toBeTruthy()
    rerender(
      <PortalHost>
        <Portal>
          <Text>second</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('second')).toBeTruthy()
    expect(screen.queryByText('first')).toBeNull()
  })

  it('renders multiple Portals in mount order', async () => {
    renderWithTheme(
      <PortalHost>
        <Portal>
          <Text>first</Text>
        </Portal>
        <Portal>
          <Text>second</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('first')).toBeTruthy()
    expect(await screen.findByText('second')).toBeTruthy()
  })

  it('renders inline with a dev error when no PortalHost ancestor', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderWithTheme(
      <Portal>
        <Text>fallback</Text>
      </Portal>,
    )
    expect(screen.getByText('fallback')).toBeTruthy()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('Portal priority', () => {
  it('stacks higher priority above lower regardless of mount order', async () => {
    renderWithTheme(
      <PortalHost>
        <Portal priority={PORTAL_LAYERS.tooltip}>
          <Text testID="layer-tooltip">tooltip</Text>
        </Portal>
        <Portal priority={PORTAL_LAYERS.sheet}>
          <Text testID="layer-sheet">sheet</Text>
        </Portal>
        <Portal priority={PORTAL_LAYERS.dialog}>
          <Text testID="layer-dialog">dialog</Text>
        </Portal>
      </PortalHost>,
    )
    await screen.findByTestId('layer-sheet')
    expect(stackOrder()).toEqual([
      'layer-sheet',
      'layer-dialog',
      'layer-tooltip',
    ])
  })

  it('breaks priority ties by mount order', async () => {
    renderWithTheme(
      <PortalHost>
        <Portal priority={PORTAL_LAYERS.dialog}>
          <Text testID="layer-a">a</Text>
        </Portal>
        <Portal priority={PORTAL_LAYERS.dialog}>
          <Text testID="layer-b">b</Text>
        </Portal>
      </PortalHost>,
    )
    await screen.findByTestId('layer-a')
    expect(stackOrder()).toEqual(['layer-a', 'layer-b'])
  })

  it('treats a portal with no priority as the bottom layer', async () => {
    renderWithTheme(
      <PortalHost>
        <Portal priority={PORTAL_LAYERS.sheet}>
          <Text testID="layer-sheet">sheet</Text>
        </Portal>
        <Portal>
          <Text testID="layer-default">default</Text>
        </Portal>
      </PortalHost>,
    )
    await screen.findByTestId('layer-default')
    expect(stackOrder()).toEqual(['layer-default', 'layer-sheet'])
  })

  it('keeps a portal in place across a priority change', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <Portal priority={PORTAL_LAYERS.sheet}>
          <Text testID="layer-moving">moving</Text>
        </Portal>
        <Portal priority={PORTAL_LAYERS.dialog}>
          <Text testID="layer-fixed">fixed</Text>
        </Portal>
      </PortalHost>,
    )
    await screen.findByTestId('layer-moving')
    expect(stackOrder()).toEqual(['layer-moving', 'layer-fixed'])

    rerender(
      <PortalHost>
        <Portal priority={PORTAL_LAYERS.menu}>
          <Text testID="layer-moving">moving</Text>
        </Portal>
        <Portal priority={PORTAL_LAYERS.dialog}>
          <Text testID="layer-fixed">fixed</Text>
        </Portal>
      </PortalHost>,
    )
    expect(stackOrder()).toEqual(['layer-fixed', 'layer-moving'])
  })

  it('orders the built-in layers sheet < dialog < snackbar < menu < tooltip', () => {
    const { sheet, dialog, snackbar, menu, tooltip } = PORTAL_LAYERS
    expect([sheet, dialog, snackbar, menu, tooltip]).toEqual(
      [sheet, dialog, snackbar, menu, tooltip].slice().sort((a, b) => a - b),
    )
  })
})

describe('Portal hosts', () => {
  it('renders into a named host instead of the root overlay', async () => {
    renderWithTheme(
      <PortalHost>
        <View testID="slot">
          <PortalHost name="snackbar" />
        </View>
        <Portal hostName="snackbar">
          <Text>queued</Text>
        </Portal>
      </PortalHost>,
    )
    const queued = await screen.findByText('queued')
    expect(queued).toBeTruthy()
    expect(within(screen.getByTestId('slot')).getByText('queued')).toBeTruthy()
  })

  it('keeps unrelated portals out of a named host', async () => {
    renderWithTheme(
      <PortalHost>
        <View testID="slot">
          <PortalHost name="snackbar" />
        </View>
        <Portal>
          <Text>root-overlay</Text>
        </Portal>
      </PortalHost>,
    )
    await screen.findByText('root-overlay')
    expect(
      within(screen.getByTestId('slot')).queryByText('root-overlay'),
    ).toBeNull()
  })

  it('falls back to the default host when the named host is not mounted', async () => {
    renderWithTheme(
      <PortalHost>
        <View testID="slot" />
        <Portal hostName="not-mounted">
          <Text>orphan</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('orphan')).toBeTruthy()
    expect(within(screen.getByTestId('slot')).queryByText('orphan')).toBeNull()
  })

  it('moves a fallen-back portal once its host mounts', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <View testID="slot" />
        <Portal hostName="snackbar">
          <Text>message</Text>
        </Portal>
      </PortalHost>,
    )
    await screen.findByText('message')
    expect(within(screen.getByTestId('slot')).queryByText('message')).toBeNull()

    rerender(
      <PortalHost>
        <View testID="slot">
          <PortalHost name="snackbar" />
        </View>
        <Portal hostName="snackbar">
          <Text>message</Text>
        </Portal>
      </PortalHost>,
    )
    expect(within(screen.getByTestId('slot')).getByText('message')).toBeTruthy()
  })

  it('returns portals to the default host when the named host unmounts', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <View testID="slot">
          <PortalHost name="snackbar" />
        </View>
        <Portal hostName="snackbar">
          <Text>message</Text>
        </Portal>
      </PortalHost>,
    )
    expect(
      await within(screen.getByTestId('slot')).findByText('message'),
    ).toBeTruthy()

    rerender(
      <PortalHost>
        <View testID="slot" />
        <Portal hostName="snackbar">
          <Text>message</Text>
        </Portal>
      </PortalHost>,
    )
    expect(screen.getByText('message')).toBeTruthy()
    expect(within(screen.getByTestId('slot')).queryByText('message')).toBeNull()
  })

  it('dev-errors when a named host has no enclosing root host', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderWithTheme(
      <PortalHost name="snackbar">
        <Text>app</Text>
      </PortalHost>,
    )
    expect(screen.getByText('app')).toBeTruthy()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('has no enclosing'),
    )
    errorSpy.mockRestore()
  })
})
