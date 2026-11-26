import type { Locator, Page } from '@playwright/test'
import { box, expect, open, pressKeyOn, test } from './support'

const value = async (slider: Locator) =>
  Number(await slider.getAttribute('aria-valuenow'))

/** Presses at one fraction of the track width and releases at another. */
async function drag(page: Page, slider: Locator, from: number, to: number) {
  await slider.scrollIntoViewIfNeeded()
  const track = await box(slider)
  const y = track.y + track.height / 2
  await page.mouse.move(track.x + track.width * from, y)
  await page.mouse.down()
  await page.mouse.move(track.x + track.width * ((from + to) / 2), y, {
    steps: 5,
  })
  await page.mouse.move(track.x + track.width * to, y, { steps: 5 })
  await page.mouse.up()
}

test.describe('Slider', () => {
  test('the arrow keys change the value', async ({ page }) => {
    await open(page, 'slider')
    const slider = page.getByRole('slider').first()
    expect(await value(slider)).toBeCloseTo(0.4, 5)
    await pressKeyOn(slider, 'ArrowRight')
    await expect.poll(() => value(slider)).toBeGreaterThan(0.4)
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => value(slider)).toBeLessThan(0.4)
  })

  test('Home and End go to the limits', async ({ page }) => {
    await open(page, 'slider')
    const slider = page.getByRole('slider').nth(1)
    await pressKeyOn(slider, 'End')
    await expect.poll(() => value(slider)).toBe(100)
    await page.keyboard.press('Home')
    await expect.poll(() => value(slider)).toBe(0)
  })

  test('a drag moves the value with the pointer', async ({ page }) => {
    await open(page, 'slider')
    const slider = page.getByRole('slider').first()
    await drag(page, slider, 0.4, 0.8)
    await expect.poll(() => value(slider)).toBeGreaterThan(0.72)
    expect(await value(slider)).toBeLessThan(0.88)
    await expect(page.getByText(/^Value: 0\.[78]\d$/)).toBeVisible()
  })

  test('a click on the track jumps to that point', async ({ page }) => {
    await open(page, 'slider')
    const slider = page.getByRole('slider').first()
    const track = await box(slider)
    await page.mouse.click(
      track.x + track.width * 0.2,
      track.y + track.height / 2,
    )
    await expect.poll(() => value(slider)).toBeGreaterThan(0.12)
    expect(await value(slider)).toBeLessThan(0.28)
  })

  test('a discrete slider stops on a step', async ({ page }) => {
    await open(page, 'slider')
    const slider = page.getByRole('slider').nth(1)
    await drag(page, slider, 0.4, 0.63)
    await expect.poll(() => value(slider)).toBe(60)
  })

  test('a disabled slider keeps its value', async ({ page }) => {
    await open(page, 'slider')
    const slider = page.getByRole('slider').last()
    await drag(page, slider, 0.7, 0.2)
    expect(await value(slider)).toBeCloseTo(0.7, 5)
  })

  test('in RTL the value grows to the left', async ({ page }) => {
    await open(page, 'slider', { rtl: true })
    const slider = page.getByRole('slider').first()
    await drag(page, slider, 0.6, 0.2)
    await expect.poll(() => value(slider)).toBeGreaterThan(0.72)
    expect(await value(slider)).toBeLessThan(0.88)
    await pressKeyOn(slider, 'ArrowLeft')
    await expect.poll(() => value(slider)).toBeGreaterThan(0.8)
  })
})
