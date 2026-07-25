import { createContext, useContext } from 'react'

export interface MenuContextValue {
  /** Closes the menu — self-managed state and the consumer's `onDismiss`. */
  dismiss: () => void
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
