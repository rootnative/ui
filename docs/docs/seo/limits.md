---
sidebar_position: 4
sidebar_label: Limits
description: What @rootnative/seo cannot do — the server-rendered image, the host 404, the per-route noindex decision, and the checks that count on the live host.
---

# Limits

Four things are outside the package. Each one is a decision the app or the
host makes, and the docs say so instead of hiding it.

## The server-rendered image

`expo-image` mounts its image in an effect, so a static export has no `<img>`
element. A crawler sees the `alt` text only after the script runs. Two
fallbacks carry the image to a crawler that does not run it:

1. `og:image` in the head. Every share card reads it, and so does Google
   Images for the page.
2. The `image` field of the JSON-LD. Every builder takes one.

Set both on every page that has an image. The React Native `Image` renders an
`<img>` on the export, so an app that uses it has no gap.

## The host 404

A static export writes one file per route it knows. A dynamic route with no
`generateStaticParams` writes no file, and the host returns a 404 for it. A
host with no rewrite rule serves a 404 for every unknown path.

No package changes that. Check the host:

- GitHub Pages serves `404.html` for an unknown path, and a script in that
  file can redirect to the app. A crawler still receives the 404 status.
- Netlify, Vercel, and Cloudflare Pages take a rewrite rule that serves
  `index.html` with a 200 for an unknown path.
- A dynamic route with real data needs `generateStaticParams` and a data
  source the export server can reach.

## The per-route `noindex` decision

The package writes the tag. The app decides which routes carry it. The usual
set:

- An overlay or a sheet that has a route of its own.
- A screen that exists for one device class, such as a compact-only menu.
- A page that shows the same content as another URL, when a canonical link
  to the other URL is not enough.

Give the route `noindex` and no `url`. Do not list it in `robots.txt`: a
crawler reads the `noindex` tag only on a page it may fetch, and a
`Disallow` line leaves the URL in the index with no title.

## The checks that count

The unit tests and the export check prove that the tags reach the HTML. They
do not prove that a crawler indexes the page. Two checks do, and both run on
the live host only:

- **Lighthouse** in Chrome, on the deployed URL. The SEO audit reads the
  title, the description, the canonical link, the `<h1>`, and the link
  targets, from the HTML the host serves.
- **Google Search Console**, with the sitemap submitted. The URL inspection
  tool shows the page as Google rendered it, and the coverage report shows
  the routes it indexed and the ones it did not.

A green export check and a red Search Console report means the host, not the
head. Start with the status code of the URL.
