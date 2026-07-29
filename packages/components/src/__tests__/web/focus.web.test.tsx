/**
 * DOM-level tests for the things only a browser has: keyboard focus order and
 * the `aria-*` attributes that describe one element in terms of another.
 *
 * These belong here rather than in the native project for the same reason
 * `aria.web.test.tsx` does — but the failure mode is worse. `useFocusTrap` is
 * the one piece of the library with **no** native behaviour at all: every
 * effect in it returns early unless `Platform.OS === 'web'`. A test under the
 * `react-native` preset would assert on a hook that deliberately did nothing.
 *
 * The portal-mounted surfaces here (Dialog, Menu) are the ones the earlier web
 * pass left to Playwright. Dialog needs no measurement, so it renders and
 * traps under jsdom exactly as it does in a browser. Menu's surface mounts but
 * never resolves a position, because `useAnchorPosition` waits on an
 * `onLayout` that jsdom's missing `ResizeObserver` never fires — its items are
 * in the DOM and keyboard-reachable, which is all these tests read.
 */
import { act, fireEvent, screen } from '@testing-library/react'
import { Button } from '../../button'
import { Dialog } from '../../dialog'
import { Menu } from '../../menu'
import { PortalHost } from '../../portal/PortalHost'
import { TextField } from '../../text-field'
import { Tooltip } from '../../tooltip'
import { renderWeb } from './render-web'

/** Escape and Tab are handled on `document` in the capture phase. */
function press(key: string, init?: KeyboardEventInit) {
  fireEvent.keyDown(document, { key, ...init })
}

