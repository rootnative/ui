import { render } from '@testing-library/react'
import { useBrowserThemeColor } from '../../react'

const LIGHT = '#f8f9ff'
const DARK = '#0e141c'

function ToolbarColor({ color }: { color: string | undefined }) {
  useBrowserThemeColor(color)
  return null
}

function themeColorTags(): Array<{ media: string | null; content: string }> {
  return Array.from(
    document.head.querySelectorAll('meta[name="theme-color"]'),
  ).map((tag) => ({
    media: tag.getAttribute('media'),
    content: tag.getAttribute('content') ?? '',
  }))
}

const lightPair = [
  { media: '(prefers-color-scheme: light)', content: LIGHT },
  { media: '(prefers-color-scheme: dark)', content: DARK },
]

afterEach(() => {
  document.head
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((tag) => tag.remove())
})

describe('useBrowserThemeColor', () => {
  describe('with the { light, dark } pair of shellTags in the head', () => {
    // The markup that `shellTags({ themeColor: { light, dark } })` writes, as
    // pinned in `shell-tags.test.tsx`. `react-dom/server` needs a
    // `MessageChannel`, which jsdom does not have.
    beforeEach(() => {
      document.head.insertAdjacentHTML(
        'beforeend',
        `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${LIGHT}"/>` +
          `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${DARK}"/>`,
      )
    })

    it('sets both tags to the colour, and puts them back on unmount', () => {
      expect(themeColorTags()).toEqual(lightPair)
      const { unmount } = render(<ToolbarColor color={DARK} />)
      expect(themeColorTags()).toEqual([
        { media: '(prefers-color-scheme: light)', content: DARK },
        { media: '(prefers-color-scheme: dark)', content: DARK },
      ])
      unmount()
      expect(themeColorTags()).toEqual(lightPair)
    })

    it('follows a change of the colour', () => {
      const { rerender } = render(<ToolbarColor color={DARK} />)
      rerender(<ToolbarColor color="#123456" />)
      expect(themeColorTags().map((tag) => tag.content)).toEqual([
        '#123456',
        '#123456',
      ])
    })

    it('changes nothing for undefined', () => {
      render(<ToolbarColor color={undefined} />)
      expect(themeColorTags()).toEqual(lightPair)
    })
  })

  it('adds one tag when the head has none, and removes it on unmount', () => {
    const { unmount } = render(<ToolbarColor color={DARK} />)
    expect(themeColorTags()).toEqual([{ media: null, content: DARK }])
    unmount()
    expect(themeColorTags()).toEqual([])
  })
})
