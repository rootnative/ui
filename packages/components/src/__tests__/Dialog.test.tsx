import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen, within } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../button'
import { Dialog } from '../dialog'
import { PortalHost } from '../portal/PortalHost'

function renderDialog(ui: React.ReactElement) {
  return renderWithTheme(<PortalHost>{ui}</PortalHost>)
}

describe('Dialog', () => {
  it('renders nothing while not visible', () => {
    renderDialog(
      <Dialog visible={false} onDismiss={jest.fn()}>
        <Dialog.Title>Delete file?</Dialog.Title>
      </Dialog>,
    )
    expect(screen.queryByText('Delete file?')).toBeNull()
  })

  it('renders its slots when visible', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()}>
        <Dialog.Icon icon="alert" />
        <Dialog.Title>Delete file?</Dialog.Title>
        <Dialog.Content>This cannot be undone.</Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={jest.fn()}>
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>,
    )

    expect(await screen.findByText('Delete file?')).toBeTruthy()
    expect(screen.getByText('This cannot be undone.')).toBeTruthy()
    expect(screen.getByText('Cancel')).toBeTruthy()
  })

  it('renders slots in MD3 order regardless of the order written', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()} testID="dialog">
        <Dialog.Actions>
          <Text>action</Text>
        </Dialog.Actions>
        <Dialog.Content>supporting</Dialog.Content>
        <Dialog.Title>headline</Dialog.Title>
      </Dialog>,
    )

    const surface = await screen.findByTestId('dialog')
    const order = within(surface)
      .getAllByText(/headline|supporting|action/)
      .map((node) => node.props.children)
    expect(order).toEqual(['headline', 'supporting', 'action'])
  })

  it('treats unrecognised children as content', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()}>
        <Text>bare child</Text>
      </Dialog>,
    )
    expect(await screen.findByText('bare child')).toBeTruthy()
  })

  it('applies the MD3 basic container tokens', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()} testID="dialog">
        <Dialog.Title>Title</Dialog.Title>
      </Dialog>,
    )

    const style = StyleSheet.flatten(
      (await screen.findByTestId('dialog')).props.style,
    )
    expect(style.backgroundColor).toBe(lightTheme.colors.surfaceContainerHigh)
    expect(style.borderRadius).toBe(lightTheme.shape.cornerExtraLarge)
    expect(style.padding).toBe(24)
    expect(style.minWidth).toBe(280)
    expect(style.maxWidth).toBe(560)
  })

  it('honours the containerColor override', async () => {
    renderDialog(
      <Dialog
        visible
        onDismiss={jest.fn()}
        testID="dialog"
        containerColor="#FF0000"
      >
        <Dialog.Title>Title</Dialog.Title>
      </Dialog>,
    )
    const style = StyleSheet.flatten(
      (await screen.findByTestId('dialog')).props.style,
    )
    expect(style.backgroundColor).toBe('#FF0000')
  })

  it('reports itself as a modal dialog', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()} testID="dialog">
        <Dialog.Title>Title</Dialog.Title>
      </Dialog>,
    )
    const surface = await screen.findByTestId('dialog')
    expect(surface.props.role).toBe('dialog')
    expect(surface.props['aria-modal']).toBe(true)
  })

  it('escalates to alertdialog only when asked', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()} testID="dialog" role="alertdialog">
        <Dialog.Title>Delete everything?</Dialog.Title>
      </Dialog>,
    )
    const surface = await screen.findByTestId('dialog')
    expect(surface.props.role).toBe('alertdialog')
  })

  it('takes its accessible name from the headline', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()} testID="dialog">
        <Dialog.Title>Reset settings?</Dialog.Title>
        <Dialog.Content>This cannot be undone.</Dialog.Content>
      </Dialog>,
    )
    const surface = await screen.findByTestId('dialog')
    expect(surface.props.accessibilityLabel).toBe('Reset settings?')
  })

  it('prefers an explicit accessibilityLabel over the headline', async () => {
    renderDialog(
      <Dialog
        visible
        onDismiss={jest.fn()}
        testID="dialog"
        accessibilityLabel="Reset confirmation"
      >
        <Dialog.Title>Reset settings?</Dialog.Title>
      </Dialog>,
    )
    const surface = await screen.findByTestId('dialog')
    expect(surface.props.accessibilityLabel).toBe('Reset confirmation')
  })

  it('leaves the name to the consumer when the headline is not plain text', async () => {
    renderDialog(
      <Dialog visible onDismiss={jest.fn()} testID="dialog">
        <Dialog.Title>
          <Text>Composed headline</Text>
        </Dialog.Title>
      </Dialog>,
    )
    const surface = await screen.findByTestId('dialog')
    expect(surface.props.accessibilityLabel).toBeUndefined()
  })

  it('dismisses on a scrim press', async () => {
    const onDismiss = jest.fn()
    renderDialog(
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>Title</Dialog.Title>
      </Dialog>,
    )
    fireEvent.press(await screen.findByLabelText('Close dialog'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss on a scrim press when dismissable is false', async () => {
    const onDismiss = jest.fn()
    renderDialog(
      <Dialog visible onDismiss={onDismiss} dismissable={false}>
        <Dialog.Title>Title</Dialog.Title>
      </Dialog>,
    )
    await screen.findByText('Title')

    // The scrim stops being an accessibility affordance at all — there is no
    // dismiss action to announce.
    expect(screen.queryByLabelText('Close dialog')).toBeNull()

    const scrim = screen.UNSAFE_getByProps({
      accessibilityLabel: 'Close dialog',
    })
    expect(scrim.props.disabled).toBe(true)
    fireEvent.press(scrim)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('throws when a slot is used outside a Dialog', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderWithTheme(<Dialog.Title>orphan</Dialog.Title>)).toThrow(
      /must be rendered inside a <Dialog>/,
    )
    errorSpy.mockRestore()
  })
})

