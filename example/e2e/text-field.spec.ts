import { expect, open, test } from './support'

test.describe('TextField', () => {
  test('typing fills the field', async ({ page }) => {
    await open(page, 'text-field')
    const field = page.getByRole('textbox', { name: 'Label' }).first()
    await field.click()
    await expect(field).toBeFocused()
    await page.keyboard.type('Hello world')
    await expect(field).toHaveValue('Hello world')
    await page.keyboard.press('Backspace')
    await expect(field).toHaveValue('Hello worl')
  })

  test('the label floats on focus and returns when empty', async ({ page }) => {
    await open(page, 'text-field')
    const field = page.getByRole('textbox', { name: 'Label' }).first()
    const label = page.getByText('Label', { exact: true }).first()
    const resting = (await label.boundingBox())!.y
    await field.click()
    await expect
      .poll(async () => (await label.boundingBox())!.y)
      .toBeLessThan(resting - 4)
    await field.blur()
    await expect
      .poll(async () => (await label.boundingBox())!.y)
      .toBeCloseTo(resting, 0)
  })

  test('Tab moves from one field to the next', async ({ page }) => {
    await open(page, 'text-field')
    await page.getByRole('textbox', { name: 'Label' }).first().focus()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('textbox', { name: 'With icons' }).first(),
    ).toBeFocused()
  })

  test('the trailing icon shows and hides the password', async ({ page }) => {
    await open(page, 'text-field')
    const field = page.getByRole('textbox', { name: 'Password' })
    await field.fill('secret')
    await expect(field).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(field).not.toHaveAttribute('type', 'password')
    await expect(field).toHaveValue('secret')
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(field).toHaveAttribute('type', 'password')
  })

  test('maxLength stops the input and the counter follows', async ({
    page,
  }) => {
    await open(page, 'text-field')
    const field = page.getByRole('textbox', { name: 'Bio', exact: true })
    await field.click()
    await page.keyboard.type('12345')
    await expect(page.getByText('5/80').first()).toBeVisible()
    await field.fill('x'.repeat(80))
    await page.keyboard.type('yz')
    await expect(field).toHaveValue('x'.repeat(80))
    await expect(page.getByText('80/80').first()).toBeVisible()
  })

  test('a disabled field takes no input', async ({ page }) => {
    await open(page, 'text-field')
    const field = page.getByRole('textbox', { name: 'Disabled' }).first()
    await expect(field).toBeDisabled()
    await expect(field).toHaveValue('Disabled value')
  })

  test('Enter adds a line in a multiline field', async ({ page }) => {
    await open(page, 'text-field')
    const field = page.getByRole('textbox', { name: 'Description' })
    await field.click()
    await page.keyboard.type('one')
    await page.keyboard.press('Enter')
    await page.keyboard.type('two')
    await expect(field).toHaveValue('one\ntwo')
  })
})
