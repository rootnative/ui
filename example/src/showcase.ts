import data from './showcase.json'

/**
 * One pattern built from several components. The showcase is the example's
 * dynamic route: `app/showcase/[slug].tsx` exports one page per entry
 * through `generateStaticParams`, from this seeded list.
 */
export interface ShowcaseEntry {
  /** The route segment, `/showcase/<slug>`. */
  slug: string
  title: string
  /** One-line summary, also the page description. */
  description: string
  /** Catalog routes without the leading slash, in the order they are used. */
  components: string[]
}

export const showcaseEntries: ShowcaseEntry[] = data

export function findShowcase(slug: string | undefined) {
  return showcaseEntries.find((entry) => entry.slug === slug)
}
