import { useContext, useEffect, useId, useRef } from 'react'
import { PortalContext } from './context'
import { DEFAULT_PORTAL_HOST } from './layers'
import type { PortalProps } from './types'

export function Portal({
  children,
  hostName = DEFAULT_PORTAL_HOST,
  priority = 0,
}: PortalProps) {
  const store = useContext(PortalContext)
  const id = useId()
  const warnedRef = useRef(false)

  useEffect(() => {
    if (!store) return
    store.set(id, children, hostName, priority)
  }, [store, id, children, hostName, priority])

  useEffect(() => {
    if (!store) return
    return () => {
      store.remove(id)
    }
  }, [store, id])

  if (!store) {
    if (__DEV__ && !warnedRef.current) {
      warnedRef.current = true
      console.error(
        '[@rootnative/components] <Portal> must be rendered inside a <PortalHost>. ' +
          'Wrap your app root with <PortalHost>. Falling back to inline rendering.',
      )
    }
    return <>{children}</>
  }

  return null
}
