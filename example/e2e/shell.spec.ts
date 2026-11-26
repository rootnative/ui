import { box, expect, open, test } from './support'

test.describe('App shell', () => {
  test('a card on the home page opens its screen', async ({ page }) => {
    await open(page, '/')
    await page.getByRole('button', { name: /^Typography/ }).click()
    await expect(page).toHaveURL(/\/ui\/demo\/typography$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Typography',
    )
  })

  test('the footer goes to the next screen and Back returns', async ({
    page,
  }) => {
    await open(page, 'button')
    await page.getByRole('button', { name: 'Next: ButtonGroup' }).click()
    await expect(page).toHaveURL(/\/button-group$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'ButtonGroup',
    )
    await page.goBack()
    await expect(page).toHaveURL(/\/button$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')
  })

  test('the theme button changes the colors', async ({ page }) => {
    await open(page, 'button')
    const background = () =>
      page
        .getByRole('banner')
        .evaluate((node) => getComputedStyle(node).backgroundColor)
    const light = await background()
    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(
      page.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeVisible()
    await expect.poll(background).not.toBe(light)
  })

  test('the RTL button mirrors the layout', async ({ page }) => {
    await open(page, 'button')
    const back = page.getByRole('button', { name: 'Go back' })
    expect((await box(back)).x).toBeLessThan(640)
    // The button stores the direction and reloads the page.
    await page.getByRole('button', { name: 'Switch to RTL layout' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect.poll(async () => (await box(back)).x).toBeGreaterThan(640)
    await expect(
      page.getByRole('button', { name: 'Switch to LTR layout' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')
  })

  test('the jump menu goes to a component', async ({ page }) => {
    await open(page, 'button')
    await page.getByRole('button', { name: 'Jump to a component' }).click()
    await page.getByRole('menuitem', { name: 'Slider' }).click()
    await expect(page).toHaveURL(/\/slider$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slider')
  })
})
