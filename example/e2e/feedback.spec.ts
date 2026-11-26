import { expect, open, test } from './support'

test.describe('Snackbar', () => {
  test('it shows a message and times out', async ({ page }) => {
    await open(page, 'snackbar')
    await page.getByRole('button', { name: 'Show', exact: true }).nth(0).click()
    const message = page.getByText('Photo saved')
    await expect(message).toBeVisible()
    await expect(message).toBeInViewport()
    await expect(message).toBeHidden({ timeout: 8000 })
  })

  test('the action reports back and closes it', async ({ page }) => {
    await open(page, 'snackbar')
    await page.getByRole('button', { name: 'Show', exact: true }).nth(1).click()
    await expect(page.getByText('Message deleted')).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Message deleted')).toBeHidden()
    await expect(
      page.getByText(/Last dismissal: (undo pressed|action)/),
    ).toBeVisible()
  })

  test('the close icon closes a message that stays', async ({ page }) => {
    await open(page, 'snackbar')
    await page.getByRole('button', { name: 'Show', exact: true }).nth(2).click()
    const message = page.getByText('Sync paused while offline')
    await expect(message).toBeVisible()
    await page.waitForTimeout(5000)
    await expect(message).toBeVisible()
    await page.getByRole('button', { name: /close|dismiss/i }).click()
    await expect(message).toBeHidden()
  })

  test('a queue shows one message at a time, and Clear empties it', async ({
    page,
  }) => {
    await open(page, 'snackbar')
    await page.getByRole('button', { name: 'Queue three' }).click()
    await expect(page.getByText('First', { exact: true })).toBeVisible()
    await expect(page.getByText('Second', { exact: true })).toBeHidden()
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByText('First', { exact: true })).toBeHidden()
    await page.waitForTimeout(600)
    await expect(page.getByText('Second', { exact: true })).toBeHidden()
  })
})

test.describe('Tooltip', () => {
  test('a hover shows it and a leave hides it', async ({ page }) => {
    await open(page, 'tooltip')
    await page.getByRole('button', { name: 'Favourite' }).hover()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await page.mouse.move(900, 700)
    await expect(tooltip).toBeHidden()
  })

  test('keyboard focus shows it and Escape hides it', async ({ page }) => {
    await open(page, 'tooltip')
    await page.getByRole('button', { name: 'Go back' }).focus()
    const share = page.getByRole('button', { name: 'Share' })
    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab')
      if (await share.evaluate((node) => node === document.activeElement)) break
    }
    await expect(share).toBeFocused()
    const tooltip = page.getByRole('tooltip', { name: 'Share' })
    await expect(tooltip).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(tooltip).toBeHidden()
  })

  test('a click on the anchor still presses it', async ({ page }) => {
    await open(page, 'tooltip')
    const anchor = page.getByRole('button', { name: 'Show help' })
    await anchor.click()
    await expect(page.getByRole('tooltip')).toBeVisible()
  })
})
