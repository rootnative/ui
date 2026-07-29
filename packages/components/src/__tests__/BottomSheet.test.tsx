import { lightTheme } from '@rootnative/core'
import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { BottomSheet } from '../bottom-sheet'
import {
  POSITIONAL_THRESHOLD,
  VELOCITY_THRESHOLD,
  pickSnapTarget,
  resolveSnapHeights,
} from '../bottom-sheet/geometry'
import { PortalHost } from '../portal/PortalHost'

function renderSheet(ui: React.ReactElement) {
  return renderWithTheme(<PortalHost>{ui}</PortalHost>)
}

/** Feed the surface the layout pass the test renderer never runs. */
function measureSheet(height = 400) {
  fireEvent(screen.getByTestId('sheet'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 360, height } },
  })
}

describe('BottomSheet', () => {
  it('renders nothing while not visible', () => {
    renderSheet(
      <BottomSheet visible={false} onDismiss={jest.fn()}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    expect(screen.queryByText('Sheet body')).toBeNull()
  })

  it('renders its content and a drag handle when visible', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    expect(await screen.findByText('Sheet body')).toBeTruthy()
    expect(screen.getByLabelText('Drag handle')).toBeTruthy()
  })

  it('hides the drag handle with showDragHandle={false}', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} showDragHandle={false}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    await screen.findByText('Sheet body')
    expect(screen.queryByLabelText('Drag handle')).toBeNull()
  })

  it('applies the MD3 container tokens', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} testID="sheet">
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const style = StyleSheet.flatten(
      (await screen.findByTestId('sheet')).props.style,
    )
    expect(style.backgroundColor).toBe(lightTheme.colors.surfaceContainerLow)
    expect(style.borderTopLeftRadius).toBe(lightTheme.shape.cornerExtraLarge)
    expect(style.borderTopRightRadius).toBe(lightTheme.shape.cornerExtraLarge)
    expect(style.maxWidth).toBe(640)
  })

  it('honours the containerColor override', async () => {
    renderSheet(
      <BottomSheet
        visible
        onDismiss={jest.fn()}
        testID="sheet"
        containerColor="#FF0000"
      >
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const style = StyleSheet.flatten(
      (await screen.findByTestId('sheet')).props.style,
    )
    expect(style.backgroundColor).toBe('#FF0000')
  })

  it('stays hidden until measured, then enters', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} testID="sheet">
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const surface = await screen.findByTestId('sheet')
    expect(StyleSheet.flatten(surface.props.style).opacity).toBe(0)
    expect(surface.props.pointerEvents).toBe('none')

    measureSheet()

    const measured = screen.getByTestId('sheet')
    expect(StyleSheet.flatten(measured.props.style).opacity).not.toBe(0)
    expect(measured.props.pointerEvents).toBe('auto')
  })

  it('reports itself as a modal dialog', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} testID="sheet">
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const surface = await screen.findByTestId('sheet')
    expect(surface.props.role).toBe('dialog')
    expect(surface.props['aria-modal']).toBe(true)
  })

  it('dismisses on a scrim press', async () => {
    const onDismiss = jest.fn()
    renderSheet(
      <BottomSheet visible onDismiss={onDismiss}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    fireEvent.press(await screen.findByLabelText('Close sheet'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss on a scrim press when dismissable is false', async () => {
    const onDismiss = jest.fn()
    renderSheet(
      <BottomSheet visible onDismiss={onDismiss} dismissable={false}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    await screen.findByText('Sheet body')
    expect(screen.queryByLabelText('Close sheet')).toBeNull()

    const scrim = screen.UNSAFE_getByProps({
      accessibilityLabel: 'Close sheet',
    })
    expect(scrim.props.disabled).toBe(true)
    fireEvent.press(scrim)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('renders no scrim as a standard sheet', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} variant="standard">
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    await screen.findByText('Sheet body')
    expect(screen.queryByLabelText('Close sheet')).toBeNull()
  })

  it('carries no modal semantics as a standard sheet', async () => {
    renderSheet(
      <BottomSheet
        visible
        onDismiss={jest.fn()}
        variant="standard"
        testID="sheet"
      >
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const surface = await screen.findByTestId('sheet')
    expect(surface.props.role).toBeUndefined()
    expect(surface.props.accessibilityViewIsModal).toBe(false)
  })

  it('announces the drag handle as adjustable with a dismiss action', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} testID="sheet">
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const handle = await screen.findByLabelText('Drag handle')
    expect(handle.props.accessibilityRole).toBe('adjustable')
    expect(handle.props.accessibilityActions).toEqual([
      { name: 'escape', label: 'Dismiss' },
    ])
  })

  it('dismisses through the escape accessibility action', async () => {
    const onDismiss = jest.fn()
    renderSheet(
      <BottomSheet visible onDismiss={onDismiss}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    fireEvent(
      await screen.findByLabelText('Drag handle'),
      'accessibilityAction',
      { nativeEvent: { actionName: 'escape' } },
    )
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('omits the dismiss action when not dismissable', async () => {
    renderSheet(
      <BottomSheet visible onDismiss={jest.fn()} dismissable={false}>
        <Text>Sheet body</Text>
      </BottomSheet>,
    )
    const handle = await screen.findByLabelText('Drag handle')
    expect(handle.props.accessibilityActions).toEqual([])
  })

  describe('with snap points', () => {
    it('sizes the surface to the tallest snap', async () => {
      renderSheet(
        <BottomSheet
          visible
          onDismiss={jest.fn()}
          testID="sheet"
          snapPoints={[200, 400]}
        >
          <Text>Sheet body</Text>
        </BottomSheet>,
      )
      const style = StyleSheet.flatten(
        (await screen.findByTestId('sheet')).props.style,
      )
      expect(style.height).toBe(400)
    })

    it('exposes expand/collapse actions and moves between snaps', async () => {
      const onSnapIndexChange = jest.fn()
      renderSheet(
        <BottomSheet
          visible
          onDismiss={jest.fn()}
          testID="sheet"
          snapPoints={[200, 400]}
          onSnapIndexChange={onSnapIndexChange}
        >
          <Text>Sheet body</Text>
        </BottomSheet>,
      )
      measureSheet(400)

      const handle = screen.getByLabelText('Drag handle')
      expect(handle.props.accessibilityActions).toEqual([
        { name: 'increment', label: 'Expand' },
        { name: 'decrement', label: 'Collapse' },
        { name: 'escape', label: 'Dismiss' },
      ])
      expect(handle.props.accessibilityValue).toEqual({
        min: 0,
        max: 1,
        now: 0,
      })
      // Entering at the default snap is not a change.
      expect(onSnapIndexChange).not.toHaveBeenCalled()

      fireEvent(handle, 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      })
      expect(onSnapIndexChange).toHaveBeenCalledWith(1)
      expect(
        screen.getByLabelText('Drag handle').props.accessibilityValue,
      ).toEqual({ min: 0, max: 1, now: 1 })

      fireEvent(screen.getByLabelText('Drag handle'), 'accessibilityAction', {
        nativeEvent: { actionName: 'decrement' },
      })
      expect(onSnapIndexChange).toHaveBeenCalledWith(0)
    })

    it('opens at defaultSnapIndex', async () => {
      renderSheet(
        <BottomSheet
          visible
          onDismiss={jest.fn()}
          testID="sheet"
          snapPoints={[200, 400]}
          defaultSnapIndex={1}
        >
          <Text>Sheet body</Text>
        </BottomSheet>,
      )
      measureSheet(400)
      expect(
        (await screen.findByLabelText('Drag handle')).props.accessibilityValue,
      ).toEqual({ min: 0, max: 1, now: 1 })
    })

    it('follows a controlled snapIndex', async () => {
      const { rerender } = renderSheet(
        <BottomSheet
          visible
          onDismiss={jest.fn()}
          testID="sheet"
          snapPoints={[200, 400]}
          snapIndex={0}
        >
          <Text>Sheet body</Text>
        </BottomSheet>,
      )
      measureSheet(400)

      rerender(
        <PortalHost>
          <BottomSheet
            visible
            onDismiss={jest.fn()}
            testID="sheet"
            snapPoints={[200, 400]}
            snapIndex={1}
          >
            <Text>Sheet body</Text>
          </BottomSheet>
        </PortalHost>,
      )
      expect(
        screen.getByLabelText('Drag handle').props.accessibilityValue,
      ).toEqual({ min: 0, max: 1, now: 1 })
    })
  })
})

// What a device settles on after the entrance, which the rest of this file
// cannot see. The sheet is the odd one of the five entrance components: its
// `Motion.View` layer only animates on the way *out* (`initial`/`animate` are
// both `translateY: 0`), so the entrance is the spring on `dragY` — jump to
// fully hidden, spring onto the opening snap — and it lands on the surface that
// already carries the consumer's `testID`. The scrim is a plain Motion fade.
// Unlike the other four, these two also pass with a no-op flush: the entrance
// effect calls `setEntered(true)` right after it springs `dragY`, and that state
// update is itself the extra render pass a settle needs. `renderSettled` is kept
// anyway — the assertion is about the settled offset, and it should not quietly
// start reading the jumped-to value if that incidental pass ever goes away.
describe('BottomSheet — settled entrance', () => {
  /** The drag style is axis-agnostic, so it carries both translate keys. */
  function sheetTranslateY() {
    const { transform } = getStyle(screen.getByTestId('sheet')) as {
      transform?: Array<Record<string, number>>
    }
    return transform?.find((entry) => 'translateY' in entry)?.translateY
  }

  it('springs the surface from fully hidden onto its snap offset', async () => {
    const { flush } = renderSettled(
      <PortalHost>
        <BottomSheet visible onDismiss={jest.fn()} testID="sheet">
          <Text>Sheet body</Text>
        </BottomSheet>
      </PortalHost>,
    )
    await screen.findByTestId('sheet')
    // Sizing to content, so the only snap is the sheet's own height and the
    // settled offset is 0 — fully visible, having started 400 lower.
    measureSheet(400)
    flush()

    expect(sheetTranslateY()).toBe(0)
    expect(getStyle(screen.getByTestId('sheet-scrim')).opacity).toBe(1)
  })

  it('settles on the opening snap rather than on fully open', async () => {
    const { flush } = renderSettled(
      <PortalHost>
        <BottomSheet
          visible
          onDismiss={jest.fn()}
          testID="sheet"
          snapPoints={[200, 400]}
        >
          <Text>Sheet body</Text>
        </BottomSheet>
      </PortalHost>,
    )
    await screen.findByTestId('sheet')
    measureSheet(400)
    flush()

    // Surface sized to the tallest snap (400), opening at index 0 (200 visible),
    // so it rests 200px down — the assertion a flush-blind test cannot make,
    // since an unflushed read is still at the 400 it was jumped to.
    expect(sheetTranslateY()).toBe(200)
  })
})

describe('BottomSheet — geometry', () => {
  describe('resolveSnapHeights', () => {
    it('passes dp values through, sorted ascending', () => {
      expect(resolveSnapHeights([400, 200], null)).toEqual([200, 400])
    })

    it('resolves percentages against the layer height', () => {
      expect(resolveSnapHeights(['50%', '100%'], 800)).toEqual([400, 800])
    })

    it('returns null for percentages while the layer is unmeasured', () => {
      expect(resolveSnapHeights(['50%'], null)).toBeNull()
    })

    it('clamps to the layer height and dedupes', () => {
      expect(resolveSnapHeights([900, '100%'], 800)).toEqual([800])
    })

    it('drops non-positive snap points', () => {
      expect(resolveSnapHeights([0, -10, 300], 800)).toEqual([300])
    })
  })

  describe('pickSnapTarget', () => {
    // A 600px sheet with snaps at 200px and 600px visible: offsets are
    // [400, 0] (parallel to ascending heights), hidden at 600.
    const base = {
      offsets: [400, 0],
      hiddenOffset: 600,
      dismissable: true,
    }

    it('springs back from a small slow drag', () => {
      const target = pickSnapTarget({
        ...base,
        position: POSITIONAL_THRESHOLD - 1,
        velocity: 0,
        anchor: 0,
      })
      expect(target).toBe(0)
    })

    it('settles at the nearest anchor after a long slow drag', () => {
      const target = pickSnapTarget({
        ...base,
        position: 300,
        velocity: 0,
        anchor: 0,
      })
      expect(target).toBe(400)
    })

    it('a fast downward fling commits to the next anchor down', () => {
      const target = pickSnapTarget({
        ...base,
        position: 40,
        velocity: VELOCITY_THRESHOLD + 1,
        anchor: 0,
      })
      expect(target).toBe(400)
    })

    it('a fast upward fling commits to the next anchor up', () => {
      const target = pickSnapTarget({
        ...base,
        position: 360,
        velocity: -(VELOCITY_THRESHOLD + 1),
        anchor: 400,
      })
      expect(target).toBe(0)
    })

    it('a slow drag past an intermediate snap settles there, not at dismissal', () => {
      const target = pickSnapTarget({
        ...base,
        position: 430,
        velocity: 0,
        anchor: 0,
      })
      expect(target).toBe(400)
    })

    it('dismisses when released nearest the hidden offset', () => {
      const target = pickSnapTarget({
        ...base,
        position: 540,
        velocity: 0,
        anchor: 400,
      })
      expect(target).toBe(600)
    })

    it('a fast fling below the lowest snap dismisses', () => {
      const target = pickSnapTarget({
        ...base,
        position: 410,
        velocity: VELOCITY_THRESHOLD + 1,
        anchor: 400,
      })
      expect(target).toBe(600)
    })

    it('never dismisses when dismissable is false', () => {
      const target = pickSnapTarget({
        ...base,
        dismissable: false,
        position: 590,
        velocity: VELOCITY_THRESHOLD + 1,
        anchor: 400,
      })
      expect(target).toBe(400)
    })
  })
})
