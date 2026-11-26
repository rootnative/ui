import { box, expect, open, test } from './support'

test.describe('Menu', () => {
  test('the anchor opens the menu and an item closes it', async ({ page }) => {
    await open(page, 'menu')
    const anchor = page.getByRole('button', { name: 'More actions' })
    await anchor.click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(anchor).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('menuitem', { name: 'Duplicate' }).click()
    await expect(menu).toBeHidden()
    await expect(page.getByText('Last action: Duplicate')).toBeVisible()
    await expect(anchor).toHaveAttribute('aria-expanded', 'false')
  })

  test('the menu opens next to its anchor', async ({ page }) => {
    await open(page, 'menu')
    const anchor = page.getByRole('button', { name: 'More actions' })
    await anchor.click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeInViewport({
      ratio: 1,
    })
    const anchorBox = await box(anchor)
    const menuBox = await box(menu)
    expect(Math.abs(menuBox.y - (anchorBox.y + anchorBox.height))).toBeLessThan(
      16,
    )
    // This menu aligns its end edge with the end edge of the anchor.
    const anchorEnd = anchorBox.x + anchorBox.width
    const menuEnd = menuBox.x + menuBox.width
    expect(Math.abs(menuEnd - anchorEnd)).toBeLessThan(2)
  })

  test('Escape closes the menu and gives the focus back', async ({ page }) => {
    await open(page, 'menu')
    const anchor = page.getByRole('button', { name: 'More actions' })
    await anchor.click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(anchor).toBeFocused()
  })

  test('a click outside closes the menu', async ({ page }) => {
    await open(page, 'menu')
    await page.getByRole('button', { name: 'More actions' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.mouse.click(900, 700)
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(page.getByText('Last action: nothing yet')).toBeVisible()
  })

  test('the keyboard opens the menu and picks an item', async ({ page }) => {
    await open(page, 'menu')
    const anchor = page.getByRole('button', { name: 'More actions' })
    await anchor.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(
      page.getByRole('menuitem', { name: 'Duplicate' }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(page.getByText('Last action: Duplicate')).toBeVisible()
  })

  test('a controlled menu stays open until Done', async ({ page }) => {
    await open(page, 'menu')
    await page.getByRole('button', { name: 'Sort: Name' }).first().click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await page.getByRole('menuitemradio', { name: 'Date' }).click()
    await expect(menu).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Sort: Date' }).first(),
    ).toBeAttached()
    await page.getByRole('menuitem', { name: 'Done' }).click()
    await expect(menu).toBeHidden()
  })

  test('in RTL the menu stays next to its anchor', async ({ page }) => {
    await open(page, 'menu', { rtl: true })
    const anchor = page.getByRole('button', { name: 'More actions' })
    await anchor.click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeInViewport({
      ratio: 1,
    })
    const anchorBox = await box(anchor)
    const menuBox = await box(menu)
    // In RTL the end edge is the left edge.
    expect(Math.abs(menuBox.x - anchorBox.x)).toBeLessThan(2)
    expect(Math.abs(menuBox.y - (anchorBox.y + anchorBox.height))).toBeLessThan(
      16,
    )
  })
})
