import { expect, open, pressKeyOn, test } from './support'

test.describe('NavigationBar', () => {
  test('a click selects a destination', async ({ page }) => {
    await open(page, 'navigation-bar')
    const bar = page.getByRole('tablist', { name: 'Main navigation' })
    const home = bar.getByRole('tab', { name: 'Home' })
    const library = bar.getByRole('tab', { name: 'Library' })
    await expect(home).toHaveAttribute('aria-selected', 'true')
    await library.click()
    await expect(library).toHaveAttribute('aria-selected', 'true')
    await expect(home).toHaveAttribute('aria-selected', 'false')
  })

  test('Space selects the focused destination', async ({ page }) => {
    await open(page, 'navigation-bar')
    const bar = page.getByRole('tablist', { name: 'Main navigation' })
    const profile = bar.getByRole('tab', { name: 'Profile' })
    await pressKeyOn(profile, 'Space')
    await expect(profile).toHaveAttribute('aria-selected', 'true')
  })

  test('a disabled destination stays unselected', async ({ page }) => {
    await open(page, 'navigation-bar')
    const bar = page.getByRole('tablist', { name: 'Disabled and overrides' })
    const library = bar.getByRole('tab', { name: 'Library' })
    await library.click({ force: true })
    await expect(library).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('NavigationRail', () => {
  test('a click selects a destination', async ({ page }) => {
    await open(page, 'navigation-rail')
    const library = page.getByRole('tab', { name: 'Library' }).first()
    await expect(library).toHaveAttribute('aria-selected', 'false')
    await library.click()
    await expect(library).toHaveAttribute('aria-selected', 'true')
  })

  test('the header buttons take a press', async ({ page }) => {
    await open(page, 'navigation-rail')
    await page.getByRole('button', { name: 'Open menu' }).first().click()
    await page.getByRole('button', { name: 'Compose' }).first().click()
  })
})

test.describe('BottomAppBar', () => {
  test('an action reports its press', async ({ page }) => {
    await open(page, 'bottom-app-bar')
    await expect(page.getByText('Nothing pressed yet.')).toBeVisible()
    await page.getByRole('button', { name: 'Archive' }).first().click()
    await expect(page.getByText('Archive pressed.')).toBeVisible()
    await page.getByRole('button', { name: 'Compose' }).first().click()
    await expect(page.getByText('Compose pressed.')).toBeVisible()
  })

  test('a menu in the bar opens and its item reports', async ({ page }) => {
    await open(page, 'bottom-app-bar')
    await page.getByRole('button', { name: 'More', exact: true }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Help' })).toBeInViewport({
      ratio: 1,
    })
    await page.getByRole('menuitem', { name: 'Help' }).click()
    await expect(menu).toBeHidden()
    await expect(page.getByText('Help pressed.')).toBeVisible()
  })

  test('a disabled action ignores a click', async ({ page }) => {
    await open(page, 'bottom-app-bar')
    await page.getByRole('button', { name: 'Delete' }).last().click({
      force: true,
    })
    await expect(page.getByText('Nothing pressed yet.')).toBeVisible()
  })
})

test.describe('AppBar', () => {
  test('a large bar collapses when its content scrolls', async ({ page }) => {
    await open(page, 'appbar')
    const title = page.getByRole('heading', { name: 'Large App Bar' }).last()
    await title.scrollIntoViewIfNeeded()
    const before = (await title.boundingBox())!
    await page.mouse.move(
      before.x + before.width / 2,
      before.y + before.height + 80,
    )
    await page.mouse.wheel(0, 400)
    await expect
      .poll(async () => (await title.boundingBox())?.height ?? 0)
      .toBeLessThan(before.height)
  })
})
