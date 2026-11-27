import { expect, expectAlert, open, pressKeyOn, test } from './support'

test.describe('ButtonGroup', () => {
  test('a single-select group moves the selection', async ({ page }) => {
    await open(page, 'button-group')
    const group = page.getByRole('radiogroup').first()
    const left = group.getByRole('radio', { name: 'Left' })
    const right = group.getByRole('radio', { name: 'Right' })
    await expect(left).toHaveAttribute('aria-checked', 'true')
    await right.click()
    await expect(right).toHaveAttribute('aria-checked', 'true')
    await expect(left).toHaveAttribute('aria-checked', 'false')
  })

  test('a multi-select group toggles each button', async ({ page }) => {
    await open(page, 'button-group')
    const bold = page.getByRole('checkbox', { name: 'Bold' }).first()
    const underline = page.getByRole('checkbox', { name: 'Underline' }).first()
    await underline.click()
    await expect(underline).toHaveAttribute('aria-checked', 'true')
    await expect(bold).toHaveAttribute('aria-checked', 'true')
    await bold.click()
    await expect(bold).toHaveAttribute('aria-checked', 'false')
  })

  test('Space selects the focused button one time', async ({ page }) => {
    await open(page, 'button-group')
    const underline = page.getByRole('checkbox', { name: 'Underline' }).first()
    await pressKeyOn(underline, 'Space')
    await expect(underline).toHaveAttribute('aria-checked', 'true')
  })

  test('a disabled button keeps its value', async ({ page }) => {
    await open(page, 'button-group')
    const one = page.getByRole('radio', { name: 'One' })
    await one.click({ force: true })
    await expect(one).toHaveAttribute('aria-checked', 'false')
    const locked = page.getByRole('radio', { name: 'Locked' })
    await locked.click({ force: true })
    await expect(locked).toHaveAttribute('aria-checked', 'false')
  })
})

test.describe('IconButton and FAB', () => {
  test('an icon button takes a click and a key press', async ({ page }) => {
    await open(page, 'icon-button')
    const button = page.getByRole('button', { name: 'Filled heart' })
    await button.click()
    await pressKeyOn(button, 'Enter')
    await expect(button).toBeFocused()
  })

  test('a disabled icon button is not a tab stop', async ({ page }) => {
    await open(page, 'icon-button')
    const disabled = page
      .getByRole('button', { name: 'Like', disabled: true })
      .first()
    await expect(disabled).toHaveAttribute('tabindex', '-1')
  })

  test('a FAB takes a click and a key press', async ({ page }) => {
    await open(page, 'fab')
    const fab = page.getByRole('button', { name: 'Add location' })
    await fab.click()
    await pressKeyOn(fab, 'Space')
    await expect(fab).toBeFocused()
    await expect(
      page.getByRole('button', { name: 'Add', exact: true, disabled: true }),
    ).toHaveAttribute('tabindex', '-1')
  })
})

test.describe('Card', () => {
  test('an interactive card takes a click', async ({ page }) => {
    await open(page, 'card')
    await page
      .getByRole('button', { name: /Tap this interactive filled card/ })
      .click()
    await expectAlert(page, 'filled card pressed')
  })

  test('Enter presses the focused card', async ({ page }) => {
    await open(page, 'card')
    const card = page.getByRole('button', {
      name: /Tap this interactive outlined card/,
    })
    await pressKeyOn(card, 'Enter')
    await expectAlert(page, 'outlined card pressed')
  })

  test('a button in a card takes its own press', async ({ page }) => {
    await open(page, 'card')
    await page.getByRole('button', { name: 'Book' }).click()
    await expectAlert(page, 'Booked')
  })
})

test.describe('List', () => {
  test('a row with a switch toggles it from the whole row', async ({
    page,
  }) => {
    await open(page, 'list')
    const row = page.getByRole('switch').first()
    await expect(row).toHaveAttribute('aria-checked', 'true')
    await page.getByText('The row takes the press').click()
    await expect(row).toHaveAttribute('aria-checked', 'false')
  })

  test('a row with a checkbox toggles it', async ({ page }) => {
    await open(page, 'list')
    const row = page.getByRole('checkbox').first()
    await page.getByText('Newsletter', { exact: true }).click()
    await expect(row).toHaveAttribute('aria-checked', 'true')
    await pressKeyOn(row, 'Space')
    await expect(row).toHaveAttribute('aria-checked', 'false')
  })

  test('a pressable row takes a click', async ({ page }) => {
    await open(page, 'list')
    await page.getByRole('button', { name: /Bluetooth/ }).click()
    await expectAlert(page, 'Bluetooth tapped')
  })
})

