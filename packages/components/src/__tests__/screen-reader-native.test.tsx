/**
 * The two native screen-reader gaps, pinned.
 *
 * Both came out of the static accessibility audit as *predicted* failures with
 * a source-level cause, which is why they are here rather than in a device
 * script: the tree shape proves the first and `useFocusTrap`'s platform guard
 * proves the second. A VoiceOver/TalkBack session would tell us how bad each
 * one sounds, not whether it is real.
 *
 * Each is `it.failing`, following the non-interactive Card shadow bug in
 * `elevation.test.tsx`: the assertion is what *should* hold, so the day either
 * gap is closed the test starts failing as "passed unexpectedly", which is the
 * reminder to drop the marker. A passing test that asserted today's broken
 * behaviour would instead have to be rewritten to fix the bug, and would read
 * as approval of it in the meantime.
 *
 * Neither is fixed here. Both fixes are structural and land separately:
 *
 *   1. **Containment** — the portal *host* has to own the flag (or mark the
 *      content branch `importantForAccessibility="no-hide-descendants"` while
 *      a modal record is mounted). Moving the flag up must not regress Menu,
 *      whose dismiss region is a sibling of its surface and is the only exit —
 *      marking Menu's surface modal was tried and reverted for exactly that.
 *      The Menu test below is the guard for that regression.
 *   2. **Focus return** — `AccessibilityInfo.setAccessibilityFocus` on a
 *      stored trigger node at dismiss. Small, but it needs a device to confirm
 *      the cursor actually lands, so it is not worth guessing at.
 */
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { AccessibilityInfo, Platform, Text, View } from 'react-native'
import { BottomSheet } from '../bottom-sheet'
import { Button } from '../button'
import { Dialog } from '../dialog'
import { Menu } from '../menu'
import { PortalHost } from '../portal'

type Node = {
  props?: Record<string, unknown>
  children?: unknown[]
}

/** Every node in the rendered tree, in tree order. */
function nodes(node: unknown): Node[] {
  if (!node || typeof node !== 'object') return []
  const self = node as Node
  return [self, ...(self.children ?? []).flatMap(nodes)]
}

/**
 * The node carrying `testID`, plus everything under it. `screen.getByTestId`
 * returns a test instance rather than the JSON node, and these assertions are
 * about which *branch* of the tree a prop sits on, so the raw shape is what
 * matters here.
 */
function branch(testID: string): Node[] {
  const match = nodes(screen.toJSON()).find(
    (node) => node.props?.testID === testID,
  )
  if (match === undefined) {
    throw new Error(`no node with testID "${testID}"`)
  }
  return nodes(match)
}

function isHiddenFromScreenReader(node: Node): boolean {
  return (
    node.props?.accessibilityViewIsModal === true ||
    node.props?.importantForAccessibility === 'no-hide-descendants' ||
    node.props?.accessibilityElementsHidden === true ||
    node.props?.['aria-hidden'] === true
  )
}

// Native only. The web surface contains focus through `useFocusTrap`, which is
// tested against a real DOM in `web/`; these two gaps are precisely the ones
// that guard does not cover.
const describeNative = Platform.OS === 'web' ? describe.skip : describe

