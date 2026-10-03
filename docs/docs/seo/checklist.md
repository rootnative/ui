---
sidebar_position: 2
sidebar_label: The checklist
description: The eight steps that make an Expo Router web export indexable, in order, with the @rootnative/seo function that does each one.
---

# The checklist

Follow the steps in this order. Each step names the function that does it.
The first two steps have no function, because they are router settings.

## Install

<PackageManagerTabs cmd="npm install @rootnative/seo" />

The core entry has no dependency. The `/react` and `/expo-router` entries
need `react` and `react-native`, and `/expo-router` needs `expo-router`. The
`/node` entry runs in Node only.

## 1. Static output

Set `web.output` to `static` in `app.json`, and turn the developer sitemap
route off. Expo Router exports `_sitemap.html` otherwise, and a crawler
indexes it.

```json
{
  "expo": {
    "web": { "output": "static" },
    "extra": { "router": { "sitemap": false } }
  }
}
```

A dynamic route needs `generateStaticParams`, or the export writes no file
for it.

The static output renders your `app/+html.tsx`. The single-page output used
Expo's own template, so a custom shell that worked before may lack
`ScrollViewStyleReset` from `expo-router/html`. Without it `#root` has no
height, a Stack screen that fills its parent fills nothing, and the page
shows the top bar over an empty area while the DOM holds every node. Keep
the reset in the shell, as the example in step 7 does.

## 2. Links as `Link`

Use `Link` from `expo-router` for every navigation. It renders an `<a href>`
on the web. A `Pressable` with `router.push` renders a `<div>`, and a crawler
does not follow it.

## 3. The head on every page

Define the site once, give it to `SeoProvider` at the root, and render a
`PageHead` on each screen.

```tsx title="src/site.ts"
import { defineSite } from '@rootnative/seo'

export const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app',
  locale: 'en_US',
  twitterSite: '@trek',
})
```

```tsx title="app/_layout.tsx"
import { SeoProvider } from '@rootnative/seo/react'
import { Stack } from 'expo-router'
import { site } from '../src/site'

export default function RootLayout() {
  return (
    <SeoProvider site={site}>
      <Stack />
    </SeoProvider>
  )
}
```

```tsx title="app/movies/[id].tsx"
import { PageHead } from '@rootnative/seo/expo-router'
import { movie } from '@rootnative/seo/schema'

export default function MovieScreen() {
  const data = useMovie()
  return (
    <>
      <PageHead
        title={data.title}
        description={data.overview}
        url={`/movies/${data.id}`}
        image={data.posterUrl}
        imageSize={{ width: 1200, height: 630 }}
        imageAlt={`${data.title} poster`}
        type="video.movie"
        jsonLd={[
          movie({
            name: data.title,
            url: `https://example.com/app/movies/${data.id}`,
            image: data.posterUrl,
            durationMinutes: data.runtime,
          }),
        ]}
      />
      {/* the screen */}
    </>
  )
}
```

The rules the head follows:

- The tab title uses the site template. The default is `Title | Site`. The
  Open Graph title does not, because the card shows the site name on its own
  line.
- A page with no `url` gets no canonical link and no share card. That is the
  correct result for a `noindex` overlay.
- The description is clipped to 160 characters at a word boundary.
- The Twitter card is `summary_large_image` with an image and `summary`
  without one. Pass `twitterCard` to force one.

A page outside the provider, such as `+not-found`, passes `site` as a prop.
The prop wins over the provider.

### Per-route `noindex`

An overlay route, a filter sheet, or a per-device screen is a page the
crawler can fetch but must not index. Give it `noindex` and no `url`. Do not
add it to `robots.txt`: a crawler reads the `noindex` tag only on a page it
may fetch.

```tsx
<PageHead title="Filters" noindex />
```

## 4. Robots and sitemap

Write both in the deploy step, after the export. The routes come from the
exported files, so the sitemap cannot drift from the app.

```js title="scripts/write-seo.mjs"
import { readdirSync } from 'node:fs'
import { writeManifest, writeRobots, writeSitemap } from '@rootnative/seo/node'

