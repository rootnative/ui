import { MotionConfig } from '@rootnative/inertia'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { Pressable, Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { AppBar } from '../appbar'
import { Avatar } from '../avatar'
import { BottomSheet } from '../bottom-sheet'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Card } from '../card'
import { Checkbox } from '../checkbox'
import { Chip } from '../chip'
import { Dialog } from '../dialog'
import { FAB } from '../fab'
import { IconButton } from '../icon-button'
import { ListItem } from '../list'
import { LoadingIndicator } from '../loading-indicator'
import { Menu } from '../menu'
import { NavigationBar } from '../navigation-bar'
import { PortalHost } from '../portal/PortalHost'
import { CircularProgress, LinearProgress } from '../progress'
import { Radio } from '../radio'
import { Slider } from '../slider'
import { SnackbarProvider, useSnackbar } from '../snackbar'
import { Switch } from '../switch'
import { Tabs } from '../tabs'
import { TextField } from '../text-field'
import { Tooltip } from '../tooltip'

/** Shows a snackbar on mount so the enter transition is under test. */
function SnackbarOnMount() {
  const snackbar = useSnackbar()
  useEffect(() => {
    snackbar.show({
      message: 'Saved',
      duration: 'indefinite',
      showCloseIcon: true,
    })
  }, [snackbar])
  return null
}

/**
 * AppBar's gated animation is the elevation/tonal shift, and `useAnimation`
 * seeds its initial value without animating — so a bar that mounts already
 * elevated animates nothing. The trigger sits behind a plain `Pressable` rather
 * than a mount effect so `settle` owns the transition, which is what lets the
 * positive control below prove this case reaches it.
 */
function AppBarElevationToggle() {
  const [elevated, setElevated] = useState(false)
  return (
    <>
      <AppBar title="Inbox" elevated={elevated} />
      <Pressable testID="rm-appbar-raise" onPress={() => setElevated(true)} />
    </>
  )
}

/**
 * Drives the press gesture the state-layer family's transitions ride. Nothing
 * animates on a plain mount for these — the layer sits at rest until a
 * pointer arrives.
 */
const pressIn = (testID: string) => () => {
  fireEvent(screen.getByTestId(testID), 'pressIn')
}

// Every animated value in this library must collapse to a hard cut when the OS
// asks for reduced motion. inertia gates that inside `useAnimation` /
// `useAnimator` / `useGesture` / `useGestureLayer`, but NOT inside `useSpring` /
// `useBooleanSpring` — those are documented as reduced-motion-unaware because
// gating is wrong at their gesture-smoothing call sites. Components therefore
// route boolean progress through `useBooleanProgress` (which wraps
// `useAnimation`), and this suite is what keeps a future component from
// reaching for `useBooleanSpring` and silently losing the gate.
//
// `reducedMotion="always"` is the strongest equivalent of the OS setting — it
// forces `useShouldReduceMotion()` true regardless of the device. Under it, no
// Reanimated animation primitive should run at all. Nested inside
// `ThemeProvider`'s own `<MotionConfig transitions>`, so the theme's named
// spring tokens still resolve while `reducedMotion` is overridden.

interface ReducedMotionCase {
  name: string
  /**
   * Produced per case rather than held in the array, so each `it` mounts a
   * fresh tree.
   */
  render: () => ReactElement
  /**
   * Runs after the render, for a component whose animation does not start
   * until something has been measured.
   */
  settle?: () => void
}