describe('Dialog — fullscreen', () => {
  it('renders a close button, header title, and header actions', async () => {
    const onDismiss = jest.fn()
    renderDialog(
      <Dialog
        visible
        variant="fullscreen"
        onDismiss={onDismiss}
        testID="dialog"
      >
        <Dialog.Title>Edit profile</Dialog.Title>
        <Dialog.Content>Body content</Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={jest.fn()}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>,
    )

    expect(await screen.findByText('Edit profile')).toBeTruthy()
    expect(screen.getByText('Body content')).toBeTruthy()
    expect(screen.getByText('Save')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Close'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders no scrim', async () => {
    renderDialog(
      <Dialog visible variant="fullscreen" onDismiss={jest.fn()}>
        <Dialog.Title>Edit profile</Dialog.Title>
      </Dialog>,
    )
    await screen.findByText('Edit profile')
    expect(screen.queryByLabelText('Close dialog')).toBeNull()
  })

  it('uses the surface color and role=dialog', async () => {
    renderDialog(
      <Dialog
        visible
        variant="fullscreen"
        onDismiss={jest.fn()}
        testID="dialog"
      >
        <Dialog.Title>Edit profile</Dialog.Title>
      </Dialog>,
    )
    const surface = await screen.findByTestId('dialog')
    const style = StyleSheet.flatten(surface.props.style)
    expect(style.backgroundColor).toBe(lightTheme.colors.surface)
    expect(surface.props.role).toBe('dialog')
  })

  it('honours a custom close label', async () => {
    renderDialog(
      <Dialog
        visible
        variant="fullscreen"
        onDismiss={jest.fn()}
        closeAccessibilityLabel="Discard"
      >
        <Dialog.Title>Edit profile</Dialog.Title>
      </Dialog>,
    )
    expect(await screen.findByLabelText('Discard')).toBeTruthy()
  })
})
