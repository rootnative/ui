import { useEffect } from 'react'

/**
 * Sets the browser toolbar colour to `color` after hydration, so that it
 * follows the mode that the user picks in the app and not only the system
 * scheme. Pass the background of the theme that renders.
 *
 * It sets the `content` of each `theme-color` tag in the head, for example
 * the `{ light, dark }` pair of `shellTags`, and puts the old values back on
 * unmount. With no `theme-color` tag it adds one and removes it on unmount.
 * Keep the static tags: they give the first paint and a page with no
 * JavaScript their colour.
 *
 * Call it in one place, near the root, inside the theme provider. `undefined`
 * changes nothing. On native and on a server it does nothing.
 */
export function useBrowserThemeColor(color: string | undefined): void {
  useEffect(() => {
    if (!color || typeof document === 'undefined') return undefined
    const tags = Array.from(
      document.head.querySelectorAll<HTMLMetaElement>(
        'meta[name="theme-color"]',
      ),
    )
    if (tags.length === 0) {
      const added = document.createElement('meta')
      added.setAttribute('name', 'theme-color')
      added.setAttribute('content', color)
      document.head.appendChild(added)
      return () => added.remove()
    }
    const before = tags.map((tag) => ({
      tag,
      content: tag.getAttribute('content'),
    }))
    for (const tag of tags) tag.setAttribute('content', color)
    return () => {
      for (const { tag, content } of before) {
        if (content === null) tag.removeAttribute('content')
        else tag.setAttribute('content', content)
      }
    }
  }, [color])
}
