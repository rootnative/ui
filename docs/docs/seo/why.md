---
sidebar_position: 1
sidebar_label: Why a web app is invisible
description: Why a React Native web export is invisible to a crawler — one empty page, no links, and a 404 for a deep link — and what @rootnative/seo gives you to fix it.
---

# Why a React Native web app is invisible to a crawler

A React Native app that exports to the web starts as one empty page. A
crawler and a link preview read three things from that page, and all three
are missing. This section of the docs lists the blockers, then gives you a
checklist in the order that fixes them, with the function in
`@rootnative/seo` that does each step.

## The three blockers

### 1. One empty page

A single-page export writes one `index.html` with an empty `<div>` and a
script. Every route renders on the client. A crawler that does not run the
script sees the same empty page for every URL, and a crawler that does run it
sees a page with no title, no description, and no share card.

The fix is a static export. Expo Router writes one HTML file per route when
`web.output` is `static`, and `PageHead` writes the head of each page into
that file at export time.

### 2. No links

A `Pressable` that calls `router.push` renders a `<div>` with a click handler.
A `Button` that calls `Linking.openURL` renders a `<button>`. A crawler does
not click. It follows `<a href>` elements, and it finds none, so it never
reaches the second page.

The fix is `Link` from Expo Router for every navigation. It renders an
`<a href>` on the web and a pressable on native. Put a component such as
`Button` inside `<Link asChild>`.

### 3. A 404 for a deep link

A host that serves one `index.html` returns a 404 for `/movies/1` unless a
rewrite rule sends every path to that file. A static export removes the
problem for the routes it knows, because `/movies/1.html` exists. A dynamic
route still needs `generateStaticParams`, or a host rewrite, or both.

No package can fix this one. The docs say so, and the
[limits page](./limits.md) explains what to check on the live host.

## What the package does and does not do

`@rootnative/seo` holds the parts that do not depend on your data:

- One `PageMeta` shape for the head of a page, and `toHeadTags` to turn it
  into tag records any renderer can write.
- `PageHead` for Expo Router, `SeoProvider` for the site, and `Heading` for
  the outline.
- JSON-LD builders for the common schema.org types. An empty field is left
  out.
- `shellTags` for the HTML shell, and `writeSitemap`, `writeRobots`, and
  `writeManifest` for the deploy step.

The app keeps the mapping from its data to the meta. The package knows
schema.org, not your API. It does not prerender, it does not configure the
host, and it does not ship an image component.

Next: [the checklist](./checklist.md).
