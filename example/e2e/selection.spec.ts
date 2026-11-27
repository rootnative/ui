import { expect, open, pressKeyOn, test } from './support'

test.describe('Checkbox', () => {
  test('a click toggles it', async ({ page }) => {
    await open(page, 'checkbox')
    const checkbox = page.getByRole('checkbox', { name: 'Dark mode' })
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'true')
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })

  test('Space toggles it one time', async ({ page }) => {
    await open(page, 'checkbox')
    const checkbox = page.getByRole('checkbox', { name: 'Auto-update' })
    await pressKeyOn(checkbox, 'Space')
    await expect(checkbox).toHaveAttribute('aria-checked', 'true')
    await pressKeyOn(checkbox, 'Space')
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })

  test('a disabled checkbox keeps its value', async ({ page }) => {
    await open(page, 'checkbox')
    const checkbox = page.getByRole('checkbox', {
      name: 'Unchecked (disabled)',
    })
    await checkbox.click({ force: true })
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })

  test('the parent follows its children', async ({ page }) => {
    await open(page, 'checkbox')
    const parent = page.getByRole('checkbox', { name: 'All notifications' })
    const children = ['Product updates', 'Security alerts', 'Weekly digest']
    await expect(parent).toHaveAttribute('aria-checked', 'mixed')
    await parent.click()
    for (const name of children) {
      await expect(page.getByRole('checkbox', { name })).toHaveAttribute(
        'aria-checked',
        'true',
      )
    }
    await expect(parent).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('checkbox', { name: 'Weekly digest' }).click()
    await expect(parent).toHaveAttribute('aria-checked', 'mixed')
  })
})

test.describe('Radio', () => {
  test('a click moves the selection', async ({ page }) => {
    await open(page, 'radio')
    const first = page.getByRole('radio', { name: 'Option 1' })
    const second = page.getByRole('radio', { name: 'Option 2' })
    await expect(first).toHaveAttribute('aria-checked', 'true')
    await second.click()
    await expect(second).toHaveAttribute('aria-checked', 'true')
    await expect(first).toHaveAttribute('aria-checked', 'false')
  })

  test('Space selects the focused radio', async ({ page }) => {
    await open(page, 'radio')
    const third = page.getByRole('radio', { name: 'Option 3' })
    await pressKeyOn(third, 'Space')
    await expect(third).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('radio', { name: 'Option 1' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  test('a disabled radio keeps its value', async ({ page }) => {
    await open(page, 'radio')
    const radio = page.getByRole('radio', { name: 'Unselected (disabled)' })
    await radio.click({ force: true })
    await expect(radio).toHaveAttribute('aria-checked', 'false')
  })
})

test.describe('Switch', () => {
  test('a click toggles it', async ({ page }) => {
    await open(page, 'switch')
    const control = page.getByRole('switch', { name: 'Basic switch' })
    await control.click()
    await expect(control).toHaveAttribute('aria-checked', 'true')
    await control.click()
    await expect(control).toHaveAttribute('aria-checked', 'false')
  })

  test('Space toggles it one time', async ({ page }) => {
    await open(page, 'switch')
    const control = page.getByRole('switch', { name: 'Basic switch' })
    await pressKeyOn(control, 'Space')
    await expect(control).toHaveAttribute('aria-checked', 'true')
  })

  test('the thumb moves to the other side', async ({ page }) => {
    await open(page, 'switch')
    const control = page.getByRole('switch', { name: 'Basic switch' })
    const thumbCenter = () =>
      control.evaluate((element) => {
        const track = element.getBoundingClientRect()
        let thumb = track
        for (const node of element.querySelectorAll('*')) {
          const rect = node.getBoundingClientRect()
          const round = getComputedStyle(node).borderRadius !== '0px'
          if (round && rect.width > 0 && rect.width < thumb.width) thumb = rect
        }
        return (thumb.x + thumb.width / 2 - track.x) / track.width
      })
    expect(await thumbCenter()).toBeLessThan(0.5)
    await control.click()
    await expect.poll(thumbCenter).toBeGreaterThan(0.5)
  })

  test('a disabled switch keeps its value', async ({ page }) => {
    await open(page, 'switch')
    const control = page.getByRole('switch', { name: 'Off (disabled)' })
    await control.click({ force: true })
    await expect(control).toHaveAttribute('aria-checked', 'false')
  })
})
