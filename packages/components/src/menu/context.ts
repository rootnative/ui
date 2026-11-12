import { createContext, useContext } from 'react'
import type { MenuVariant } from './types'

export interface MenuContextValue {
  /** Closes the menu — self-managed state and the consumer's `onDismiss`. */
  dismiss: () => void
  /** Sets the metrics, the colors and the shape of each item. */
  variant: MenuVariant
  /** The `containerColor` of the menu, which a group surface takes too. */
  containerColor: string | undefined
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
 * Where an item sits among the items of its group, or a group among the
 * groups of a vertical menu. The first and the last round their outer corners.
 */
export type MenuPlace = 'first' | 'middle' | 'last' | 'alone'

/**
 * An item that the menu can't place, because it is inside another component,
 * takes the middle shape.
 */
export const MenuItemPlaceContext = createContext<MenuPlace>('middle')

/**
 * The place of a group that draws its own surface. `null` when the menu
 * surface draws the group: the menu has one group, or the menu can't see the
 * group because it is inside another component.
 */
export const MenuGroupPlaceContext = createContext<MenuPlace | null>(null)
