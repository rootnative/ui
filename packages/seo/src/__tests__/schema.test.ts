import {
  article,
  breadcrumbList,
  event,
  faqPage,
  movie,
  organization,
  person,
  product,
  webSite,
} from '../schema'

function walk(value: unknown, path: string[], found: string[]) {
  if (value === undefined || value === null) found.push(path.join('.'))
  else if (typeof value === 'string') {
    if (value.trim() === '') found.push(path.join('.'))
  } else if (Array.isArray(value)) {
    if (value.length === 0) found.push(path.join('.'))
    value.forEach((item, i) => walk(item, [...path, String(i)], found))
  } else if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) found.push(path.join('.'))
    for (const [key, item] of entries) walk(item, [...path, key], found)
  }
}

/** Every field path that holds `undefined`, `null`, `""`, `[]`, or `{}`. */
function emptyFields(value: unknown): string[] {
  const found: string[] = []
  walk(value, [], found)
  return found
}

describe('every builder', () => {
  const full = [
    webSite({
      name: 'Trek',
      url: 'https://x.y',
      searchUrlTemplate: 'https://x.y/s?q={search_term_string}',
    }),
    breadcrumbList([
      { name: 'Home', url: 'https://x.y/' },
      { name: 'Movies', url: 'https://x.y/movies' },
    ]),
    organization({
      name: 'Trek',
      url: 'https://x.y',
      logo: 'https://x.y/logo.png',
      sameAs: ['https://github.com/trek'],
    }),
    article({
      headline: 'Hello',
      url: 'https://x.y/a',
      image: 'https://x.y/a.jpg',
      description: 'd',
      datePublished: '2026-10-01',
      dateModified: '2026-10-02',
      author: { name: 'Ann', url: 'https://x.y/ann' },
    }),
    product({
      name: 'Pen',
      url: 'https://x.y/p',
      image: 'https://x.y/p.jpg',
      description: 'd',
      brand: 'Acme',
      sku: 'P-1',
      offers: {
        price: 9.5,
        priceCurrency: 'USD',
        availability: 'InStock',
        url: 'https://x.y/p',
      },
      aggregateRating: { ratingValue: 4.2, ratingCount: 10 },
    }),
    movie({
      name: 'Dune',
      url: 'https://x.y/m',
      image: 'https://x.y/m.jpg',
      description: 'd',
      datePublished: '2021-10-22',
      genre: ['Sci-Fi', 'Drama'],
      durationMinutes: 155,
      actors: ['Timothée Chalamet', { name: 'Zendaya' }],
      director: 'Denis Villeneuve',
      rating: { ratingValue: 8.1, ratingCount: 1000, bestRating: 10 },
    }),
    person({
      name: 'Ann',
      url: 'https://x.y/ann',
      image: 'https://x.y/ann.jpg',
      description: 'd',
      birthDate: '1980-01-01',
      deathDate: '2020-01-01',
      birthPlace: 'Oslo',
      jobTitle: 'Actor',
      sameAs: ['https://x.y/ann2'],
    }),
    event({
      name: 'Premiere',
      url: 'https://x.y/e',
      startDate: '2026-11-01T19:00:00Z',
      endDate: '2026-11-01T21:00:00Z',
      location: { name: 'Hall', address: '1 Street' },
      image: 'https://x.y/e.jpg',
      description: 'd',
    }),
    faqPage([{ question: 'Q?', answer: 'A.' }]),
  ]

  const minimal = [
    webSite({ name: 'Trek', url: 'https://x.y' }),
    breadcrumbList([{ name: 'Home', url: 'https://x.y/' }]),
    organization({ name: 'Trek', url: 'https://x.y', sameAs: [] }),
    article({ headline: 'Hello', url: 'https://x.y/a', author: '' }),
    product({ name: 'Pen', url: 'https://x.y/p', brand: '', description: '' }),
    movie({
      name: 'Dune',
      url: 'https://x.y/m',
      durationMinutes: 0,
      actors: [],
      genre: '',
      rating: { ratingValue: 0, ratingCount: 0 },
    }),
    person({ name: 'Ann', url: 'https://x.y/ann', birthPlace: ' ' }),
    event({ name: 'Premiere', url: 'https://x.y/e', startDate: '2026-11-01' }),
    faqPage([{ question: 'Q?', answer: 'A.' }]),
  ]

  it.each([...full, ...minimal].map((item) => [item['@type'], item]))(
    '%s writes @context and @type and no empty field',
    (_type, item) => {
      expect(item['@context']).toBe('https://schema.org')
      expect(typeof item['@type']).toBe('string')
      expect(emptyFields(item)).toEqual([])
    },
  )

  it('keeps every field of a full input', () => {
    expect(full[0]).toMatchObject({
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://x.y/s?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    })
    expect(full[1]).toMatchObject({
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://x.y/',
        },
        { '@type': 'ListItem', position: 2, name: 'Movies' },
      ],
    })
    expect(full[3]).toMatchObject({
      '@type': 'Article',
      mainEntityOfPage: 'https://x.y/a',
      author: { '@type': 'Person', name: 'Ann', url: 'https://x.y/ann' },
    })
    expect(full[4]).toMatchObject({
      '@type': 'Product',
      brand: { '@type': 'Brand', name: 'Acme' },
      offers: {
        '@type': 'Offer',
        price: '9.5',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.2,
        ratingCount: 10,
        bestRating: 5,
        worstRating: 1,
      },
    })
    expect(full[5]).toMatchObject({
      '@type': 'Movie',
      duration: 'PT2H35M',
      genre: ['Sci-Fi', 'Drama'],
      actor: [
        { '@type': 'Person', name: 'Timothée Chalamet' },
        { '@type': 'Person', name: 'Zendaya' },
      ],
      director: { '@type': 'Person', name: 'Denis Villeneuve' },
      aggregateRating: { ratingValue: 8.1, bestRating: 10 },
    })
    expect(full[6]).toMatchObject({
      '@type': 'Person',
      birthPlace: { '@type': 'Place', name: 'Oslo' },
    })
    expect(full[7]).toMatchObject({
      '@type': 'Event',
      location: { '@type': 'Place', name: 'Hall', address: '1 Street' },
    })
    expect(full[8]).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q?',
          acceptedAnswer: { '@type': 'Answer', text: 'A.' },
        },
      ],
    })
  })

  it('leaves out the fields a minimal input does not give', () => {
    expect(minimal[0]).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Trek',
      url: 'https://x.y',
    })
    expect(minimal[2]).not.toHaveProperty('sameAs')
    expect(minimal[3]).not.toHaveProperty('author')
    expect(minimal[4]).not.toHaveProperty('brand')
    expect(minimal[4]).not.toHaveProperty('offers')
    expect(minimal[5]).not.toHaveProperty('duration')
    expect(minimal[5]).not.toHaveProperty('actor')
    expect(minimal[5]).not.toHaveProperty('aggregateRating')
    expect(minimal[6]).not.toHaveProperty('birthPlace')
    expect(minimal[7]).not.toHaveProperty('location')
  })

  it('drops a rating with no votes', () => {
    const rated = product({
      name: 'Pen',
      url: 'https://x.y/p',
      aggregateRating: { ratingValue: 4.5 },
    })
    expect(rated).not.toHaveProperty('aggregateRating')
  })
})
