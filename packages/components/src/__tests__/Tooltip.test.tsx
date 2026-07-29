import { lightTheme } from '@rootnative/core'
import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../button'
import { PortalHost } from '../portal/PortalHost'
import { Tooltip } from '../tooltip'

function renderTooltip(ui: React.ReactElement) {
  return renderWithTheme(<PortalHost>{ui}</PortalHost>)
}

// A dismissed tooltip stays mounted while its exit animation runs, so hiding is
// asserted through `onDismiss` rather than through the surface disappearing —
// the same shape the Menu and Dialog suites use.

/**
 * A pressable anchor, which is the shape that matters for touch: the long press
 * has to be injected into the anchor itself, because a wrapper would lose the
 * gesture to the anchor's own press handling.
 */
function PressableAnchor(props: Partial<React.ComponentProps<typeof Tooltip>>) {
  return (
    <Tooltip anchor={<Button>Save</Button>} testID="tooltip" {...props}>
      Save changes
    </Tooltip>
  )
}

/**
 * A non-pressable anchor. Hover lives on the wrapper, and RNTL stops at the
 * first ancestor carrying the handler — with a `Button` anchor it would find
 * the button's own state-layer `onHoverIn` and never reach the wrapper. A real
 * browser has no such problem: `pointerenter` reaches the wrapper and the
 * anchor both.
 */
function TextAnchor(props: Partial<React.ComponentProps<typeof Tooltip>>) {
  return (
    <Tooltip anchor={<Text>Info</Text>} testID="tooltip" {...props}>
      Extra detail
    </Tooltip>
  )
}

