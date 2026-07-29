import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

/**
 * Keyboard focus containment for portal-rendered surfaces (Dialog, Menu,
 * modal BottomSheet).
 *
 * Web only, and deliberately so. A portal surface is appended to the host at
 * the end of the tree, so on web the browser's tab order walks straight past
 * it into the content behind — `aria-modal` is a hint to assistive technology,
 * not a focus boundary. Native has no tab order to contain: iOS and Android
 * honour `accessibilityViewIsModal` and take the screen reader out of the
 * background themselves, so on those platforms every effect here returns
 * early and the hook costs one state slot that never changes.
 *
 * Three behaviours, all of which a modal surface is expected to have:
 *
 *   - **Entry.** Focus moves into the surface when it opens — the first
 *     focusable descendant, or the surface itself when it has none.
 *   - **Containment.** Tab and Shift-Tab cycle within the surface instead of
 *     escaping it. With `arrowNavigation`, Arrow Down/Up move between the same
 *     elements, which is what `role="menu"` expects.
 *   - **Return.** Focus goes back to whatever held it before the surface
 *     opened, so dismissing a dialog does not dump the user at the top of the
 *     document.
 */

/**
 * What react-native-web actually renders as focusable. `Pressable` becomes a
 * `div` carrying `tabindex="0"` rather than a `<button>`, so the tabindex
 * clause — not the element-name clauses — is what matches most of the library.
 *
 * The exclusions are declarative on purpose. Filtering on measured size
 * (`offsetWidth`) would read as more thorough and be strictly worse: jsdom
 * reports every element as 0×0, so the trap would silently find nothing under
 * test while working in a browser. Anything the library hides is unmounted by
 * `<Presence>` rather than sized to zero, so there is nothing for a size check
 * to catch here anyway.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
]
  .map(
    (selector) =>
      // RNW keeps a disabled Pressable in the tab order, so `aria-disabled`
      // has to be filtered here rather than trusted to the browser.
      `${selector}:not([aria-disabled="true"]):not([aria-hidden="true"]):not([hidden])`,
  )
  .join(',')

/**
 * Only the topmost trap reacts to keys. Without this, a Menu opened from
 * inside a Dialog would have both surfaces trying to contain the same Tab
 * press, and the Dialog — mounted first, so listening first — would win.
 */
const stack: object[] = []

function focusableWithin(surface: HTMLElement): HTMLElement[] {
  return Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

export interface FocusTrapOptions {
  /** Whether the surface is open. Entry runs once the surface has mounted. */
  active: boolean
  /**
   * Called on Escape. Omit for a surface that should not be keyboard
   * dismissable (a non-dismissable Dialog).
   */
  onEscape?: () => void
  /**
   * Move focus between focusable descendants with Arrow Down/Up as well as
   * Tab. Correct for `role="menu"`; wrong for a dialog, where arrow keys
   * belong to whatever control has focus.
   */
  arrowNavigation?: boolean
}

/**
 * Returns the ref to attach to the surface being trapped — the element that
 * carries `role="dialog"` / `role="menu"`, not the full-screen layer around
 * it, so the layer's own scrim or dismiss region stays outside the trap.
 */
export function useFocusTrap({
  active,
  onEscape,
  arrowNavigation = false,
}: FocusTrapOptions) {
  // The node is tracked in state, not a ref, because these surfaces render
  // through `Portal` — the host mounts them in a later commit, so an effect
  // keyed only on `active` would run against a ref that is still null and
  // never re-run. State makes the node's arrival the trigger.
  const [surface, setSurface] = useState<HTMLElement | null>(null)

  // Typed `unknown` so one callback can be the `ref` of a plain `View`, a
  // `Motion.View` and a reanimated `Animated.View` alike. On
  // react-native-web each of them hands back the host DOM node; RN's types
  // can't say that, hence the cast.
  const surfaceRef = useCallback((node: unknown) => {
    if (Platform.OS !== 'web') return
    setSurface((node as HTMLElement | null) ?? null)
  }, [])

  // Read inside the listener rather than captured, so re-registering on every
  // `onEscape` identity change isn't necessary.
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  // Entry and return. One effect, because the element to return focus to is
  // whatever was active at entry time and nothing else may overwrite it.
  useEffect(() => {
    if (Platform.OS !== 'web' || !active || surface === null) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const [first] = focusableWithin(surface)
    if (first !== undefined) {
      first.focus()
    } else {
      // A surface with nothing focusable inside still has to take focus, or
      // the screen reader stays parked on the trigger behind it.
      surface.setAttribute('tabindex', '-1')
      surface.focus()
    }

    return () => {
      // Skip a stale restore: if focus has already moved somewhere outside the
      // surface (the user clicked another control while it was closing),
      // yanking it back would be the more surprising behaviour.
      const stillInside =
        document.activeElement === surface ||
        (document.activeElement !== null &&
          surface.contains(document.activeElement))
      if (
        stillInside &&
        previouslyFocused !== null &&
        document.body.contains(previouslyFocused)
      ) {
        previouslyFocused.focus()
      }
    }
  }, [active, surface])

  // Containment. Split from entry so a changing `arrowNavigation` re-binds the
  // listener without re-running entry focus.
  useEffect(() => {
    if (Platform.OS !== 'web' || !active || surface === null) return

    const token = {}
    stack.push(token)

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return

      if (event.key === 'Escape') {
        const handler = onEscapeRef.current
        if (handler !== undefined) {
          event.preventDefault()
          // The topmost surface owns Escape while it is open. Stopping here
          // also keeps React's own root listener from seeing the key, so a
          // component that handles Escape itself (BottomSheet's drag handle)
          // doesn't dismiss twice.
          event.stopPropagation()
          handler()
        }
        return
      }

      const isTab = event.key === 'Tab'
      const isArrow =
        arrowNavigation &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      if (!isTab && !isArrow) return

      const focusable = focusableWithin(surface)
      if (focusable.length === 0) {
        // Nothing to move to, but the press must not reach the background.
        event.preventDefault()
        return
      }

      const backwards = isTab ? event.shiftKey : event.key === 'ArrowUp'
      const activeElement = document.activeElement as HTMLElement | null
      const index =
        activeElement === null ? -1 : focusable.indexOf(activeElement)

      // -1 covers both "focus is on the surface itself" and "focus escaped
      // while the surface was open": either way, re-enter at the edge.
      const next =
        index === -1
          ? backwards
            ? focusable[focusable.length - 1]
            : focusable[0]
          : focusable[
              (index + (backwards ? -1 : 1) + focusable.length) %
                focusable.length
            ]

      event.preventDefault()
      next.focus()
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      stack.splice(stack.indexOf(token), 1)
    }
  }, [active, surface, arrowNavigation])

  return surfaceRef
}