const siteUrl = 'https://example.com/app'
const urls = readdirSync('dist')
  .filter((file) => file.endsWith('.html') && file !== '+not-found.html')
  .map((file) => ({
    loc: file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`,
  }))

await writeSitemap({ outDir: 'dist', siteUrl, urls })
await writeRobots({ outDir: 'dist', sitemapUrl: `${siteUrl}/sitemap.xml` })
```

A crawler reads `robots.txt` at the origin root only. A site on a subpath
host writes the file from the root deploy, and lists every sitemap of the
origin in it.

## 5. Headings and `alt`

A `Text` renders a `<div>`. In a RootNative UI app, pass `level` to
`Typography`: it renders `<h1>` to `<h6>` on the web and announces a header
on native. A display or headline variant with no `level` is a plain element
on the web, so decorative display text needs nothing.

```tsx
import { Typography } from '@rootnative/components'

<Typography variant="titleMedium" level={2}>Cast</Typography>
```

`Heading` from `@rootnative/seo/react` does the same for an app without
`@rootnative/components`. Pass your own text component through `as` to keep
its type scale.

```tsx
import { Heading } from '@rootnative/seo/react'

<Heading level={2}>Cast</Heading>
```

One `<h1>` per page. The `AppBar` title is level 1 by default, so put your
own headings at level 2 and below, or pass `titleLevel={2}` to the bar when a
heading above it is the page heading.

For images, set both `alt` and `accessibilityLabel` on `expo-image`. The web
`alt` attribute comes from `accessibilityLabel`. The React Native `Image`
reads `alt` on its own. `imageLabel` builds the text:

```tsx
import { Image } from 'expo-image'
import { imageLabel } from '@rootnative/seo/react'

const label = imageLabel('Poster', movie.title) // 'Dune poster'

<Image source={poster} alt={label} accessibilityLabel={label} />
```

## 6. JSON-LD

The builders in `@rootnative/seo/schema` return an object with `@context`
and `@type` set, and leave every empty field out. They never write `""`,
`null`, or `[]`. `PageHead` writes each one as a script and escapes `<`, so a
`</script>` in a title cannot end the tag.

| Builder | Schema type |
| --- | --- |
| `webSite` | `WebSite`, with a `SearchAction` when `searchUrlTemplate` is set |
| `breadcrumbList` | `BreadcrumbList` |
| `organization` | `Organization` |
| `article` | `Article` |
| `product` | `Product`, with `Offer`, `Brand`, and `AggregateRating` |
| `movie` | `Movie`, with the duration as ISO 8601 |
| `person` | `Person` |
| `event` | `Event` |
| `faqPage` | `FAQPage` |

A rating with no votes is left out. A duration of `0` is left out.

## 7. Bundle and preconnect

Give the HTML shell a `preconnect` for each origin the first paint needs: the
API, a CDN, a font host. `shellTags` writes them with the charset, the
viewport, the theme colour, the icons, and the manifest.

```tsx title="app/+html.tsx"
import { shellTags } from '@rootnative/seo/expo-router'
import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        {shellTags({
          basePath: process.env.EXPO_BASE_URL,
          themeColor: '#4C0519',
          appleTouchIcon: '/apple-touch-icon.png',
          manifest: '/manifest.webmanifest',
          preconnect: [
            { href: 'https://api.example.com', crossOrigin: true },
            { href: 'https://cdn.example.com' },
          ],
        })}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

`basePath` prefixes every relative `href`, so the same shell works on a
subpath host. `shellTags` has no router dependency: the same function serves
a Vite `index.html` template through `renderToStaticMarkup`.

## 8. The small tags

`writeManifest` writes a web app manifest with relative paths, so it works
under a subpath host. Pass `themeColor` to both `shellTags` and
`writeManifest`, and the same value to `backgroundColor` as the page
background.

## Check the result

Read the export before you deploy. One script that asserts the title, the
canonical link, one `<h1>`, and one JSON-LD script on one page is the test
that catches a head renderer change in Expo Router. The
[example app](https://github.com/rootnative/ui/blob/main/example/scripts/check-export.mjs)
carries one.

Then read the [limits](./limits.md).
