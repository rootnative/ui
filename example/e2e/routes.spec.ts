import { expect, open, test } from './support'

const ROUTES = [
  '/',
  'appbar',
  'avatar',
  'badge',
  'bottom-app-bar',
  'bottom-sheet',
  'button',
  'button-group',
  'card',
  'carousel',
  'checkbox',
  'chip',
  'dialog',
  'divider',
  'fab',
  'i18n',
  'de/i18n',
  'icon',
  'icon-button',
  'keyboard-avoiding-wrapper',
  'layout',
  'list',
  'loading-indicator',
  'menu',
  'navigation-bar',
  'navigation-drawer',
  'navigation-rail',
  'portal',
  'progress',
  'radio',
  'rtl',
  'search-bar',
  'search-view',
  'showcase',
  'showcase/media-card',
  'showcase/settings-screen',
  'showcase/sign-in-form',
  'side-sheet',
  'skeleton',
  'slider',
  'snackbar',
  'switch',
  'tabs',
  'text-field',
  'tooltip',
  'typography',
]

const VARIANTS = [
  { name: 'LTR', rtl: false, width: 1280 },
  { name: 'RTL', rtl: true, width: 1280 },
  { name: 'LTR on a phone', rtl: false, width: 390 },
  { name: 'RTL on a phone', rtl: true, width: 390 },
]

for (const variant of VARIANTS) {
  test.describe(`Each route, ${variant.name}`, () => {
    test.use({ viewport: { width: variant.width, height: 800 } })

    for (const route of ROUTES) {
      test(`${route} renders and fits the window`, async ({ page }) => {
        await open(page, route, { rtl: variant.rtl })
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const overflow = await page.evaluate(() => {
          const root = document.documentElement
          return root.scrollWidth - root.clientWidth
        })
        expect(overflow, 'the page scrolls sideways').toBeLessThanOrEqual(1)
        // An icon font that did not load draws each icon as an empty box.
        const fontsFailed = await page.evaluate(
          () =>
            [...document.fonts].filter((font) => font.status === 'error')
              .length,
        )
        expect(fontsFailed, 'a font failed to load').toBe(0)
      })
    }
  })
}
