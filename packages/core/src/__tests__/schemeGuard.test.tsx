import { act, render } from '@testing-library/react-native'
import * as React from 'react'
import { THEME_MODE_STORAGE_KEY, ThemeProvider } from '../index'
import type { ThemeModeStorage } from '../index'
import {
  SCHEME_ATTRIBUTE,
  THEME_READY_ATTRIBUTE,
  schemeGuardCss,
  schemeGuardScript,
} from '../static-export'
import { darkTheme } from '../theme/dark'
import { lightTheme } from '../theme/light'

const pair = { light: lightTheme, dark: darkTheme }

interface Browser {
  stored?: Record<string, string>
  storageThrows?: boolean
  prefersDark?: boolean
  noMatchMedia?: boolean
}

/**
 * Runs the script source against a fake `window` and `document`, the way the
 * browser runs it in `<head>`, and returns the attributes it set on `<html>`.
 */
function runScript(source: string, browser: Browser = {}) {
  const attributes: Record<string, string> = {}
  const window = {
    localStorage: {
      getItem(key: string) {
        if (browser.storageThrows) throw new Error('SecurityError')
        return browser.stored?.[key] ?? null
      },
    },
    matchMedia: browser.noMatchMedia
      ? undefined
      : (query: string) => ({
          matches:
            query === '(prefers-color-scheme: dark)' && !!browser.prefersDark,
        }),
  }
  const document = {
    documentElement: {
      setAttribute(name: string, value: string) {
        attributes[name] = value
      },
    },
  }

  new Function('window', 'document', source)(window, document)
  return attributes
}

describe('schemeGuardScript', () => {
  it.each<[string, Browser, string]>([
    ['the OS scheme with nothing stored', { prefersDark: true }, 'dark'],
    ['light with nothing stored on a light OS', {}, 'light'],
    [
      'a stored dark mode on a light OS',
      { stored: { [THEME_MODE_STORAGE_KEY]: 'dark' } },
      'dark',
    ],
    [
      'a stored light mode on a dark OS',
      { stored: { [THEME_MODE_STORAGE_KEY]: 'light' }, prefersDark: true },
      'light',
    ],
    [
      'the OS scheme for a stored system mode',
      { stored: { [THEME_MODE_STORAGE_KEY]: 'system' }, prefersDark: true },
      'dark',
    ],
    [
      'the OS scheme for a stored value that is not a mode',
      { stored: { [THEME_MODE_STORAGE_KEY]: 'blue' }, prefersDark: true },
      'dark',
    ],
    [
      'the OS scheme when storage throws',
      { storageThrows: true, prefersDark: true },
      'dark',
    ],
    ['light with no matchMedia', { noMatchMedia: true }, 'light'],
  ])('sets %s', (_, browser, scheme) => {
    expect(runScript(schemeGuardScript(), browser)).toEqual({
      [SCHEME_ATTRIBUTE]: scheme,
    })
  })

  it('reads a custom storage key', () => {
    const source = schemeGuardScript({ storageKey: 'app.mode' })

    expect(
      runScript(source, { stored: { 'app.mode': 'dark' } })[SCHEME_ATTRIBUTE],
    ).toBe('dark')
    expect(
      runScript(source, { stored: { [THEME_MODE_STORAGE_KEY]: 'dark' } })[
        SCHEME_ATTRIBUTE
      ],
    ).toBe('light')
  })

  it('reads the OS scheme only when storageKey is null', () => {
    const source = schemeGuardScript({ storageKey: null })

    expect(source).not.toContain('localStorage')
    expect(
      runScript(source, { stored: { [THEME_MODE_STORAGE_KEY]: 'dark' } })[
        SCHEME_ATTRIBUTE
      ],
    ).toBe('light')
  })

  it('cannot close its script element through the storage key', () => {
    const source = schemeGuardScript({ storageKey: '</script><b>' })

    expect(source).not.toContain('</script>')
    expect(
      runScript(source, { stored: { '</script><b>': 'dark' } })[
        SCHEME_ATTRIBUTE
      ],
    ).toBe('dark')
  })
})

describe('schemeGuardCss', () => {
  const guarded = `html[${SCHEME_ATTRIBUTE}='dark']:not([${THEME_READY_ATTRIBUTE}])`

  it('hides the app root of a dark reader until the theme is ready', () => {
    const css = schemeGuardCss({ background: '#141218' })

    expect(css).toContain(`${guarded} #root {\n  visibility: hidden;`)
    expect(css).toContain(`${guarded} body {\n  background-color: #141218;`)
  })

  it('shows the page after 8 seconds by default', () => {
    expect(schemeGuardCss({ background: '#000' })).toContain(
      'animation: rootnative-scheme-guard 0s 8000ms forwards;',
    )
  })

  it('takes a root selector and a timeout', () => {
    const css = schemeGuardCss({
      background: '#000',
      rootSelector: '#app',
      timeoutMs: 3000,
    })

    expect(css).toContain(`${guarded} #app {`)
    expect(css).toContain('0s 3000ms forwards')
  })

  it('touches no reader whose scheme is light', () => {
    const css = schemeGuardCss({ background: '#000' })
    const selectors = css.match(/^[^@\s}][^{]*(?=\{)/gm) ?? []

    expect(selectors.length).toBeGreaterThan(0)
    for (const selector of selectors) {
      if (selector.trim() === 'to') continue
      expect(selector).toContain(`[${SCHEME_ATTRIBUTE}='dark']`)
    }
  })
})

describe('the ready stamp of ThemeProvider', () => {
  const g = globalThis as { document?: unknown }
  let stamped: string[]

  beforeEach(() => {
    stamped = []
    g.document = {
      documentElement: {
        setAttribute(name: string) {
          stamped.push(name)
        },
      },
    }
  })

  afterEach(() => {
    delete g.document
  })

  it('stamps <html> after the first render', () => {
    render(<ThemeProvider theme={pair}>{null}</ThemeProvider>)

    expect(stamped).toEqual([THEME_READY_ATTRIBUTE])
  })

  it('stamps a single-theme provider too, so the guard never waits forever', () => {
    render(<ThemeProvider theme={darkTheme}>{null}</ThemeProvider>)

    expect(stamped).toEqual([THEME_READY_ATTRIBUTE])
  })

  it('waits for the stored mode', async () => {
    let resolveRead: (value: string | null) => void = () => {}
    const storage: ThemeModeStorage = {
      getItem: () =>
        new Promise<string | null>((resolve) => {
          resolveRead = resolve
        }),
      setItem: () => {},
    }

    render(
      <ThemeProvider theme={pair} storage={storage}>
        {null}
      </ThemeProvider>,
    )

    expect(stamped).toEqual([])

    await act(async () => {
      resolveRead('dark')
    })

    expect(stamped).toEqual([THEME_READY_ATTRIBUTE])
  })

  it('does nothing with no document', () => {
    delete g.document

    expect(() =>
      render(<ThemeProvider theme={pair}>{null}</ThemeProvider>),
    ).not.toThrow()
  })
})
