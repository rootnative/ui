/**
 * Static-export hydration, for anything that resolves a breakpoint.
 *
 * A static export renders on a server with no DOM, where react-native-web's
 * `Dimensions` is fixed at `width: 0` — so every breakpoint resolves to
 * `compact` and that is what ships in the HTML. The client knows the real
 * width on its very first render, so a naive hook disagrees with the markup
 * it is hydrating.
 *
 * **React does not repair that.** Measured here against React 19.2.3 by the
 * first test below: the server's `class` attribute is adopted and kept, and
 * `onRecoverableError` never fires. There is no console signal and no crash —
 * a tablet simply keeps the phone layout. That silence is why this file
 * exists rather than a note in the docs.
 *
 * `useBreakpoint` therefore reports `compact` for exactly as long as the
 * client is hydrating, then switches on the re-render React schedules after.
 *
 * This is unobservable in the native project: there is no hydration there at
 * all, so `Grid` renders its measured columns and every assertion passes
 * whether or not the hook is safe.
 */
import { ThemeProvider } from '@rootnative/core'
import { act } from 'react'
import { Text } from 'react-native'
import { Grid } from '../../layout/Grid'

/** jsdom supplies none of what `react-dom/server` needs. */
function loadReactDom() {
  const g = globalThis as Record<string, unknown>
  /* eslint-disable @typescript-eslint/no-require-imports */
  g.MessageChannel = require('node:worker_threads').MessageChannel
  const util = require('node:util')
  g.TextEncoder ??= util.TextEncoder
  g.TextDecoder ??= util.TextDecoder
  g.ReadableStream ??= require('node:stream/web').ReadableStream
  return {
    renderToString: require('react-dom/server').renderToString,
    hydrateRoot: require('react-dom/client').hydrateRoot,
  }
  /* eslint-enable @typescript-eslint/no-require-imports */
}

/** The widest `flexBasis` any cell declares, as a number of percent. */
function cellBasis(host: HTMLElement): string | undefined {
  const cell = host.querySelector<HTMLElement>('div > div > div')
  return cell?.style.flexBasis || undefined
}

it('React 19 keeps a mismatched server attribute and reports nothing', async () => {
  const { renderToString, hydrateRoot } = loadReactDom()
  const Box = ({ wide }: { wide: boolean }) => (
    <div className={wide ? 'cols-2' : 'cols-1'}>content</div>
  )

  const host = document.createElement('div')
  host.innerHTML = renderToString(<Box wide={false} />)
  document.body.appendChild(host)

  const errors: unknown[] = []
  await act(async () => {
    hydrateRoot(host, <Box wide />, {
      onRecoverableError: (e: unknown) => errors.push(e),
    })
  })

  // Both halves matter. If React ever starts repairing this, the premise
  // behind `useBreakpoint`'s hydration handling is gone and this fails first.
  expect((host.firstElementChild as HTMLElement).className).toBe('cols-1')
  expect(errors).toHaveLength(0)
})

/**
 * Move jsdom to a real viewport and tell react-native-web about it.
 *
 * jsdom performs no layout, so `documentElement.clientWidth` is `0` — the
 * same value the export server reports. Without this the client and the
 * "server" agree by accident and the test below passes whether or not the
 * hook is hydration-safe.
 */
function widenViewportTo(width: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  })
  window.dispatchEvent(new Event('resize'))
}

afterEach(() => widenViewportTo(0))

it('Grid hydrates a tablet against compact markup without stranding it', async () => {
  const { renderToString, hydrateRoot } = loadReactDom()
  const ui = (
    <ThemeProvider>
      <Grid columns={{ compact: 1, medium: 2, expanded: 4 }}>
        <Text>A</Text>
        <Text>B</Text>
      </Grid>
    </ThemeProvider>
  )

  // The export server has no DOM, so it measures width 0 → one column.
  widenViewportTo(0)
  const host = document.createElement('div')
  host.innerHTML = renderToString(ui)
  document.body.appendChild(host)
  expect(cellBasis(host)).toBe('100%')

  // The visitor is on a 1280px screen — `expanded`, four columns.
  widenViewportTo(1280)

  const errors: unknown[] = []
  await act(async () => {
    hydrateRoot(host, ui, {
      onRecoverableError: (e: unknown) => errors.push(e),
    })
  })

  // Hydration reproduced the compact markup, so nothing mismatched, and the
  // re-render React schedules afterwards moved it to the measured breakpoint.
  // Without the gate the client renders 25% against 100% markup, React keeps
  // the server value (test one above), and the tablet is stuck at one column.
  expect(errors).toHaveLength(0)
  expect(cellBasis(host)).toBe('25%')
})
