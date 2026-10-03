/**
 * Builds the text for an image: `imageLabel('Poster', 'Dune')` gives
 * `'Dune poster'`. Set the result as both `alt` and `accessibilityLabel` on
 * `expo-image`, because the web `alt` attribute comes from
 * `accessibilityLabel`. The React Native `Image` reads `alt` on its own.
 */
export function imageLabel(kind: string, subject?: string | null): string {
  const noun = kind.trim()
  const name = subject?.trim()
  if (!name) return noun
  if (!noun) return name
  return `${name} ${noun.charAt(0).toLowerCase()}${noun.slice(1)}`
}
