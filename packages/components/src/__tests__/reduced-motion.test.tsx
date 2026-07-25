import { MotionConfig } from '@rootnative/inertia'
import { renderWithTheme } from '@rootnative/utils/test'
import { useEffect } from 'react'
import type { ReactElement } from 'react'
import * as Reanimated from 'react-native-reanimated'
import { Checkbox } from '../checkbox'
import { Chip } from '../chip'
import { Dialog } from '../dialog'
import { IconButton } from '../icon-button'
import { LoadingIndicator } from '../loading-indicator'
import { Menu } from '../menu'
import { PortalHost } from '../portal/PortalHost'
import { Radio } from '../radio'
import { Slider } from '../slider'
import { SnackbarProvider, useSnackbar } from '../snackbar'
import { Switch } from '../switch'
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

/**
 * Components whose primary state transition rides a spring. Elements are
 * produced per case rather than held in the array so each `it` mounts a fresh
 * tree.
 */
const CASES: ReadonlyArray<readonly [string, () => ReactElement]> = [
  ['Checkbox', () => <Checkbox value />],
  ['Radio', () => <Radio value />],
  ['Switch', () => <Switch value />],
  ['Chip', () => <Chip selected>Tag</Chip>],
  [
    'IconButton',
    () => <IconButton icon="heart" accessibilityLabel="Like" selected />,
  ],
  ['Slider', () => <Slider defaultValue={0.5} />],
  ['LoadingIndicator', () => <LoadingIndicator accessibilityLabel="Loading" />],
  [
    'Dialog',
    () => (
      <PortalHost>
        <Dialog visible onDismiss={() => {}}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
  ],
  [
    'Dialog (fullscreen)',
    () => (
      <PortalHost>
        <Dialog visible variant="fullscreen" onDismiss={() => {}}>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>
    ),
  ],
  [
    'Snackbar',
    () => (
      <PortalHost>
        <SnackbarProvider>
          <SnackbarOnMount />
        </SnackbarProvider>
      </PortalHost>
    ),
  ],
  [
    'Menu',
    () => (
      <PortalHost>
        <Menu visible anchor={null} onDismiss={() => {}}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>
    ),
  ],
  [
    'Tooltip',
    () => (
      <PortalHost>
        <Tooltip visible anchor={null} onDismiss={() => {}}>
          Save changes
        </Tooltip>
      </PortalHost>
    ),
  ],
  [
    'Tooltip (rich)',
    () => (
      <PortalHost>
        <Tooltip visible variant="rich" anchor={null} onDismiss={() => {}}>
          Save changes
        </Tooltip>
      </PortalHost>
    ),
  ],
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

  describe.each(CASES)('%s', (_name, ui) => {
    it('runs no animation primitive when reducedMotion="always"', () => {
      renderWithTheme(
        <MotionConfig reducedMotion="always">{ui()}</MotionConfig>,
      )

      expect(withSpring).not.toHaveBeenCalled()
      expect(withTiming).not.toHaveBeenCalled()
      expect(withDecay).not.toHaveBeenCalled()
    })
  })

  // Positive control: without the gate the same mounts DO animate, so the
  // assertions above are testing the gate rather than a component that simply
  // never animates on mount.
  it('still animates when reducedMotion="never" (overrides the OS)', () => {
    renderWithTheme(
      <MotionConfig reducedMotion="never">
        <Checkbox value />
      </MotionConfig>,
    )

    expect(withSpring).toHaveBeenCalled()
  })
})
