import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { PortalHost } from '../portal/PortalHost'
import type { SnackbarApi, SnackbarOptions } from '../snackbar'
import { SnackbarProvider, useSnackbar } from '../snackbar'

let api: SnackbarApi

function Harness() {
  api = useSnackbar()
  return <Text>app</Text>
}

function renderProvider(bottomOffset?: number) {
  return renderWithTheme(
    <PortalHost>
      <SnackbarProvider bottomOffset={bottomOffset}>
        <Harness />
      </SnackbarProvider>
    </PortalHost>,
  )
}

function show(options: SnackbarOptions) {
  let id = 0
  act(() => {
    id = api.show(options)
  })
  return id
}

describe('useSnackbar', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('throws outside a SnackbarProvider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderWithTheme(<Harness />)).toThrow(
      /must be called inside a <SnackbarProvider>/,
    )
    errorSpy.mockRestore()
  })

  it('renders nothing until show() is called', () => {
    renderProvider()
    expect(screen.getByText('app')).toBeTruthy()
    expect(screen.queryByText('Saved')).toBeNull()
  })

  it('shows a message', () => {
    renderProvider()
    show({ message: 'Saved' })
    expect(screen.getByText('Saved')).toBeTruthy()
  })

  it('auto-dismisses after the short duration', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'Saved', onDismiss })

    act(() => {
      jest.advanceTimersByTime(3999)
    })
    expect(screen.getByText('Saved')).toBeTruthy()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(onDismiss).toHaveBeenCalledWith('timeout')
  })

  it('uses the 10s long duration when asked', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'Saved', duration: 'long', onDismiss })

    act(() => {
      jest.advanceTimersByTime(9999)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(onDismiss).toHaveBeenCalledWith('timeout')
  })

  it('accepts a numeric duration', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'Saved', duration: 1500, onDismiss })

    act(() => {
      jest.advanceTimersByTime(1500)
    })
    expect(onDismiss).toHaveBeenCalledWith('timeout')
  })

  it('stays up indefinitely when it carries an action', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'Deleted', actionLabel: 'Undo', onDismiss })

    act(() => {
      jest.advanceTimersByTime(60_000)
    })
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByText('Deleted')).toBeTruthy()
  })

  it('runs the action and dismisses when it is pressed', () => {
    renderProvider()
    const onAction = jest.fn()
    const onDismiss = jest.fn()
    show({ message: 'Deleted', actionLabel: 'Undo', onAction, onDismiss })

    fireEvent.press(screen.getByText('Undo'))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledWith('action')
  })

  it('dismisses via the close button', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({
      message: 'Heads up',
      duration: 'indefinite',
      showCloseIcon: true,
      onDismiss,
    })

    fireEvent.press(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledWith('close')
  })

  it('warns about an indefinite snackbar with no way out', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    renderProvider()
    show({ message: 'Stuck', duration: 'indefinite' })
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('indefinite snackbar'),
    )
    warnSpy.mockRestore()
  })
})

describe('Snackbar queue', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('shows one at a time and promotes the next in FIFO order', () => {
    renderProvider()
    show({ message: 'first' })
    show({ message: 'second' })

    expect(screen.getByText('first')).toBeTruthy()
    expect(screen.queryByText('second')).toBeNull()

    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(screen.getByText('second')).toBeTruthy()
  })

  it('replaces the visible snackbar when replace is set', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'first', onDismiss })
    show({ message: 'second', replace: true })

    expect(onDismiss).toHaveBeenCalledWith('replaced')
    expect(screen.getByText('second')).toBeTruthy()
  })

  it('restarts the timer for the promoted snackbar', () => {
    renderProvider()
    const onSecondDismiss = jest.fn()
    show({ message: 'first' })
    show({ message: 'second', onDismiss: onSecondDismiss })

    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(onSecondDismiss).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(onSecondDismiss).toHaveBeenCalledWith('timeout')
  })

  it('hides the visible snackbar with hide()', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'Saved', onDismiss })

    act(() => {
      api.hide()
    })
    expect(onDismiss).toHaveBeenCalledWith('manual')
  })

  it('hides a specific queued snackbar by id without showing it', () => {
    renderProvider()
    const onDismiss = jest.fn()
    show({ message: 'first' })
    const queuedId = show({ message: 'second', onDismiss })

    act(() => {
      api.hide(queuedId)
    })
    expect(onDismiss).toHaveBeenCalledWith('manual')

    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(screen.queryByText('second')).toBeNull()
  })

  // A dismissed snackbar stays mounted until its `<Presence>` exit settles, so
  // assert on the dismiss callbacks (and on what never mounts) rather than on
  // the immediate disappearance of the outgoing one.
  it('drops everything on clear()', () => {
    renderProvider()
    const onFirst = jest.fn()
    const onSecond = jest.fn()
    show({ message: 'first', onDismiss: onFirst })
    show({ message: 'second', onDismiss: onSecond })

    act(() => {
      api.clear()
    })
    expect(onFirst).toHaveBeenCalledWith('manual')
    expect(onSecond).toHaveBeenCalledWith('manual')

    act(() => {
      jest.advanceTimersByTime(4000)
    })
    expect(screen.queryByText('second')).toBeNull()
  })
})

describe('Snackbar tokens', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('applies the MD3 inverse-surface container', () => {
    renderProvider()
    show({ message: 'Saved' })

    const surface = screen.UNSAFE_getByProps({ role: 'alert' })
    const style = StyleSheet.flatten(surface.props.style)
    expect(style.backgroundColor).toBe(lightTheme.colors.inverseSurface)
    expect(style.borderRadius).toBe(lightTheme.shape.cornerExtraSmall)
    expect(style.minHeight).toBe(48)
    expect(style.maxWidth).toBe(600)
  })

  it('renders the message in inverseOnSurface', () => {
    renderProvider()
    show({ message: 'Saved' })

    const style = StyleSheet.flatten(screen.getByText('Saved').props.style)
    expect(style.color).toBe(lightTheme.colors.inverseOnSurface)
  })

  it('honours per-snackbar color overrides', () => {
    renderProvider()
    show({
      message: 'Saved',
      containerColor: '#123456',
      contentColor: '#654321',
    })

    const surface = screen.UNSAFE_getByProps({ role: 'alert' })
    expect(StyleSheet.flatten(surface.props.style).backgroundColor).toBe(
      '#123456',
    )
    expect(
      StyleSheet.flatten(screen.getByText('Saved').props.style).color,
    ).toBe('#654321')
  })
})
