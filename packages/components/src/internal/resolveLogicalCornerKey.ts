import { isRTLDirection } from '@rootnative/utils'
import { Platform } from 'react-native'

export type LogicalCornerKey =
  | 'borderTopStartRadius'
  | 'borderTopEndRadius'
  | 'borderBottomStartRadius'
  | 'borderBottomEndRadius'

type PhysicalCornerKey =
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRightRadius'

const PHYSICAL_CORNER_KEYS: Record<
  LogicalCornerKey,
  readonly [ltr: PhysicalCornerKey, rtl: PhysicalCornerKey]
> = {
  borderTopStartRadius: ['borderTopLeftRadius', 'borderTopRightRadius'],
  borderTopEndRadius: ['borderTopRightRadius', 'borderTopLeftRadius'],
  borderBottomStartRadius: [
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
  ],
  borderBottomEndRadius: ['borderBottomRightRadius', 'borderBottomLeftRadius'],
}

/**
 * The key to write for a logical corner radius: the corner counterpart of
 * `resolveLogicalKey` in `@rootnative/utils`.
 *
 * react-native-web resolves a start or end corner from its locale context,
 * which is LTR under `<html dir="rtl">` too, also in a `StyleSheet.create`
 * style. So on the web this returns the physical key for the document
 * direction. Native returns the logical key, which React Native resolves.
 */
export function resolveLogicalCornerKey(key: LogicalCornerKey): string {
  if (Platform.OS !== 'web') return key
  const [ltr, rtl] = PHYSICAL_CORNER_KEYS[key]
  return isRTLDirection() ? rtl : ltr
}
