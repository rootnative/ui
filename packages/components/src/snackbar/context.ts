import { createContext } from 'react'
import type { SnackbarStore } from './store'

export const SnackbarContext = createContext<SnackbarStore | null>(null)
