<!-- Absolute URL: npm does not resolve repository-relative image paths. -->
<img src="https://raw.githubusercontent.com/rootnative/ui/main/assets/brand/rootnative-mark.png" alt="" width="88" height="88" />

# @rootnative/seo

What a search engine and a link preview read from a React Native web app: the document head, the structured data, the heading outline, the image text, the HTML shell, the sitemap, and the robots file.

The package holds the parts that do not depend on your data. Your app keeps the mapping from its data to the meta. The same package serves an Expo Router static export, a Vite and react-native-web build, and an Electron renderer, because the core has no dependency on React Native or on a router.

## Install

```bash
pnpm add @rootnative/seo
```

| Entry | Needs | What it holds |
| --- | --- | --- |
| `@rootnative/seo` | nothing | `defineSite`, `toHeadTags`, `clipDescription`, `isoDuration`, the types |
| `@rootnative/seo/schema` | nothing | JSON-LD builders: `webSite`, `breadcrumbList`, `organization`, `article`, `product`, `movie`, `person`, `event`, `faqPage` |
| `@rootnative/seo/react` | `react`, `react-native` | `SeoProvider`, `Heading`, `imageLabel` |
| `@rootnative/seo/expo-router` | `expo-router` | `PageHead`, `shellTags` |
| `@rootnative/seo/node` | Node | `writeSitemap`, `writeRobots`, `writeManifest` |

## Quick start (Expo Router)

```tsx
// src/site.ts
import { defineSite } from '@rootnative/seo'

export const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app',
})
```

```tsx
// app/_layout.tsx
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

```tsx
// app/movies/[id].tsx
import { PageHead } from '@rootnative/seo/expo-router'
import { movie } from '@rootnative/seo/schema'

<PageHead
  title={data.title}
  description={data.overview}
  url={`/movies/${data.id}`}
  image={data.posterUrl}
  type="video.movie"
  jsonLd={[movie({ name: data.title, url: `https://example.com/app/movies/${data.id}` })]}
/>
```

Set `web.output` to `static` in `app.json`, and the head of each page is in its HTML file at export time.

## The rules the head follows

- The tab title uses the site template. The Open Graph title does not, because the card shows the site name on its own line.
- A page with no `url` gets no canonical link and no share card. That is the correct result for a `noindex` overlay.
- `og:image:width` and `og:image:height` are written only with an image.
- A JSON-LD builder leaves an empty field out. It never writes `""`, `null`, or `[]`.
- The JSON-LD text escapes `<`, so a `</script>` in a title cannot end the tag.

## Docs

- The checklist, in order: https://rootnative.github.io/ui/seo/checklist
- API reference: https://rootnative.github.io/ui/seo/api
- Limits: https://rootnative.github.io/ui/seo/limits
- For AI agents: `node_modules/@rootnative/seo/llms.txt` ships with the package, and https://rootnative.github.io/ui/llms-full.txt has the whole library.

## License

MIT
