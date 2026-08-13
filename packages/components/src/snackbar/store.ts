import type {
  SnackbarDismissReason,
  SnackbarDuration,
  SnackbarId,
  SnackbarOptions,
} from './types'

/** MD3 snackbar durations. */
export const SNACKBAR_SHORT_MS = 4000
export const SNACKBAR_LONG_MS = 10000

/** A queued or visible snackbar with every default already resolved. */
export interface SnackbarEntry extends SnackbarOptions {
  id: SnackbarId
  /** Milliseconds, or `null` for indefinite. */
  durationMs: number | null
}

function resolveDuration(
  duration: SnackbarDuration | undefined,
  hasAction: boolean,
): number | null {
  if (duration === undefined) {
    // MD3: a snackbar carrying an action waits for it rather than timing out.
    return hasAction ? null : SNACKBAR_SHORT_MS
  }
  if (duration === 'short') return SNACKBAR_SHORT_MS
  if (duration === 'long') return SNACKBAR_LONG_MS
  if (duration === 'indefinite') return null
  return duration
}

/**
 * FIFO queue of snackbars with exactly one visible at a time.
 *
 * Kept out of React state for the same reason `PortalStore` is: the provider
 * wraps the whole app, so putting the queue in `useState` there would
 * re-render every screen on each `show()`. Only the host subscribes.
 */
export class SnackbarStore {
  private current: SnackbarEntry | null = null
  private queue: SnackbarEntry[] = []
  private listeners = new Set<() => void>()
  private nextId: SnackbarId = 1
  /**
   * Offsets pushed by mounted `useSnackbarOffset` callers, newest last.
   *
   * A stack rather than a single number because screens overlap during a
   * navigation transition: the outgoing screen unmounts *after* the incoming
   * one mounts, so a single slot would be cleared by the leaver and strand the
   * arriver's offset. Entries are removed by identity, so the order of unmounts
   * does not matter.
   */
  private offsets: { value: number }[] = []
  /**
   * Separate from `listeners` on purpose. The queue and the offset change for
   * unrelated reasons — a `show()` must not wake the offset subscriber, and a
   * screen mounting must not push the queue host through a snapshot compare.
   */
  private offsetListeners = new Set<() => void>()

  show = (options: SnackbarOptions): SnackbarId => {
    const id = this.nextId++
    const entry: SnackbarEntry = {
      ...options,
      id,
      durationMs: resolveDuration(
        options.duration,
        options.actionLabel !== undefined,
      ),
    }

    if (__DEV__ && entry.durationMs === null) {
      const hasWayOut =
        entry.actionLabel !== undefined || entry.showCloseIcon === true
      if (!hasWayOut) {
        console.warn(
          '[@rootnative/components] An indefinite snackbar has no action and ' +
            'no close button, so the user cannot dismiss it and the queue ' +
            'behind it will never drain. Add `actionLabel` or ' +
            '`showCloseIcon`, or give it a duration.',
        )
      }
    }

    if (!this.current) {
      this.current = entry
    } else if (options.replace) {
      this.settle(this.current, 'replaced')
      this.current = entry
    } else {
      this.queue.push(entry)
    }

    this.emit()
    return id
  }

  hide = (id?: SnackbarId, reason: SnackbarDismissReason = 'manual'): void => {
    if (id !== undefined && this.current?.id !== id) {
      // Drop it from the queue before it is ever shown.
      const next = this.queue.filter((entry) => entry.id !== id)
      if (next.length === this.queue.length) return
      const removed = this.queue.find((entry) => entry.id === id)
      this.queue = next
      if (removed) this.settle(removed, reason)
      this.emit()
      return
    }

    if (!this.current) return
    this.settle(this.current, reason)
    this.current = this.queue.shift() ?? null
    this.emit()
  }

  clear = (): void => {
    if (!this.current && this.queue.length === 0) return
    if (this.current) this.settle(this.current, 'manual')
    for (const entry of this.queue) this.settle(entry, 'manual')
    this.current = null
    this.queue = []
    this.emit()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): SnackbarEntry | null => this.current

  /** Test/debug helper — how many snackbars are waiting behind the visible one. */
  getQueueLength = (): number => this.queue.length

  /**
   * Push an offset and get back the function that removes it. Called by
   * `useSnackbarOffset` on mount; the returned function is the effect cleanup.
   */
  pushOffset = (value: number): (() => void) => {
    const entry = { value }
    this.offsets.push(entry)
    this.emitOffset()
    return () => {
      const index = this.offsets.indexOf(entry)
      if (index === -1) return
      this.offsets.splice(index, 1)
      this.emitOffset()
    }
  }

  /**
   * The offset in effect — the largest pushed, or `null` when none is.
   *
   * Largest rather than newest: during a navigation transition two screens are
   * mounted at once, and taking the newest makes the offset flicker with mount
   * order. The largest clears every FAB currently on screen, which is the point
   * of the offset.
   *
   * `null` means "nobody pushed", which the host reads as "use the provider's
   * `bottomOffset` prop" — distinct from a pushed `0`, which deliberately
   * overrides that prop down to zero.
   */
  getOffset = (): number | null => {
    if (this.offsets.length === 0) return null
    let max = this.offsets[0].value
    for (const entry of this.offsets) {
      if (entry.value > max) max = entry.value
    }
    return max
  }

  subscribeOffset = (listener: () => void): (() => void) => {
    this.offsetListeners.add(listener)
    return () => {
      this.offsetListeners.delete(listener)
    }
  }

  private settle(entry: SnackbarEntry, reason: SnackbarDismissReason): void {
    entry.onDismiss?.(reason)
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  private emitOffset(): void {
    for (const listener of this.offsetListeners) listener()
  }
}
