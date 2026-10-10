import { useSyncExternalStore } from 'react'

type Modality = 'keyboard' | 'pointer'

// Web starts in keyboard modality, as inertia's tracker and the W3C polyfill
// do, so a focus that a script moves before any user input still shows a
// ring. The components remove the browser's own focus outline, so without
// this a slider focused that way would show no indicator at all.
let currentModality: Modality =
  typeof document !== 'undefined' ? 'keyboard' : 'pointer'
const subscribers = new Set<() => void>()

function setModality(next: Modality) {
  if (currentModality !== next) {
    currentModality = next
    subscribers.forEach((fn) => fn())
  }
}

// Set up global modality listeners on web only. On native, modality stays
// 'pointer' so focus state never fires (touch users don't expect a focus ring).
// Hardware-keyboard users on native still get the rest of accessibility (the
// `accessibilityState` is set correctly); only the visual focus indicator is
// suppressed.
if (
  typeof document !== 'undefined' &&
  typeof window !== 'undefined' &&
  typeof document.addEventListener === 'function'
) {
  const onKeyDown = (e: KeyboardEvent) => {
    // Modifier-only keys shouldn't switch modality; they're often used with
    // mouse interactions.
    if (e.metaKey || e.ctrlKey || e.altKey) return
    setModality('keyboard')
  }
  const onPointerDown = () => setModality('pointer')

  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('mousedown', onPointerDown, true)
  document.addEventListener('touchstart', onPointerDown, true)
}

interface MatchableTarget {
  matches(selector: string): boolean
}

function isMatchable(target: unknown): target is MatchableTarget {
  return (
    typeof target === 'object' &&
    target !== null &&
    typeof (target as { matches?: unknown }).matches === 'function'
  )
}

// The same rule as inertia's tracker, so a Slider ring and a state-layer
// ring agree: the browser's `:focus-visible` decides for a focused target.
function browserFocusVisible(event: unknown): boolean | undefined {
  if (typeof document === 'undefined') return undefined
  const target = (event as { target?: unknown } | null | undefined)?.target
  if (!isMatchable(target)) return undefined
  try {
    // A dispatched focus event moves no focus, and the browser then answers
    // `false` whatever the input was. Only a focused target gets its answer.
    if (!target.matches(':focus')) return undefined
    return target.matches(':focus-visible')
  } catch {
    // A browser without `:focus-visible` throws a SyntaxError.
    return undefined
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

function getSnapshot() {
  return currentModality === 'keyboard'
}

// The server has no `document`, so it renders in pointer modality. Hydration
// must read the same value, or a render that depends on the modality would
// not match the server HTML.
function getServerSnapshot() {
  return false
}

/**
 * Reactive focus-visible state — re-renders the calling component whenever
 * the user's input modality flips between keyboard and pointer. Mirrors the
 * CSS `:focus-visible` semantics for React Native.
 *
 * Backed by `useSyncExternalStore` so the initial snapshot and the subscribed
 * snapshot are always in sync (no first-render race when modality changes
 * between render and effect).
 *
 * Prefer `isFocusVisible()` inside event handlers — it returns the same
 * boolean without subscribing the calling component to re-renders. Use this
 * hook only when render output itself depends on the modality (e.g. a focus
 * ring rendered conditionally without a separate handler).
 */
export function useFocusVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Imperative read of focus-visible state. Designed for use inside event
 * handlers (`onFocus`, `onBlur`, etc.) where you want the boolean value
 * without subscribing the component to re-renders.
 *
 * Pass the focus event. On web, when its target holds focus, the browser's
 * `:focus-visible` decides, so the ring shows wherever the browser would
 * draw its own outline. Otherwise the function returns `true` when the
 * user's most recent input was a keyboard event: for a call with no event,
 * a dispatched focus event, a browser without `:focus-visible`, and native.
 *
 * If the rendered output itself depends on the modality, use the reactive
 * `useFocusVisible()` hook instead. It reads the modality only.
 */
export function isFocusVisible(event?: unknown): boolean {
  return browserFocusVisible(event) ?? currentModality === 'keyboard'
}
