import { useContext } from 'react'
import { IconResolverContext } from './IconResolverContext'
import type { IconResolver } from './IconResolverContext'

/**
 * Returns the icon resolver registered on the nearest `ThemeProvider`,
 * or `null` if none was provided. A string icon renders nothing and logs one
 * warning when no resolver is set.
 */
export function useIconResolver(): IconResolver | null {
  return useContext(IconResolverContext)
}