/** Components whose primary state transition rides a spring. */
const CASES: readonly ReducedMotionCase[] = [
  { name: 'Checkbox', render: () => <Checkbox value /> },
  { name: 'Radio', render: () => <Radio value /> },
  { name: 'Switch', render: () => <Switch value /> },
  { name: 'Chip', render: () => <Chip selected>Tag</Chip> },
  {
    name: 'IconButton',
    render: () => (
      <IconButton icon="heart" accessibilityLabel="Like" selected />
    ),
  },
  {
    name: 'Button',
    render: () => <Button testID="rm-button">Save</Button>,
    settle: pressIn('rm-button'),
  },
  {
    name: 'FAB',
    render: () => <FAB icon="plus" accessibilityLabel="Add" testID="rm-fab" />,
    settle: pressIn('rm-fab'),
  },
  {
    name: 'Card',
    render: () => (
      <Card onPress={() => {}} testID="rm-card">
        <Text>Body</Text>
      </Card>
    ),
    settle: pressIn('rm-card'),
  },
  {
    name: 'ListItem',
    render: () => (
      <ListItem headlineText="Inbox" onPress={() => {}} testID="rm-item" />
    ),
    settle: pressIn('rm-item'),
  },
  {
    name: 'Avatar',
    render: () => (
      <Avatar
        label="AB"
        onPress={() => {}}
        accessibilityLabel="Profile"
        testID="rm-avatar"
      />
    ),
    settle: pressIn('rm-avatar'),
  },
  {
    name: 'ButtonGroup',
    render: () => (
      <ButtonGroup
        selectionMode="single"
        defaultValue="day"
        items={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
        ]}
      />
    ),
    // Each item's selected progress seeds from the initial selection, so a
    // plain mount animates nothing — the transition starts when it moves.
    settle: () => {
      fireEvent.press(screen.getByText('Week'))
    },
  },
  {
    name: 'TextField',
    render: () => <TextField label="Name" />,
    // Focus drives the label float and the outline/label colour cascades.
    settle: () => {
      fireEvent(screen.getByLabelText('Name'), 'focus')
    },
  },
  {
    name: 'AppBar',
    render: () => <AppBarElevationToggle />,
    settle: () => {
      fireEvent.press(screen.getByTestId('rm-appbar-raise'))
    },
  },
  { name: 'Slider', render: () => <Slider defaultValue={0.5} /> },
  {
    name: 'LoadingIndicator',
    render: () => <LoadingIndicator accessibilityLabel="Loading" />,
  },
  {
    name: 'LinearProgress (indeterminate)',
    render: () => <LinearProgress accessibilityLabel="Loading" />,
    // The slide's keyframes derive from the measured track width — feed a
    // layout in so the loop has distance to cover.
    settle: () => {
      fireEvent(screen.getByRole('progressbar'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 4 } },
      })
    },
  },
  {
    name: 'CircularProgress (indeterminate)',
    render: () => <CircularProgress accessibilityLabel="Loading" />,
  },
  {
    name: 'Dialog',
    render: () => (
      <PortalHost>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
  },
  {
    name: 'Dialog (fullscreen)',
    render: () => (
      <PortalHost>
        <Dialog visible variant="fullscreen" onDismiss={() => {}}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
  },
  {
    name: 'Snackbar',
    render: () => (
      <PortalHost>
        <SnackbarProvider>
          <SnackbarOnMount />
        </SnackbarProvider>
      </PortalHost>
    ),
  },
  {
    name: 'Menu',
    render: () => (
      <PortalHost>
        <Menu visible anchor={null} onDismiss={() => {}}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>
    ),
  },
  {
    name: 'Tabs',
    render: () => (
      <Tabs
        items={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />
    ),
    // The indicator carries the animation, and it only mounts once the active
    // tab has reported a layout — which never happens on its own in a test
    // renderer. Feed one in, or this case would assert nothing.
    settle: () => {
      fireEvent(screen.getByRole('tab', { name: 'Alpha' }), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 48 } },
      })
      fireEvent(screen.getByText('Alpha'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 60, height: 20 } },
      })
    },
  },
  {
    name: 'NavigationBar',
    render: () => (
      <NavigationBar
        items={[
          { value: 'home', label: 'Home', icon: 'home-outline' },
          { value: 'search', label: 'Search', icon: 'magnify' },
        ]}
      />
    ),
    // The indicator progress seeds from the initial selection, so a plain
    // mount animates nothing — the transition under test starts when the
    // selection moves.
    settle: () => {
      fireEvent.press(screen.getByRole('tab', { name: 'Search' }))
    },
  },
  {
    name: 'BottomSheet',
    render: () => (
      <PortalHost>
        <BottomSheet visible onDismiss={() => {}} testID="rm-sheet">
          <Text>Sheet body</Text>
        </BottomSheet>
      </PortalHost>
    ),
    // The enter slide starts once the surface has been measured, and the
    // release-settle spring is gated on the same flag — feed the layout in,
    // or this case would assert nothing.
    settle: () => {
      fireEvent(screen.getByTestId('rm-sheet'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 400 } },
      })
    },
  },
  {
    name: 'Tooltip',
    render: () => (
      <PortalHost>
        <Tooltip visible anchor={null} onDismiss={() => {}}>
          Save changes
        </Tooltip>
      </PortalHost>
    ),
  },
  {
    name: 'Tooltip (rich)',
    render: () => (
      <PortalHost>
        <Tooltip visible variant="rich" anchor={null} onDismiss={() => {}}>
          Save changes
        </Tooltip>
      </PortalHost>
    ),
  },
]

describe('reduced motion', () => {
  let withSpring: jest.SpyInstance
  let withTiming: jest.SpyInstance
  let withDecay: jest.SpyInstance

  beforeEach(() => {
    withSpring = jest.spyOn(Reanimated, 'withSpring')
    withTiming = jest.spyOn(Reanimated, 'withTiming')
    withDecay = jest.spyOn(Reanimated, 'withDecay')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe.each(CASES)('$name', ({ render, settle }) => {
    it('runs no animation primitive when reducedMotion="always"', () => {
      renderWithTheme(
        <MotionConfig reducedMotion="always">{render()}</MotionConfig>,
      )
      settle?.()

      expect(withSpring).not.toHaveBeenCalled()
      expect(withTiming).not.toHaveBeenCalled()
      expect(withDecay).not.toHaveBeenCalled()
    })
  })

  // Positive control, per case: with the gate lifted, the exact same mount +
  // settle DOES animate. Without this a case could pass the block above while
  // asserting nothing, which is how a component can be listed here and still
  // be unguarded in practice.
  //
  // Where a case has a `settle`, the control is on the *delta* it produces, not
  // on the total. Several components animate something on mount already (a
  // state layer springs to its resting colour), so a total-only assertion would
  // go green even if `settle` reached nothing — and `settle` is the whole point
  // for the press- and selection-driven cases.
  describe.each(CASES)('$name', ({ render, settle }) => {
    it('animates when reducedMotion="never" (overrides the OS)', () => {
      renderWithTheme(
        <MotionConfig reducedMotion="never">{render()}</MotionConfig>,
      )

      const onMount = animationCalls()
      settle?.()
      const afterSettle = animationCalls()

      expect(afterSettle).toBeGreaterThan(0)
      if (settle) expect(afterSettle).toBeGreaterThan(onMount)
    })
  })

  function animationCalls() {
    return (
      withSpring.mock.calls.length +
      withTiming.mock.calls.length +
      withDecay.mock.calls.length
    )
  }
})
