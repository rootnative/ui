import { createContext, useContext } from 'react'
import type { DialogVariant } from './types'

export interface DialogContextValue {
  variant: DialogVariant
  /** True when a `Dialog.Icon` is present — MD3 centers the headline then. */
  hasIcon: boolean
  /** True when the slot is the last one before the actions row. */
  contentIsFlush: boolean
}

export const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialogContext(slot: string): DialogContextValue {
  const value = useContext(DialogContext)
  if (!value) {
    throw new Error(
      `[@rootnative/components] <${slot}> must be rendered inside a <Dialog>.`,
    )
  }
  return value
}