describeNative('background containment on native (known gap)', () => {
  /**
   * `PortalHost` renders:
   *
   *     RootPortalHost View
   *     ├── {children}          ← app content
   *     └── PortalOutlet View   ← overlay container
   *         └── per-record View
   *             └── surface     ← accessibilityViewIsModal lives HERE
   *
   * `accessibilityViewIsModal` hides the flagged view's *siblings*. The
   * surface's siblings are other portal records — the app content is a sibling
   * of the outlet, one level up and out of reach. Nothing in `portal/*` sets
   * any accessibility prop, so the reader walks straight into the background.
   */
  it.failing(
    'hides the app content behind an open Dialog from the reader',
    () => {
      renderWithTheme(
        <PortalHost>
          <View testID="app-content">
            <Text>Behind the dialog</Text>
          </View>
          <Dialog visible onDismiss={() => {}} testID="dialog">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog>
        </PortalHost>,
      )

      // Either the content branch is hidden outright, or an ancestor of it is.
      expect(branch('app-content').some(isHiddenFromScreenReader)).toBe(true)
    },
  )

  it.failing('hides the app content behind an open modal BottomSheet', () => {
    renderWithTheme(
      <PortalHost>
        <View testID="app-content">
          <Text>Behind the sheet</Text>
        </View>
        <BottomSheet visible onDismiss={() => {}} testID="sheet">
          <Text>Sheet content</Text>
        </BottomSheet>
      </PortalHost>,
    )

    expect(branch('app-content').some(isHiddenFromScreenReader)).toBe(true)
  })

  /**
   * The flag is on the surface today, which is what makes the bug invisible to
   * a props-level assertion: it *is* set, just one level too deep to do
   * anything. Pinning that keeps the eventual fix honest — if the flag moves to
   * the host, this either still holds (belt and braces) or is updated
   * deliberately, rather than the whole mechanism quietly ending up nowhere.
   */
  it('sets the modal flag on the Dialog surface itself', () => {
    renderWithTheme(
      <PortalHost>
        <Dialog visible onDismiss={() => {}} testID="dialog">
          <Dialog.Title>Title</Dialog.Title>
        </Dialog>
      </PortalHost>,
    )

    expect(
      branch('dialog').some(
        (node) => node.props?.accessibilityViewIsModal === true,
      ),
    ).toBe(true)
  })

  /**
   * The standard BottomSheet variant is the control: it passes
   * `accessibilityViewIsModal={false}` deliberately, because the screen behind
   * it stays usable. A containment fix at the host must keep honouring that —
   * a host that hides the background whenever *any* record is mounted would
   * break this one.
   */
  it('leaves the background reachable behind a standard BottomSheet', () => {
    renderWithTheme(
      <PortalHost>
        <View testID="app-content">
          <Text>Behind the sheet</Text>
        </View>
        <BottomSheet
          visible
          variant="standard"
          onDismiss={() => {}}
          testID="sheet"
        >
          <Text>Now playing</Text>
        </BottomSheet>
      </PortalHost>,
    )

    expect(branch('app-content').some(isHiddenFromScreenReader)).toBe(false)
    expect(
      branch('sheet').some(
        (node) => node.props?.accessibilityViewIsModal === true,
      ),
    ).toBe(false)
  })

  /**
   * Menu's exit. Its dismiss region is a *sibling* of the surface, so marking
   * the surface modal removes the only way out — that was tried and reverted,
   * and the reasoning sits in `menu/Menu.tsx`. This is the regression guard for
   * the containment fix above: whatever hides the background must leave the
   * labelled dismiss region reachable.
   */
  it('keeps a labelled dismiss region reachable outside the Menu surface', () => {
    renderWithTheme(
      <PortalHost>
        <Menu anchor={<Button>Open</Button>} visible onDismiss={() => {}}>
          <Menu.Item label="Edit" />
        </Menu>
      </PortalHost>,
    )

    const dismiss = screen.getByLabelText('Close menu')
    expect(dismiss).toBeTruthy()

    // Reachable means not sitting under anything hidden from the reader.
    const hidden = nodes(screen.toJSON()).filter(isHiddenFromScreenReader)
    for (const node of hidden) {
      expect(
        nodes(node).some(
          (descendant) => descendant.props?.accessibilityLabel === 'Close menu',
        ),
      ).toBe(false)
    }
  })
})

describeNative('screen-reader focus return on native (known gap)', () => {
  /**
   * `useFocusTrap` is web-only by construction — every effect early-returns off
   * web, so nothing restores the reader cursor when a surface closes. Its doc
   * comment says native "honours `accessibilityViewIsModal`", which covers
   * *containment* only; there is no native equivalent of the web return path.
   *
   * The fix is `AccessibilityInfo.setAccessibilityFocus` on a stored trigger
   * node at dismiss, so what this pins is the observable precondition: on
   * native, dismissing a Dialog must call it. Today nothing does.
   */
  it.failing(
    'restores reader focus to the trigger when a Dialog closes',
    () => {
      const setAccessibilityFocus = jest.spyOn(
        AccessibilityInfo,
        'setAccessibilityFocus',
      )

      const { rerender } = renderWithTheme(
        <PortalHost>
          <Button testID="trigger">Open</Button>
          <Dialog visible onDismiss={() => {}} testID="dialog">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog>
        </PortalHost>,
      )

      setAccessibilityFocus.mockClear()

      rerender(
        <PortalHost>
          <Button testID="trigger">Open</Button>
          <Dialog visible={false} onDismiss={() => {}} testID="dialog">
            <Dialog.Title>Title</Dialog.Title>
          </Dialog>
        </PortalHost>,
      )

      expect(setAccessibilityFocus).toHaveBeenCalled()
      setAccessibilityFocus.mockRestore()
    },
  )

  it.failing(
    'restores reader focus to the trigger when a modal BottomSheet closes',
    () => {
      const setAccessibilityFocus = jest.spyOn(
        AccessibilityInfo,
        'setAccessibilityFocus',
      )

      const { rerender } = renderWithTheme(
        <PortalHost>
          <Button testID="trigger">Open</Button>
          <BottomSheet visible onDismiss={() => {}} testID="sheet">
            <Text>Sheet content</Text>
          </BottomSheet>
        </PortalHost>,
      )

      setAccessibilityFocus.mockClear()

      rerender(
        <PortalHost>
          <Button testID="trigger">Open</Button>
          <BottomSheet visible={false} onDismiss={() => {}} testID="sheet">
            <Text>Sheet content</Text>
          </BottomSheet>
        </PortalHost>,
      )

      expect(setAccessibilityFocus).toHaveBeenCalled()
      setAccessibilityFocus.mockRestore()
    },
  )
})
