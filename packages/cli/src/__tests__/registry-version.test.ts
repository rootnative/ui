import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../lib/config'
import { resolveRegistryVersion } from '../lib/registry-version'

/**
 * Before the 1.0 API freeze the registry was read from `main`, so the
 * copy-paste surface had no version: `rootnative add button` returned whatever
 * was on trunk that day. These cover the pin and, more importantly, every way
 * it has to degrade — the CLI must never fail to install because npm was slow
 * or a release tag hadn't landed yet.
 */
describe('resolveRegistryVersion', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function npmOk(version: string) {
    return {
      ok: true,
      json: async () => ({ 'dist-tags': { latest: version } }),
    }
  }

  it('pins to the v-prefixed tag of the latest published core', async () => {
    fetchMock
      .mockResolvedValueOnce(npmOk('1.2.3'))
      .mockResolvedValueOnce({ ok: true })

    await expect(resolveRegistryVersion()).resolves.toBe('v1.2.3')
  })

  it('probes the registry index at that tag, not just the tag', async () => {
    fetchMock
      .mockResolvedValueOnce(npmOk('1.2.3'))
      .mockResolvedValueOnce({ ok: true })

    await resolveRegistryVersion()

    expect(fetchMock.mock.calls[1][0]).toBe(
      `${DEFAULT_CONFIG.registryUrl}/v1.2.3/registry/index.json`,
    )
  })

  it('falls back to main when the tag is published on npm but not pushed yet', async () => {
    // The real release window: release-manual.yml publishes to npm before the
    // v<version> tag lands, so the tag 404s for a while.
    fetchMock
      .mockResolvedValueOnce(npmOk('1.2.3'))
      .mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(resolveRegistryVersion()).resolves.toBe('main')
  })

  it('falls back to main when npm is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ENOTFOUND'))
    await expect(resolveRegistryVersion()).resolves.toBe('main')
  })

  it('falls back to main when npm responds non-ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(resolveRegistryVersion()).resolves.toBe('main')
  })

  it('falls back to main when dist-tags has no latest', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    await expect(resolveRegistryVersion()).resolves.toBe('main')
  })

  it('handles prerelease versions, which is what ships today', async () => {
    fetchMock
      .mockResolvedValueOnce(npmOk('0.0.0-alpha.4'))
      .mockResolvedValueOnce({ ok: true })

    await expect(resolveRegistryVersion()).resolves.toBe('v0.0.0-alpha.4')
  })
})
