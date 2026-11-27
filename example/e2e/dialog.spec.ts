import { expect, open, test } from './support'

test.describe('Dialog', () => {
  test('a button opens it and an action closes it', async ({ page }) => {
    await open(page, 'dialog')
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click()
    const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await expect(dialog).toBeVisible()
    await expect(page.getByText('Delete file?')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Delete file?')).toBeHidden()
  })

  test('a click on the scrim closes it', async ({ page }) => {
    await open(page, 'dialog')
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click()
    await expect(page.getByText('Delete file?')).toBeVisible()
    await page.waitForTimeout(400)
    await page.mouse.click(20, 400)
    await expect(page.getByText('Delete file?')).toBeHidden()
  })

  test('Escape closes it and gives the focus back', async ({ page }) => {
    await open(page, 'dialog')
    const opener = page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
    await opener.click()
    await expect(page.getByText('Delete file?')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Delete file?')).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('Tab stays inside the open dialog', async ({ page }) => {
    await open(page, 'dialog')
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click()
    await expect(page.getByText('Delete file?')).toBeVisible()
    const cancel = page.getByRole('button', { name: 'Cancel' })
    const remove = page.getByRole('button', { name: 'Delete' })
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('Tab')
      await expect(cancel.or(remove).and(page.locator(':focus'))).toHaveCount(1)
    }
  })

  test('a dialog that is not dismissable needs an action', async ({ page }) => {
    await open(page, 'dialog')
    await page.getByRole('button', { name: 'Open', exact: true }).nth(2).click()
    const title = page.getByText('Accept the terms')
    await expect(title).toBeVisible()
    await page.mouse.click(20, 400)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    await expect(title).toBeVisible()
    await page.getByRole('button', { name: 'Accept' }).click()
    await expect(title).toBeHidden()
  })

  test('a field in a dialog takes input', async ({ page }) => {
    await open(page, 'dialog')
    await page.getByRole('button', { name: 'Open', exact: true }).nth(3).click()
    const field = page.getByRole('textbox', { name: 'Name' })
    await expect(field).toHaveValue('Ada Lovelace')
    await field.fill('Grace Hopper')
    await expect(field).toHaveValue('Grace Hopper')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(field).toBeHidden()
  })

  test('the full-screen dialog covers the window', async ({ page }) => {
    await open(page, 'dialog')
    await page.getByRole('button', { name: 'Open', exact: true }).nth(4).click()
    await expect(page.getByText('Edit profile')).toBeVisible()
    const field = page.getByRole('textbox', { name: 'Display name' })
    await expect(field).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Edit profile')).toBeHidden()
  })
})

test.describe('BottomSheet', () => {
  test('a button opens it at the bottom and an action closes it', async ({
    page,
  }) => {
    await open(page, 'bottom-sheet')
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click()
    const title = page.getByText('Share file')
    await expect(title).toBeVisible()
    await expect
      .poll(async () => (await title.boundingBox())!.y)
      .toBeGreaterThan(300)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(title).toBeHidden()
  })

  test('a click on the scrim closes it', async ({ page }) => {
    await open(page, 'bottom-sheet')
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click()
    await expect(page.getByText('Share file')).toBeInViewport()
    await page.waitForTimeout(400)
    await page.mouse.click(640, 60)
    await expect(page.getByText('Share file')).toBeHidden()
  })

  test('Escape closes it', async ({ page }) => {
    await open(page, 'bottom-sheet')
    await page
      .getByRole('button', { name: 'Open', exact: true })
      .first()
      .click()
    await expect(page.getByText('Share file')).toBeInViewport()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Share file')).toBeHidden()
  })

  test('a sheet that is not dismissable needs an action', async ({ page }) => {
    await open(page, 'bottom-sheet')
    await page.getByRole('button', { name: 'Open', exact: true }).nth(3).click()
    const title = page.getByText('Accept the terms')
    await expect(title).toBeInViewport()
    await page.waitForTimeout(400)
    await page.mouse.click(640, 60)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    await expect(title).toBeInViewport()
    await page.getByRole('button', { name: 'Accept' }).click()
    await expect(title).toBeHidden()
  })
})
