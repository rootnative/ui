import { box, expect, open, pressKeyOn, test } from './support'

test.describe('Tabs', () => {
  test('a click selects a tab and shows its panel', async ({ page }) => {
    await open(page, 'tabs')
    const flights = page.getByRole('tab', { name: 'Flights' }).first()
    const trips = page.getByRole('tab', { name: 'Trips' })
    await expect(page.getByText('Two seats left at this price.')).toBeVisible()
    await trips.click()
    await expect(trips).toHaveAttribute('aria-selected', 'true')
    await expect(flights).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByText('Nothing booked yet.')).toBeVisible()
  })

  test('the indicator moves under the selected tab', async ({ page }) => {
    await open(page, 'tabs')
    const list = page.getByRole('tablist').first()
    const explore = page.getByRole('tab', { name: 'Explore' })
    // The indicator is the thin bar in the tab list that is not in a tab and
    // is not the full-width divider.
    const indicatorCenter = () =>
      list.evaluate((element) => {
        const full = element.getBoundingClientRect().width
        for (const node of element.querySelectorAll('*')) {
          const rect = node.getBoundingClientRect()
          const inTab = node.closest('[role="tab"]') !== null
          const thin = rect.height >= 2 && rect.height <= 4
          if (!inTab && thin && rect.width > 8 && rect.width < full / 2) {
            return rect.x + rect.width / 2
          }
        }
        return -1
      })
    await explore.click()
    const tab = await box(explore)
    await expect
      .poll(async () =>
        Math.abs((await indicatorCenter()) - (tab.x + tab.width / 2)),
      )
      .toBeLessThan(2)
  })

  test('Space selects the focused tab', async ({ page }) => {
    await open(page, 'tabs')
    const explore = page.getByRole('tab', { name: 'Explore' })
    await pressKeyOn(explore, 'Space')
    await expect(explore).toHaveAttribute('aria-selected', 'true')
  })

  test('a disabled tab stays unselected', async ({ page }) => {
    await open(page, 'tabs')
    const deleted = page.getByRole('tab', { name: 'Deleted' })
    await deleted.click({ force: true })
    await expect(deleted).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByRole('tab', { name: 'Active' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('a scrollable tab off the edge scrolls into view on a click', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 420, height: 800 })
    await open(page, 'tabs')
    const returns = page.getByRole('tab', { name: 'Returns' })
    await returns.click()
    await expect(returns).toHaveAttribute('aria-selected', 'true')
    await expect(returns).toBeInViewport({ ratio: 1 })
  })
})
