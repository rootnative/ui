import type { ReactNode } from 'react'
import { DEFAULT_PORTAL_HOST } from './layers'

export interface PortalRecord {
  id: string
  node: ReactNode
  priority: number
  /** Monotonic mount counter — breaks `priority` ties by mount order. */
  seq: number
}

interface TargetedRecord extends PortalRecord {
  hostName: string
}

const EMPTY: PortalRecord[] = []

function sameRecords(a: PortalRecord[], b: PortalRecord[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Holds every mounted `Portal` for one root `PortalHost` and slices them into
 * per-host buckets that outlets subscribe to individually.
 *
 * Keeping the entries out of React state is what stops an overlay opening or
 * closing from re-rendering the whole app tree under the host — only the
 * outlet whose bucket actually changed is notified.
 */
export class PortalStore {
  private records = new Map<string, TargetedRecord>()
  private hosts = new Set<string>([DEFAULT_PORTAL_HOST])
  private buckets = new Map<string, PortalRecord[]>()
  private listeners = new Map<string, Set<() => void>>()
  private seq = 0

  registerHost = (name: string): void => {
    if (this.hosts.has(name)) return
    this.hosts.add(name)
    this.rebuild()
  }

  unregisterHost = (name: string): void => {
    if (name === DEFAULT_PORTAL_HOST) return
    if (!this.hosts.delete(name)) return
    this.rebuild()
  }

  set = (
    id: string,
    node: ReactNode,
    hostName: string,
    priority: number,
  ): void => {
    const existing = this.records.get(id)
    if (
      existing &&
      existing.node === node &&
      existing.hostName === hostName &&
      existing.priority === priority
    ) {
      return
    }

    this.records.set(id, {
      id,
      node,
      hostName,
      priority,
      seq: existing ? existing.seq : this.seq++,
    })
    this.rebuild()
  }

  remove = (id: string): void => {
    if (!this.records.delete(id)) return
    this.rebuild()
  }

  subscribe = (hostName: string, listener: () => void): (() => void) => {
    let bucket = this.listeners.get(hostName)
    if (!bucket) {
      bucket = new Set()
      this.listeners.set(hostName, bucket)
    }
    bucket.add(listener)

    return () => {
      bucket.delete(listener)
      if (bucket.size === 0) this.listeners.delete(hostName)
    }
  }

  getSnapshot = (hostName: string): PortalRecord[] =>
    this.buckets.get(hostName) ?? EMPTY

  /** Test/debug helper — whether a named host is currently mounted. */
  hasHost = (name: string): boolean => this.hosts.has(name)

  private rebuild(): void {
    const next = new Map<string, PortalRecord[]>()

    for (const record of this.records.values()) {
      // A portal aimed at a host that isn't mounted falls back to the default
      // host rather than disappearing. It moves on its own if that host mounts
      // later.
      const target = this.hosts.has(record.hostName)
        ? record.hostName
        : DEFAULT_PORTAL_HOST
      const bucket = next.get(target)
      if (bucket) bucket.push(record)
      else next.set(target, [record])
    }

    for (const bucket of next.values()) {
      bucket.sort((a, b) => a.priority - b.priority || a.seq - b.seq)
    }

    const touched = new Set([...this.buckets.keys(), ...next.keys()])
    const changed: string[] = []

    for (const name of touched) {
      const prev = this.buckets.get(name) ?? EMPTY
      const curr = next.get(name) ?? EMPTY
      if (sameRecords(prev, curr)) {
        // Preserve array identity so `useSyncExternalStore` sees no change.
        if (curr !== EMPTY) next.set(name, prev)
      } else {
        changed.push(name)
      }
    }

    this.buckets = next

    for (const name of changed) {
      const bucket = this.listeners.get(name)
      if (!bucket) continue
      for (const listener of bucket) listener()
    }
  }
}
