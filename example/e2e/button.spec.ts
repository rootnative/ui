import { expect, open, pressKeyOn, test } from './support'

test.describe('Button', () => {
  test('a click toggles a toggle button', async ({ page }) => {
    await open(page, 'button')
    const toggle = page.getByRole('button', { name: 'filled', exact: true })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  for (const key of ['Enter', 'Space']) {
    test(`${key} presses the focused button one time`, async ({ page }) => {
      await open(page, 'button')
      const toggle = page.getByRole('button', { name: 'tonal', exact: true })
      await pressKeyOn(toggle, key)
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      await pressKeyOn(toggle, key)
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    })
  }

  test('a disabled button ignores a click', async ({ page }) => {
    await open(page, 'button')
    const toggle = page.getByRole('button', { name: 'filled disabled' })
    await toggle.click({ force: true })
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  test('a loading button is busy until the work ends', async ({ page }) => {
    await open(page, 'button')
    const button = page.getByRole('button', { name: 'filled button' }).nth(2)
    await button.click()
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button).not.toHaveAttribute('aria-busy', 'true', {
      timeout: 5000,
    })
  })

  test('Tab reaches the buttons in order and skips a disabled one', async ({
    page,
  }) => {
    await open(page, 'button')
    const last = page.getByRole('button', { name: 'text button' }).first()
    await last.focus()
    await page.keyboard.press('Tab')
    // The five disabled buttons come next in the DOM.
    await expect(
      page.getByRole('button', { name: 'filled button' }).nth(2),
    ).toBeFocused()
  })
})

test.describe('Chip', () => {
  test('a click selects and clears a filter chip', async ({ page }) => {
    await open(page, 'chip')
    const chip = page.getByRole('button', { name: 'Popular', exact: true })
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('button', { name: 'Remove Popular' }),
    ).toBeVisible()
  })

  test('the close icon clears the chip and does not press it', async ({
    page,
  }) => {
    await open(page, 'chip')
    const chip = page.getByRole('button', { name: 'Recent', exact: true })
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Remove Recent' }).click()
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByRole('button', { name: 'Remove Recent' }),
    ).toHaveCount(0)
  })
})
