---
sidebar_position: 4
sidebar_label: Limits
description: What @rootnative/seo cannot do — the server-rendered image, the host 404, the charset position, the per-route noindex decision, the first paint of a translated page on a server, and the checks that count on the live host.
---

# Limits

Six things are outside the package. Each one is a decision the app or the
host makes, and the docs say so instead of hiding it.

## The server-rendered image

`expo-image` mounts its image in an effect, so a static export has no `<img>`
element, and the React Native `Image` writes none either: on the web it
starts idle, loads the source in an effect, and writes its hidden `<img>`
only for `defaultSource`. A crawler that runs no script sees no image and
no `alt`.

`Picture` from `@rootnative/seo/expo-image` closes the gap. On the web it
renders a plain `<img>` with `src`, `alt`, `width` and `height`, so the
crawler sees a visible image with its size, and the page reserves the box
before the image loads. On native it renders `expo-image`. Its `source` is
absolute or a path under the site URL, like `image` in `PageHead`. The
cost: the web side takes no `expo-image` feature. A page that needs caching
or a transition on the web keeps `expo-image` there, with the two fallbacks
that carry the image to a crawler:

1. `og:image` in the head. Every share card reads it, and so does Google
   Images for the page.
2. The `image` field of the JSON-LD. Every builder takes one.

Set both on every page that has an image, with or without `Picture`.

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
- With `web.output: 'server'`, the server sends the 404 for an unknown path,
  on any host. It sends a dynamic route template with a 200 for every slug,
  so an unknown entry needs `noindex`. See
  [server output](./checklist.md#server-output).

## The charset position

The HTML spec requires the `<meta charset>` in the first 1024 bytes of the
page. `shellTags` writes it first in the shell, but on Expo SDK 57 Expo
Router writes the `PageHead` tags at the start of `<head>`, before the shell.
A page with a title, a description and the Open Graph tags puts the charset
after byte 1024. The home page of the example app is one such page.

On SDK 57 no package changes that order. From SDK 58 the shell places the
`generateMetadata` tags where it renders `headNodes`, so a shell that renders
them after `shellTags` keeps the charset first. On both, the host should send
the charset in the `Content-Type` header, because the header wins over the
tag:

- GitHub Pages sends `text/html; charset=utf-8` for an `.html` file.
- A host that sends `text/html` with no charset, or no `Content-Type`, makes
  the browser guess the encoding. Check the header with
  `curl -I <url>`.

## The per-route `noindex` decision

The package writes the tag. The app decides which routes carry it. The usual
set:

- An overlay or a sheet that has a route of its own.
- A screen that exists for one device class, such as a compact-only menu.
- A page that shows the same content as another URL, when a canonical link
  to the other URL is not enough.

Give the route `noindex` and no `url`. Don't list it in `robots.txt`: a
crawler reads the `noindex` tag only on a page it may fetch, and a
`Disallow` line leaves the URL in the index with no title.

## The page language

Expo Router writes the `<html>` element of `app/+html.tsx` on every page,
and from Expo SDK 58 the render changes no attribute of it: `Metadata` has
no field for `lang`, and the renderer applies no `<html>` attribute from a
page. So every page leaves the export with the `lang` of the shell, and the
German version of an English site says `lang="en"`. Google takes the
language of a version from its `hreflang` links, not from `lang`. A screen
reader and some other search engines read `lang`.

The package sets the `lang` of a page in another language in two places:

- `rootnative-seo dist` reads the language of each page from its head, the
  `hreflang` link to itself or else `og:locale`, and sets `lang` on `<html>`
  in the file when it names another language than the shell. `--no-lang`
  leaves the files as they are.
- `PageHead` and `RouteHead` set `lang` on `<html>` after hydration and
  after a client navigation, and put the `lang` of the shell back when the
  page goes. `pageLang(site, meta)` from the core returns the value they
  use, for a template of your own.

A page in the language of the shell keeps the `lang` of the shell: `en`
stays `en` on a page with `og:locale` `en_US`. `rootnative-seo audit` fails
a page of a static export whose `lang` is not the language of the page.

Two limits stay. A server export (`web.output: 'server'`) renders each page
at request time, so no file holds the page: the first paint has the `lang`
of the shell, and the page sets its own after hydration. And a `<html>`
element inside `<Head>` from `expo-router/head` does nothing in an SDK 58
export; don't add one.

## The checks that count

The unit tests and the export check prove that the tags reach the HTML. They
don't prove that a crawler indexes the page. Two checks do, and both run on
the live host only:

- **Lighthouse** in Chrome, on the deployed URL. The SEO audit reads the
  title, the description, the canonical link, the `<h1>`, and the link
  targets, from the HTML the host serves. Make it a gate: run it after each
  deploy and fail the workflow below 100. The
  [deploy workflow](https://github.com/rootnative/ui/blob/main/.github/workflows/deploy-web.yml)
  of this site does, with one script that takes the URLs; the GitHub
  `ubuntu-latest` runner has Chrome. The workflow busts the Pages edge cache
  with a query string, because the edge can serve the previous deploy for
  ten minutes. Lighthouse audits the DOM after the script ran, not the
  served file: the client-side head rewrites the title and the canonical
  link, so a defect in the HTML file still scores 100 here. `rootnative-seo
  audit` reads the file and is the gate for that; Lighthouse catches what
  the host adds or blocks, such as a `noindex` or a `robots.txt` rule.
- **Google Search Console**, with the sitemap submitted. The URL inspection
  tool shows the page as Google rendered it, and the coverage report shows
  the routes it indexed and the ones it did not. This step stays manual:
  verify the property once, then submit `<siteUrl>/sitemap.xml`, the file
  `rootnative-seo` writes. A site under a subpath submits its own sitemap
  URL, and the root site lists every sitemap in `robots.txt`.

A green export check and a red Search Console report means the host, not the
head. Start with the status code of the URL.