test.describe('Carousel', () => {
  test('the buttons move the controlled carousel', async ({ page }) => {
    await open(page, 'carousel')
    await expect(page.getByText(/Item 1 of \d+\./)).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText(/Item 2 of \d+\./)).toBeVisible()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page.getByText(/Item 1 of \d+\./)).toBeVisible()
  })

  test('Last scrolls the last item into view', async ({ page }) => {
    await open(page, 'carousel')
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.getByText(/Item (\d+) of \1\./)).toBeVisible()
  })

  test('an item reports its press', async ({ page }) => {
    await open(page, 'carousel')
    await page.getByText(/Item 1 of/).scrollIntoViewIfNeeded()
    const items = page.getByRole('button', { name: 'Cabin by the lake' })
    await items.last().click()
    await expect(page.getByText('Pressed: Cabin by the lake.')).toBeVisible()
  })
})

test.describe('SearchBar', () => {
  test('Enter runs the search with the typed text', async ({ page }) => {
    await open(page, 'search-bar')
    const field = page.getByPlaceholder('Search mail')
    await field.click()
    await page.keyboard.type('invoices')
    await expect(field).toHaveValue('invoices')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Last search: "invoices"')).toBeVisible()
  })

  test('the input has the searchbox role', async ({ page }) => {
    await open(page, 'search-bar')
    await expect(
      page.getByRole('searchbox', { name: 'Search mail' }),
    ).toHaveAttribute('placeholder', 'Search mail')
  })

  test('the bar is a search landmark around its input', async ({ page }) => {
    await open(page, 'search-bar')
    const landmark = page.getByRole('search').first()
    await expect(landmark.getByPlaceholder('Search mail')).toBeVisible()
  })

  test('a disabled bar takes no input', async ({ page }) => {
    await open(page, 'search-bar')
    await expect(page.locator('input[aria-disabled="true"]')).toBeDisabled()
  })
})

test.describe('Portal', () => {
  test('a toast shows above the page and a press dismisses it', async ({
    page,
  }) => {
    await open(page, 'portal')
    await page.getByRole('button', { name: 'Show toast' }).first().click()
    const toast = page.getByRole('button', { name: 'Dismiss toast' })
    await expect(toast).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hide toast' })).toBeVisible()
    await toast.click()
    await expect(toast).toBeHidden()
  })

  test('a press in the dialog stays in it, and the scrim dismisses', async ({
    page,
  }) => {
    await open(page, 'portal')
    await page.getByRole('button', { name: 'Open dialog', exact: true }).click()
    const title = page.getByText('Save changes?')
    await expect(title).toBeVisible()
    await title.click()
    await expect(title).toBeVisible()
    await page.mouse.click(20, 20)
    await expect(title).toBeHidden()
  })

  test('a scoped overlay renders in its host', async ({ page }) => {
    await open(page, 'portal')
    const button = page.getByRole('button', { name: 'Show scoped overlay' })
    await button.click()
    await expect(
      page.getByRole('button', { name: 'Hide scoped overlay' }),
    ).toBeVisible()
  })
})

test.describe('Progress', () => {
  test('a determinate bar follows its value', async ({ page }) => {
    await open(page, 'progress')
    const bar = page.getByRole('progressbar').first()
    const first = Number(await bar.getAttribute('aria-valuenow'))
    await expect
      .poll(async () => Number(await bar.getAttribute('aria-valuenow')))
      .not.toBe(first)
  })
})

test.describe('Keyboard wrapper', () => {
  test('the controls and the fields work together', async ({ page }) => {
    await open(page, 'keyboard-avoiding-wrapper')
    const enabled = page.getByRole('switch').first()
    await enabled.click()
    await expect(enabled).toHaveAttribute('aria-checked', 'false')
    const height = page.getByRole('radio', { name: 'height' })
    await height.click()
    await expect(height).toHaveAttribute('aria-checked', 'true')
    const name = page.getByRole('textbox', { name: 'Name' })
    await name.fill('Ada')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused()
    await expect(name).toHaveValue('Ada')
  })
})
