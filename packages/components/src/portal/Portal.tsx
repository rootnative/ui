import { useContext, useEffect, useId, useRef } from 'react'
import { PortalContext } from './context'
import type { PortalProps } from './types'

export function Portal({ children }: PortalProps) {
  const ctx = useContext(PortalContext)
  const id = useId()
  const warnedRef = useRef(false)

  useEffect(() => {
    if (!ctx) return
    ctx.set(id, children)
  }, [ctx, id, children])

  useEffect(() => {
    if (!ctx) return
    return () => {
      ctx.remove(id)
    }
  }, [ctx, id])

  if (!ctx) {
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
