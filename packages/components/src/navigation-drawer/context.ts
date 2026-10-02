import { createContext, useContext } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import type { NavigationDrawerColors } from './styles'

export interface NavigationDrawerContextValue {
  /** Value of the active destination, if any. */
  selected: string | undefined
  /** Selects a destination: updates uncontrolled state and notifies. */
  select: (value: string) => void
  colors: NavigationDrawerColors
  labelStyle?: StyleProp<TextStyle>
}

export const NavigationDrawerContext =
  createContext<NavigationDrawerContextValue | null>(null)

export function useNavigationDrawerContext(
  component: string,
): NavigationDrawerContextValue {
  const value = useContext(NavigationDrawerContext)
  if (!value) {
    throw new Error(
      `[@rootnative/components] <${component}> must be rendered inside a <NavigationDrawer>.`,
    )
  }
  return value
}
