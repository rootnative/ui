import { expect, test as base, type Locator, type Page } from '@playwright/test'

/**
 * `page` fails its test on an uncaught exception or a `console.error`, the
 * same rule as the browser pass of `check-export.mjs`.
 */
export const test = base.extend({
  page: async ({ page }, run) => {
    const problems: string[] = []
    page.on('pageerror', (error) =>
      problems.push(`exception: ${error.message}`),
    )
    page.on('console', (message) => {
      if (message.type() === 'error') {
        problems.push(`console.error: ${message.text()}`)
      }
    })
    // The intro of each screen has a button that opens the docs in a new tab.
    await page.addInitScript(() => {
      window.open = () => null
    })
    await run(page)
    expect(problems, 'the page logged a problem').toEqual([])
  },
})

export { expect }

/**
 * Opens a route of the export and waits for hydration. A press before
 * hydration reaches no handler, so each test starts from here.
 */
export async function open(
  page: Page,
  route: string,
  options: { rtl?: boolean } = {},
) {
  if (options.rtl) {
    await page.addInitScript(() => localStorage.setItem('forceRTL', 'true'))
  }
  await page.goto(route === '/' ? './' : `./${route}`)
  // Expo Router hydrates the screen after the layout, so read the last
  // element of the screen, not the header.
  await page.waitForFunction(() => {
    const nodes = document.querySelectorAll('main *')
    const last = nodes[nodes.length - 1]
    return (
      last !== undefined &&
      Object.keys(last).some((key) => key.startsWith('__reactProps$'))
    )
  })
  // Effects run after the hydration commit. Two frames let them attach. A
  // late font moves the layout, and some tests press at a measured point.
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
  })
  if (options.rtl) {
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  }
}

/** Focuses a control the way a keyboard user reaches it, then sends a key. */
export async function pressKeyOn(control: Locator, key: string) {
  await control.focus()
  await expect(control).toBeFocused()
  await control.page().keyboard.press(key)
}

export async function box(locator: Locator) {
  const rect = await locator.boundingBox()
  if (rect === null) throw new Error('The element has no box.')
  return rect
}

/**
 * The web runtime of the export. A few APIs differ by design: `Alert.alert`
 * opens a dialog on `@rootnative/web` and does nothing on react-native-web.
 */
export async function runtime(page: Page) {
  const usesRootNative = await page.evaluate(
    () => document.querySelector('[class~="rn-view"]') !== null,
  )
  return usesRootNative ? 'rootnative' : 'react-native-web'
}

/**
 * After a press that calls `Alert.alert(title)`: the dialog shows the title
 * and its button closes it, on the runtime that has a dialog.
 */
export async function expectAlert(page: Page, title: string) {
  if ((await runtime(page)) !== 'rootnative') return
  const alert = page.getByRole('alertdialog')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(title)
  await alert.getByRole('button').last().click()
  await expect(alert).toBeHidden()
}
