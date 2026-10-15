/**
 * Which routes have a `PageHead` on screen. `RouteHead` renders the defaults
 * for a route only when nothing claims it.
 *
 * A claim is made during render, not in an effect, because the static export
 * runs no effect: a `RouteHead` placed after the navigator must see the claim
 * of the screen in the same render pass. Listeners are told in an effect, so
 * a claim never updates another component during render.
 */
export type ClaimStore = {
  has: (pathname: string) => boolean
  claim: (pathname: string) => void
  release: (pathname: string) => void
  subscribe: (listener: () => void) => () => void
  /** Tells every listener. Call it from an effect. */
  notify: () => void
}

export function createClaimStore(): ClaimStore {
  const counts = new Map<string, number>()
  const listeners = new Set<() => void>()
  return {
    has: (pathname) => (counts.get(pathname) ?? 0) > 0,
    claim: (pathname) => {
      counts.set(pathname, (counts.get(pathname) ?? 0) + 1)
    },
    release: (pathname) => {
      const next = (counts.get(pathname) ?? 0) - 1
      if (next > 0) counts.set(pathname, next)
      else counts.delete(pathname)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    notify: () => {
      for (const listener of listeners) listener()
    },
  }
}

const NO_CLAIMS: ClaimStore = {
  has: () => false,
  claim: () => {},
  release: () => {},
  subscribe: () => () => {},
  notify: () => {},
}

/** The store to use when there is no provider: nothing is ever claimed. */
export function noClaims(): ClaimStore {
  return NO_CLAIMS
}
