import { createContext, useContext } from 'react'
import type { MenuVariant } from './types'

export interface MenuContextValue {
  /** Closes the menu — self-managed state and the consumer's `onDismiss`. */
  dismiss: () => void
  /** Sets the metrics, the colors and the shape of each item. */
  variant: MenuVariant
}

export const MenuContext = createContext<MenuContextValue | null>(null)

export function useMenuContext(component: string): MenuContextValue {
  const value = useContext(MenuContext)
  if (!value) {
    throw new Error(
      `[@rootnative/components] <${component}> must be rendered inside a <Menu>.`,
    )
  }
  return value
}

/**
 * Where an item sits among the items of a vertical menu. The first and the
 * last item round their outer corners. An item that the menu can't place,
 * because it is inside another component, takes the middle shape.
 */
export type MenuItemPlace = 'first' | 'middle' | 'last' | 'alone'

export const MenuItemPlaceContext = createContext<MenuItemPlace>('middle')