describe('Dialog focus trap', () => {
  it('moves focus to the first focusable element inside the surface', () => {
    renderWeb(
      <PortalHost>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Reset settings?</Dialog.Title>
          <Dialog.Actions>
            <Button variant="text">Cancel</Button>
            <Button variant="text">Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </PortalHost>,
    )

    expect(document.activeElement?.textContent).toBe('Cancel')
  })

  it('takes focus itself when nothing inside is focusable', () => {
    renderWeb(
      <PortalHost>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Working</Dialog.Title>
          <Dialog.Content>Please wait.</Dialog.Content>
        </Dialog>
      </PortalHost>,
    )

    const surface = screen.getByRole('dialog')
    expect(document.activeElement).toBe(surface)
    expect(surface.getAttribute('tabindex')).toBe('-1')
  })

  it('cycles Tab within the surface instead of leaving it', () => {
    renderWeb(
      <PortalHost>
        <Button>Behind</Button>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Reset settings?</Dialog.Title>
          <Dialog.Actions>
            <Button variant="text">Cancel</Button>
            <Button variant="text">Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </PortalHost>,
    )

    expect(document.activeElement?.textContent).toBe('Cancel')
    press('Tab')
    expect(document.activeElement?.textContent).toBe('Reset')
    // The wrap is the whole point: without the trap this lands on "Behind".
    press('Tab')
    expect(document.activeElement?.textContent).toBe('Cancel')
    press('Tab', { shiftKey: true })
    expect(document.activeElement?.textContent).toBe('Reset')
  })

  it('dismisses on Escape', () => {
    const onDismiss = jest.fn()
    renderWeb(
      <PortalHost>
        <Dialog visible onDismiss={onDismiss}>
          <Dialog.Title>Reset settings?</Dialog.Title>
        </Dialog>
      </PortalHost>,
    )

    press('Escape')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('ignores Escape when the dialog is not dismissable', () => {
    const onDismiss = jest.fn()
    renderWeb(
      <PortalHost>
        <Dialog visible dismissable={false} onDismiss={onDismiss}>
          <Dialog.Title>Accept the terms</Dialog.Title>
        </Dialog>
      </PortalHost>,
    )

    press('Escape')
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('returns focus to whatever held it before the dialog opened', () => {
    function Host({ visible }: { visible: boolean }) {
      return (
        <PortalHost>
          <Button>Open</Button>
          <Dialog visible={visible} onDismiss={() => {}}>
            <Dialog.Title>Reset settings?</Dialog.Title>
            <Dialog.Actions>
              <Button variant="text">Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </PortalHost>
      )
    }

    const { rerender } = renderWeb(<Host visible={false} />)
    const trigger = screen
      .getByText('Open')
      .closest('[tabindex]') as HTMLElement
    // RNW's Pressable tracks its own focus state, so a real `.focus()` is a
    // React state update and has to be acted on.
    act(() => trigger.focus())
    expect(document.activeElement).toBe(trigger)

    rerender(<Host visible />)
    expect(document.activeElement?.textContent).toBe('Cancel')

    rerender(<Host visible={false} />)
    expect(document.activeElement).toBe(trigger)
  })

  it('names itself from the headline', () => {
    renderWeb(
      <PortalHost>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Reset settings?</Dialog.Title>
        </Dialog>
      </PortalHost>,
    )

    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(
      'Reset settings?',
    )
  })
})

describe('Menu popup semantics', () => {
  it('announces the trigger as opening a menu, and whether it is open', () => {
    function Host({ visible }: { visible: boolean }) {
      return (
        <PortalHost>
          <Menu anchor={<Button>Actions</Button>} visible={visible}>
            <Menu.Item label="Edit" />
          </Menu>
        </PortalHost>
      )
    }

    const { rerender } = renderWeb(<Host visible={false} />)
    const trigger = screen.getByText('Actions').closest('[tabindex]')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')

    rerender(<Host visible />)
    expect(
      screen
        .getByText('Actions')
        .closest('[tabindex]')
        ?.getAttribute('aria-expanded'),
    ).toBe('true')
  })

  it('moves between items with the arrow keys', () => {
    renderWeb(
      <PortalHost>
        <Menu anchor={<Button>Actions</Button>} visible onDismiss={() => {}}>
          <Menu.Item label="Edit" />
          <Menu.Item label="Duplicate" />
          <Menu.Item label="Delete" />
        </Menu>
      </PortalHost>,
    )

    expect(document.activeElement?.textContent).toBe('Edit')
    press('ArrowDown')
    expect(document.activeElement?.textContent).toBe('Duplicate')
    press('ArrowDown')
    expect(document.activeElement?.textContent).toBe('Delete')
    press('ArrowDown')
    expect(document.activeElement?.textContent).toBe('Edit')
    press('ArrowUp')
    expect(document.activeElement?.textContent).toBe('Delete')
  })

  it('dismisses on Escape', () => {
    const onDismiss = jest.fn()
    renderWeb(
      <PortalHost>
        <Menu anchor={<Button>Actions</Button>} visible onDismiss={onDismiss}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>,
    )

    press('Escape')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('TextField supporting text and validity', () => {
  it('points aria-describedby at the supporting text', () => {
    renderWeb(<TextField label="Email" supportingText="We never share it." />)

    const input = screen.getByRole('textbox')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      'We never share it.',
    )
  })

  it('describes itself with the error message, and reports invalidity', () => {
    renderWeb(<TextField label="Email" errorText="Enter a valid address." />)

    const input = screen.getByRole('textbox')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(
      document.getElementById(input.getAttribute('aria-describedby') as string)
        ?.textContent,
    ).toBe('Enter a valid address.')
  })

  it('sets neither attribute when there is nothing to describe', () => {
    renderWeb(<TextField label="Email" />)

    const input = screen.getByRole('textbox')
    expect(input.getAttribute('aria-describedby')).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  it('gives each field its own supporting-text id', () => {
    renderWeb(
      <>
        <TextField label="Email" supportingText="First" />
        <TextField label="Name" supportingText="Second" />
      </>,
    )

    const [first, second] = screen.getAllByRole('textbox')
    expect(first.getAttribute('aria-describedby')).not.toBe(
      second.getAttribute('aria-describedby'),
    )
  })
})

describe('Tooltip description', () => {
  it('links the anchor to the tooltip only while it is shown', () => {
    function Host({ visible }: { visible: boolean }) {
      return (
        <PortalHost>
          <Tooltip anchor={<Button>Save</Button>} visible={visible}>
            Saves your changes
          </Tooltip>
        </PortalHost>
      )
    }

    const { rerender } = renderWeb(<Host visible={false} />)
    const anchor = () => screen.getByText('Save').closest('[tabindex]')
    expect(anchor()?.getAttribute('aria-describedby')).toBeNull()

    rerender(<Host visible />)
    const describedBy = anchor()?.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      'Saves your changes',
    )
  })
})
