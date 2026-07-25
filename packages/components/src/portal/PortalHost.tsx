import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import { PortalContext } from './context'
import { DEFAULT_PORTAL_HOST } from './layers'
import { PortalStore } from './store'
import { styles } from './styles'
import type { PortalHostProps } from './types'

interface PortalOutletProps {
  store: PortalStore
  hostName: string
  style?: StyleProp<ViewStyle>
}

/**
 * Renders one host's bucket. Subscribing here rather than in the host keeps
 * an overlay opening or closing from re-rendering the host's children.
 */
function PortalOutlet({ store, hostName, style }: PortalOutletProps) {
  const subscribe = useCallback(
    (onChange: () => void) => store.subscribe(hostName, onChange),
    [store, hostName],
  )
  const getSnapshot = useCallback(
    () => store.getSnapshot(hostName),
    [store, hostName],
  )
  const records = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  if (records.length === 0) return null

  return (
    <View
      style={[styles.overlay, style]}
      pointerEvents="box-none"
      collapsable={false}
    >
      {records.map((record) => (
        <View
          key={record.id}
          style={styles.overlay}
          pointerEvents="box-none"
          collapsable={false}
        >
          {record.node}
        </View>
      ))}
    </View>
  )
}

function RootPortalHost({ children, name, style }: PortalHostProps) {
  const store = useMemo(() => new PortalStore(), [])
  const warnedRef = useRef(false)

  if (
    __DEV__ &&
    name !== undefined &&
    name !== DEFAULT_PORTAL_HOST &&
    !warnedRef.current
  ) {
    warnedRef.current = true
    console.error(
      `[@rootnative/components] <PortalHost name="${name}"> has no enclosing ` +
        '<PortalHost>, so it is acting as the root host and the name is ' +
        'ignored. Named hosts must be rendered inside a root <PortalHost>.',
    )
  }

  return (
    <PortalContext.Provider value={store}>
      <View style={[styles.root, style]} collapsable={false}>
        {children}
        <PortalOutlet store={store} hostName={DEFAULT_PORTAL_HOST} />
      </View>
    </PortalContext.Provider>
  )
}

interface NamedPortalHostProps extends PortalHostProps {
  name: string
  store: PortalStore
}

function NamedPortalHost({
  children,
  name,
  store,
  style,
}: NamedPortalHostProps) {
  useEffect(() => {
    store.registerHost(name)
    return () => store.unregisterHost(name)
  }, [store, name])

  return (
    <>
      {children}
      <PortalOutlet store={store} hostName={name} style={style} />
    </>
  )
}

export function PortalHost(props: PortalHostProps) {
  const parentStore = useContext(PortalContext)

  if (props.name !== undefined && parentStore) {
    return <NamedPortalHost {...props} name={props.name} store={parentStore} />
  }

  return <RootPortalHost {...props} />
}
