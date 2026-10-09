import { Children } from 'react'
import type { ReactNode } from 'react'

/**
 * The text of `children` when every child is a string or a number, or
 * `undefined` when a child is an element or there is no child.
 *
 * JSX text with an expression, such as `Score: {score}`, compiles to an array
 * of parts, not to one string. A test for one string sends that array into a
 * `View`, and React Native refuses a raw string outside a `Text`.
 */
export function plainTextOf(children: ReactNode): string | undefined {
  const parts = Children.toArray(children)
  if (parts.length === 0) return undefined
  const isText = parts.every(
    (part) => typeof part === 'string' || typeof part === 'number',
  )
  return isText ? parts.join('') : undefined
}
