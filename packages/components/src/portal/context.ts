import { createContext } from 'react'
import type { PortalStore } from './store'

export const PortalContext = createContext<PortalStore | null>(null)
