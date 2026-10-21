import { ThemeScopeProvider, useThemeScope } from '@rootnative/core'
import { useContext, useEffect, useId } from 'react'
import { warnOnce } from '../internal/warnOnce'
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
  // The host is usually above a nested `ThemeProvider`, so the content would
  // read the root theme there. Carry the providers of the call site with it.
  const scope = useThemeScope()
  useEffect(() => {
    if (!store) return
    store.set(
      id,
      <ThemeScopeProvider scope={scope}>{children}</ThemeScopeProvider>,
      hostName,
      priority,
    )
  }, [store, id, children, hostName, priority, scope])

  useEffect(() => {
    if (!store) return
    return () => {
      store.remove(id)
    }
  }, [store, id])

  if (!store) {
    warnOnce(
      'portal-without-host',
      '[@rootnative/components] <Portal> must be rendered inside a <PortalHost>. ' +
        'Wrap your app root with <PortalHost>. Falling back to inline rendering.',
    )
    return <>{children}</>
  }

  return null
}
