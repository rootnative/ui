import { lightTheme } from '@rootnative/core'
import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { FAB } from '../fab'
import { FAB_SIZES } from '../fab/styles'
import { PortalHost } from '../portal/PortalHost'
import type { SnackbarApi, SnackbarOptions } from '../snackbar'
import {
  SnackbarProvider,
  snackbarOffsetFor,
  useSnackbar,
  useSnackbarOffset,
} from '../snackbar'
import { SNACKBAR_SLIDE } from '../snackbar/styles'

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

// What a device settles on after the entrance, which the rest of this file
// cannot see: `renderWithTheme` is a single pass, so the layer reads its
// `initial` (opacity 0, translated down by SNACKBAR_SLIDE) and stays there.
// Nothing in the snackbar API carries a `testID` down — the queue is driven by
// `show()`, not by props — so the layer has a fixed handle.
describe('Snackbar — settled entrance', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('settles on its animate target', () => {
    const { flush } = renderSettled(
      <PortalHost>
        <SnackbarProvider>
          <Harness />
        </SnackbarProvider>
      </PortalHost>,
    )
    show({ message: 'Saved' })

    // Un-flushed, so this is the `initial` — the entrance is a real animation,
    // which is what makes the assertion below worth making.
    const initial = getStyle(screen.getByTestId('snackbar-layer'))
    expect(initial.opacity).toBe(0)
    expect(initial.transform).toEqual([{ translateY: SNACKBAR_SLIDE }])

    flush()

    const settled = getStyle(screen.getByTestId('snackbar-layer'))
    expect(settled.opacity).toBe(1)
    expect(settled.transform).toEqual([{ translateY: 0 }])
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

describe('snackbar bottom offset', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  /** The layer's own padding — where `bottomOffset` lands. */
  function layerPaddingBottom(): number {
    return StyleSheet.flatten(
      screen.getByTestId('snackbar-safe-area').props.style,
    ).paddingBottom
  }

  function OffsetScreen({ offset }: { offset: number }) {
    useSnackbarOffset(offset)
    return <Text>screen</Text>
  }

  it('adds bottomOffset to the layer padding', () => {
    renderProvider(40)
    show({ message: 'Saved' })
    // SNACKBAR_MARGIN (16) + the prop.
    expect(layerPaddingBottom()).toBe(56)
  })

  it('lets a mounted screen override the provider prop', () => {
    renderWithTheme(
      <PortalHost>
        <SnackbarProvider bottomOffset={40}>
          <Harness />
          <OffsetScreen offset={80} />
        </SnackbarProvider>
      </PortalHost>,
    )
    show({ message: 'Saved' })
    expect(layerPaddingBottom()).toBe(96)
  })

  it('falls back to the prop once the screen unmounts', () => {
    function App({ mounted }: { mounted: boolean }) {
      return (
        <PortalHost>
          <SnackbarProvider bottomOffset={40}>
            <Harness />
            {mounted ? <OffsetScreen offset={80} /> : null}
          </SnackbarProvider>
        </PortalHost>
      )
    }

    const { rerender } = renderWithTheme(<App mounted />)
    show({ message: 'Saved' })
    expect(layerPaddingBottom()).toBe(96)

    rerender(<App mounted={false} />)
    expect(layerPaddingBottom()).toBe(56)
  })

  it('takes the largest offset while two screens overlap', () => {
    // The transition case the stack exists for: the outgoing screen unmounts
    // after the incoming one mounts, so both are pushed at once.
    renderWithTheme(
      <PortalHost>
        <SnackbarProvider bottomOffset={0}>
          <Harness />
          <OffsetScreen offset={80} />
          <OffsetScreen offset={40} />
        </SnackbarProvider>
      </PortalHost>,
    )
    show({ message: 'Saved' })
    expect(layerPaddingBottom()).toBe(96)
  })

  it('treats a pushed 0 as an override, not as absent', () => {
    renderWithTheme(
      <PortalHost>
        <SnackbarProvider bottomOffset={40}>
          <Harness />
          <OffsetScreen offset={0} />
        </SnackbarProvider>
      </PortalHost>,
    )
    show({ message: 'Saved' })
    // The prop would give 56. The pushed 0 wins, leaving only the margin.
    expect(layerPaddingBottom()).toBe(16)
  })

  it('tracks a changing offset', () => {
    function App({ offset }: { offset: number }) {
      return (
        <PortalHost>
          <SnackbarProvider bottomOffset={0}>
            <Harness />
            <OffsetScreen offset={offset} />
          </SnackbarProvider>
        </PortalHost>
      )
    }

    const { rerender } = renderWithTheme(<App offset={40} />)
    show({ message: 'Saved' })
    expect(layerPaddingBottom()).toBe(56)

    rerender(<App offset={80} />)
    expect(layerPaddingBottom()).toBe(96)
  })

  it('throws outside a SnackbarProvider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderWithTheme(<OffsetScreen offset={40} />)).toThrow(
      /must be called inside a <SnackbarProvider>/,
    )
    errorSpy.mockRestore()
  })

  it('snackbarOffsetFor adds the snackbar margin to a height', () => {
    expect(snackbarOffsetFor(FAB_SIZES.medium)).toBe(72)
    expect(snackbarOffsetFor(FAB_SIZES.small)).toBe(56)
    expect(snackbarOffsetFor(FAB_SIZES.large)).toBe(112)
    // The extended FAB is 56dp whatever its `size` prop says.
    expect(snackbarOffsetFor(FAB_SIZES.extended)).toBe(72)
  })

  // `FAB_SIZES` now feeds `createStyles`, so asserting the token against the
  // rendered height only proves the value reached the style — both sides move
  // together and a wrong token passes. The MD3 numbers are the real invariant,
  // so they are written out literally here. This is the one place in the
  // library where a magic number is the point: change it only against the spec.
  it('FAB_SIZES holds the MD3 container heights', () => {
    expect(FAB_SIZES).toEqual({
      small: 40,
      medium: 56,
      large: 96,
      extended: 56,
    })
  })

  it('FAB renders at the height its token claims', () => {
    // Guards the other direction from the literals above: that the token is
    // what the component actually lays out with, not a parallel constant.
    for (const size of ['small', 'medium', 'large'] as const) {
      renderWithTheme(<FAB icon="plus" size={size} accessibilityLabel={size} />)
      const style = StyleSheet.flatten(screen.getByLabelText(size).props.style)
      expect(style.height).toBe(FAB_SIZES[size])
      screen.unmount()
    }
  })

  it('an extended FAB is 56dp whatever its size prop says', () => {
    renderWithTheme(
      <FAB icon="plus" label="Compose" size="large" accessibilityLabel="c" />,
    )
    const style = StyleSheet.flatten(screen.getByLabelText('c').props.style)
    expect(style.height).toBe(FAB_SIZES.extended)
  })
})
