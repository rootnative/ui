import { expect, open, test } from './support'

// The entrance of an overlay takes about 300 ms. A scrim press is checked
// after it, when the overlay is at rest.
const ENTRANCE = 400

test.describe('SideSheet', () => {
  test('a button opens it and its action closes it', async ({ page }) => {
    await open(page, 'side-sheet')
    await page.getByRole('button', { name: 'Open filters' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(sheet).toBeHidden()
  })

  test('a click on the scrim closes it', async ({ page }) => {
    await open(page, 'side-sheet')
    await page.getByRole('button', { name: 'Open filters' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet).toBeVisible()
    await page.waitForTimeout(ENTRANCE)
    await page.mouse.click(40, 400)
    await expect(sheet).toBeHidden()
  })

  test('a click on the scrim closes a sheet on the start edge', async ({
    page,
  }) => {
    await open(page, 'side-sheet')
    await page.getByRole('button', { name: 'Open', exact: true }).click()
    const sheet = page.getByRole('dialog', { name: 'Account' })
    await expect(sheet).toBeVisible()
    await page.waitForTimeout(ENTRANCE)
    await page.mouse.click(1240, 400)
    await expect(sheet).toBeHidden()
  })

  test('Escape closes it', async ({ page }) => {
    await open(page, 'side-sheet')
    await page.getByRole('button', { name: 'Open filters' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })
})

test.describe('NavigationDrawer', () => {
  test('an item selects its destination', async ({ page }) => {
    await open(page, 'navigation-drawer')
    await page.getByRole('button', { name: 'Open drawer' }).click()
    const drawer = page.getByRole('dialog', { name: 'Main navigation' })
    await expect(drawer).toBeVisible()
    const outbox = drawer.getByText('Outbox', { exact: true })
    await outbox.click()
    await expect(
      drawer.locator('[aria-selected="true"], [aria-current]'),
    ).toContainText('Outbox')
  })

  test('a click on the scrim closes it', async ({ page }) => {
    await open(page, 'navigation-drawer')
    await page.getByRole('button', { name: 'Open drawer' }).click()
    const drawer = page.getByRole('dialog', { name: 'Main navigation' })
    await expect(drawer).toBeVisible()
    await page.waitForTimeout(ENTRANCE)
    await page.mouse.click(1240, 400)
    await expect(drawer).toBeHidden()
  })

  test('Escape closes it', async ({ page }) => {
    await open(page, 'navigation-drawer')
    await page.getByRole('button', { name: 'Open drawer' }).click()
    const drawer = page.getByRole('dialog', { name: 'Main navigation' })
    await expect(drawer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })
})

test.describe('SearchView', () => {
  test('the bar opens the view and a result runs the search', async ({
    page,
  }) => {
    await open(page, 'search-view')
    await page.getByRole('button', { name: 'Search trails' }).click()
    const view = page.getByTestId('search-view')
    await expect(view).toBeVisible()
    await page.keyboard.type('a')
    await view.getByRole('button').filter({ hasText: /a/i }).first().click()
    await expect(page.getByText(/^Last search: "/)).toBeVisible()
  })

  test('a click outside the docked view closes it', async ({ page }) => {
    await open(page, 'search-view')
    await page.getByRole('button', { name: 'Search trails' }).click()
    const view = page.getByTestId('search-view')
    await expect(view).toBeVisible()
    await page.waitForTimeout(ENTRANCE)
    await page.mouse.click(80, 600)
    await expect(view).toBeHidden()
  })

  test('Escape closes it', async ({ page }) => {
    await open(page, 'search-view')
    await page.getByRole('button', { name: 'Search trails' }).click()
    const view = page.getByTestId('search-view')
    await expect(view).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(view).toBeHidden()
  })
})