describe('Tooltip', () => {
  it('renders the anchor and nothing else while closed', () => {
    renderTooltip(<PressableAnchor />)
    expect(screen.getByText('Save')).toBeTruthy()
    expect(screen.queryByTestId('tooltip')).toBeNull()
    expect(screen.queryByText('Save changes')).toBeNull()
  })

  it('shows on a long press of the anchor', () => {
    renderTooltip(<PressableAnchor />)
    fireEvent(screen.getByText('Save'), 'longPress')
    expect(screen.getByText('Save changes')).toBeTruthy()
  })

  it("still calls the anchor's own onLongPress", () => {
    const onLongPress = jest.fn()
    renderTooltip(
      <Tooltip
        anchor={<Button onLongPress={onLongPress}>Save</Button>}
        testID="tooltip"
      >
        Save changes
      </Tooltip>,
    )

    fireEvent(screen.getByText('Save'), 'longPress')
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })

  it('shows on hover in and hides on hover out', () => {
    const onDismiss = jest.fn()
    renderTooltip(<TextAnchor onDismiss={onDismiss} />)

    fireEvent(screen.getByText('Info'), 'hoverIn')
    expect(screen.getByTestId('tooltip')).toBeTruthy()

    fireEvent(screen.getByText('Info'), 'hoverOut')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not report a dismissal for a hover that never showed anything', () => {
    const onDismiss = jest.fn()
    renderTooltip(<TextAnchor onDismiss={onDismiss} />)

    fireEvent(screen.getByText('Info'), 'hoverOut')
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it("hides when the anchor is pressed, after running the anchor's onPress", () => {
    const onPress = jest.fn()
    const onDismiss = jest.fn()
    renderTooltip(
      <Tooltip
        anchor={<Button onPress={onPress}>Save</Button>}
        onDismiss={onDismiss}
        testID="tooltip"
      >
        Save changes
      </Tooltip>,
    )

    fireEvent(screen.getByText('Save'), 'longPress')
    expect(screen.getByTestId('tooltip')).toBeTruthy()

    fireEvent.press(screen.getByText('Save'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders arbitrary children instead of the supporting text', () => {
    renderTooltip(
      <Tooltip anchor={<Button>Save</Button>} testID="tooltip">
        <View testID="custom-content" />
      </Tooltip>,
    )

    fireEvent(screen.getByText('Save'), 'longPress')
    expect(screen.getByTestId('custom-content')).toBeTruthy()
  })
})

describe('Tooltip — plain is transient', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('takes itself down after the MD3 1.5s duration', () => {
    const onDismiss = jest.fn()
    renderTooltip(<PressableAnchor onDismiss={onDismiss} />)
    fireEvent(screen.getByText('Save'), 'longPress')

    act(() => {
      jest.advanceTimersByTime(1499)
    })
    expect(screen.getByTestId('tooltip')).toBeTruthy()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('honours a custom duration', () => {
    const onDismiss = jest.fn()
    renderTooltip(<PressableAnchor duration={5000} onDismiss={onDismiss} />)
    fireEvent(screen.getByText('Save'), 'longPress')

    act(() => {
      jest.advanceTimersByTime(1500)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(3500)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('stays up for duration={0}', () => {
    renderTooltip(<PressableAnchor duration={0} />)
    fireEvent(screen.getByText('Save'), 'longPress')

    act(() => {
      jest.advanceTimersByTime(10000)
    })
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })

  it('never times a rich tooltip out', () => {
    renderTooltip(<PressableAnchor variant="rich" />)
    fireEvent(screen.getByText('Save'), 'longPress')

    act(() => {
      jest.advanceTimersByTime(10000)
    })
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })

  it('reports the timeout to a controlled consumer', () => {
    const onDismiss = jest.fn()
    renderTooltip(<PressableAnchor visible onDismiss={onDismiss} />)

    act(() => {
      jest.advanceTimersByTime(1500)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
    // Still up: visibility belongs to the consumer.
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })
})

describe('Tooltip — rich', () => {
  function renderRich(props?: Partial<React.ComponentProps<typeof Tooltip>>) {
    renderTooltip(
      <Tooltip
        anchor={<Button>Learn</Button>}
        variant="rich"
        subhead="Rich tooltip"
        actions={<Button variant="text">Got it</Button>}
        testID="tooltip"
        {...props}
      >
        Tooltips bring attention to a feature.
      </Tooltip>,
    )
    fireEvent(screen.getByText('Learn'), 'longPress')
  }

  it('renders a subhead, supporting text, and actions', () => {
    renderRich()
    expect(screen.getByText('Rich tooltip')).toBeTruthy()
    expect(
      screen.getByText('Tooltips bring attention to a feature.'),
    ).toBeTruthy()
    expect(screen.getByText('Got it')).toBeTruthy()
  })

  it('dismisses on an outside press', () => {
    const onDismiss = jest.fn()
    renderRich({ onDismiss })

    fireEvent.press(screen.getByLabelText('Close tooltip'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('honours a custom dismiss label', () => {
    renderRich({ dismissAccessibilityLabel: 'Dismiss help' })
    expect(screen.getByLabelText('Dismiss help')).toBeTruthy()
  })

  it('takes touches, unlike a plain tooltip', () => {
    renderRich()
    expect(screen.getByTestId('tooltip').props.pointerEvents).toBe('auto')
  })

  it('warns when a plain tooltip is given rich content', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderTooltip(
      <Tooltip anchor={<Button>Save</Button>} subhead="Nope" testID="tooltip">
        Save changes
      </Tooltip>,
    )
    fireEvent(screen.getByText('Save'), 'longPress')

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('rich variant only'),
    )
    expect(screen.queryByText('Nope')).toBeNull()
    errorSpy.mockRestore()
  })
})

describe('Tooltip — controlled', () => {
  it('never shows itself when visibility is driven from outside', () => {
    renderTooltip(<PressableAnchor visible={false} />)

    fireEvent(screen.getByText('Save'), 'longPress')
    expect(screen.queryByTestId('tooltip')).toBeNull()
  })

  it('stays up on hover out until the consumer closes it', () => {
    const onDismiss = jest.fn()
    renderTooltip(<TextAnchor visible onDismiss={onDismiss} />)

    fireEvent(screen.getByText('Info'), 'hoverOut')
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })
})

describe('Tooltip — tokens and accessibility', () => {
  function open(ui: React.ReactElement) {
    renderTooltip(ui)
    fireEvent(screen.getByText('Save'), 'longPress')
    return screen.getByTestId('tooltip')
  }

  it('applies the MD3 plain container and text tokens', () => {
    const style = StyleSheet.flatten(open(<PressableAnchor />).props.style)
    expect(style.backgroundColor).toBe(lightTheme.colors.inverseSurface)
    expect(style.borderRadius).toBe(lightTheme.shape.cornerExtraSmall)
    expect(style.maxWidth).toBe(200)
    expect(style.minHeight).toBe(24)

    const text = StyleSheet.flatten(
      screen.getByText('Save changes').props.style,
    )
    expect(text.color).toBe(lightTheme.colors.inverseOnSurface)
    expect(text.fontSize).toBe(lightTheme.typography.bodySmall.fontSize)
  })

  it('applies the MD3 rich container and text tokens', () => {
    const style = StyleSheet.flatten(
      open(<PressableAnchor variant="rich" subhead="Subhead" />).props.style,
    )
    expect(style.backgroundColor).toBe(lightTheme.colors.surfaceContainer)
    expect(style.borderRadius).toBe(lightTheme.shape.cornerMedium)
    expect(style.maxWidth).toBe(320)

    const subhead = StyleSheet.flatten(screen.getByText('Subhead').props.style)
    expect(subhead.color).toBe(lightTheme.colors.onSurfaceVariant)
    expect(subhead.fontSize).toBe(lightTheme.typography.titleSmall.fontSize)

    const text = StyleSheet.flatten(
      screen.getByText('Save changes').props.style,
    )
    expect(text.fontSize).toBe(lightTheme.typography.bodyMedium.fontSize)
  })

  it('honours the containerColor and contentColor overrides', () => {
    const surface = open(
      <PressableAnchor containerColor="#FF0000" contentColor="#00FF00" />,
    )
    expect(StyleSheet.flatten(surface.props.style).backgroundColor).toBe(
      '#FF0000',
    )
    expect(
      StyleSheet.flatten(screen.getByText('Save changes').props.style).color,
    ).toBe('#00FF00')
  })

  it('keeps the measuring wrapper out of the a11y tree and the tab order', () => {
    renderTooltip(<TextAnchor />)

    // react-native-web makes every enabled Pressable focusable and gives it a
    // pointer cursor; the wrapper is neither a control nor a tab stop.
    const [wrapper] = screen.UNSAFE_getAllByProps({ tabIndex: -1 })
    expect(wrapper.props.accessible).toBe(false)
    expect(wrapper.props.importantForAccessibility).toBe('no')
    expect(StyleSheet.flatten(wrapper.props.style).cursor).toBe('auto')
  })

  it('reports role="tooltip" and stays out of the way of touches', () => {
    const surface = open(<PressableAnchor />)
    expect(surface.props.role).toBe('tooltip')
    expect(surface.props.pointerEvents).toBe('none')
    expect(screen.queryByLabelText('Close tooltip')).toBeNull()
  })
})

// `measureInWindow` is a no-op under the RN jest preset, so every test above
// runs with `position === null`. Feed the measurement in to cover the seam
// between the resolved geometry and the style that reaches the surface.
describe('Tooltip — resolved placement', () => {
  const LAYER = { x: 0, y: 0, width: 400, height: 800 }
  let anchorRect = { x: 100, y: 300, width: 40, height: 40 }

  beforeEach(() => {
    anchorRect = { x: 100, y: 300, width: 40, height: 40 }
    jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
      this: { props?: { pointerEvents?: string } },
      callback,
    ) {
      // Only the overlay layer absolute-fills with `box-none`; the other
      // measured view is the wrapper around the anchor.
      const rect = this.props?.pointerEvents === 'box-none' ? LAYER : anchorRect
      callback(rect.x, rect.y, rect.width, rect.height)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function openAndLayOut(ui: React.ReactElement) {
    renderTooltip(ui)
    fireEvent(screen.getByText('Save'), 'longPress')
    fireEvent(screen.getByTestId('tooltip'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
    })
    return StyleSheet.flatten(screen.getByTestId('tooltip').props.style)
  }

  it('sits above the anchor, centred on it, 4dp clear', () => {
    const style = openAndLayOut(<PressableAnchor />)
    // 300 anchor top - 4 offset - 40 measured height.
    expect(style.top).toBe(256)
    // Centred: 100 + (40 - 200) / 2.
    expect(style.left).toBe(20)
  })

  it('flips below the anchor when there is no room above', () => {
    anchorRect = { x: 100, y: 8, width: 40, height: 40 }
    const style = openAndLayOut(<PressableAnchor />)
    // 8 anchor top + 40 height + 4 offset.
    expect(style.top).toBe(52)
  })

  it('shifts back inside the screen margin rather than overflowing it', () => {
    anchorRect = { x: 0, y: 300, width: 40, height: 40 }
    const style = openAndLayOut(<PressableAnchor />)
    expect(style.left).toBe(8)
  })
})

// What a device settles on after the entrance, which the rest of this file
// cannot see: `renderWithTheme` is a single pass, so the surface reads its
// `initial` (opacity 0) and stays there. Worth its own coverage because the
// `animate` target is *conditional* — it only leaves HIDDEN once the anchor
// geometry resolves, and that is the whole anti-flash guarantee.
describe('Tooltip — settled entrance', () => {
  const LAYER = { x: 0, y: 0, width: 400, height: 800 }
  const ANCHOR = { x: 100, y: 300, width: 40, height: 40 }

  function mockMeasure() {
    jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
      this: { props?: { pointerEvents?: string } },
      callback,
    ) {
      const rect = this.props?.pointerEvents === 'box-none' ? LAYER : ANCHOR
      callback(rect.x, rect.y, rect.width, rect.height)
    })
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('settles on its animate target once the geometry resolves', () => {
    mockMeasure()
    const { flush } = renderSettled(
      <PortalHost>
        <PressableAnchor />
      </PortalHost>,
    )
    fireEvent(screen.getByText('Save'), 'longPress')
    fireEvent(screen.getByTestId('tooltip'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
    })
    flush()

    expect(getStyle(screen.getByTestId('tooltip')).opacity).toBe(1)
  })

  it('stays hidden while the anchor is unmeasured', () => {
    // No `measureInWindow` stub, so `position` stays null and `animate` is still
    // HIDDEN — a flush cannot reveal the surface. A tooltip must not flash at
    // the layer's origin on its way to the anchor.
    const { flush } = renderSettled(
      <PortalHost>
        <PressableAnchor />
      </PortalHost>,
    )
    fireEvent(screen.getByText('Save'), 'longPress')
    flush()

    expect(getStyle(screen.getByTestId('tooltip')).opacity).toBe(0)
  })
})
