import { renderToStaticMarkup } from 'react-dom/server'
import { shellTags } from '../expo-router'

function html(options: Parameters<typeof shellTags>[0]) {
  return renderToStaticMarkup(<>{shellTags(options)}</>)
}

describe('shellTags', () => {
  it('writes the charset and the viewport with no options', () => {
    expect(html({})).toBe(
      '<meta charSet="utf-8"/>' +
        '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>',
    )
  })

  it('prefixes relative hrefs with the base path', () => {
    const out = html({
      basePath: '/ui/demo/',
      themeColor: '#4C0519',
      favicon: '/favicon.ico',
      appleTouchIcon: 'apple-touch-icon.png',
      manifest: '/manifest.webmanifest',
      preconnect: [
        { href: 'https://api.example.com', crossOrigin: true },
        { href: 'https://cdn.example.com' },
      ],
    })
    expect(out).toContain('<meta name="theme-color" content="#4C0519"/>')
    expect(out).toContain('<link rel="icon" href="/ui/demo/favicon.ico"/>')
    expect(out).toContain(
      '<link rel="apple-touch-icon" href="/ui/demo/apple-touch-icon.png"/>',
    )
    expect(out).toContain(
      '<link rel="manifest" href="/ui/demo/manifest.webmanifest"/>',
    )
    expect(out).toContain(
      '<link rel="preconnect" href="https://api.example.com" crossorigin="anonymous"/>',
    )
    expect(out).toContain(
      '<link rel="preconnect" href="https://cdn.example.com"/>',
    )
  })

  it('leaves hrefs alone without a base path', () => {
    const out = html({ favicon: '/favicon.ico', manifest: '/m.json' })
    expect(out).toContain('href="/favicon.ico"')
    expect(out).toContain('href="/m.json"')
  })

  it('gives every element a key', () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {})
    html({ favicon: '/a', preconnect: [{ href: 'https://b' }] })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
