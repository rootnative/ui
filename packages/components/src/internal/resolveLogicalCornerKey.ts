import { webKeepsPhysicalSides } from '@rootnative/utils'

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

/** The physical key of each logical corner in an RTL layout. */
const RTL_CORNER_KEYS: Record<LogicalCornerKey, PhysicalCornerKey> = {
  borderTopStartRadius: 'borderTopRightRadius',
  borderTopEndRadius: 'borderTopLeftRadius',
  borderBottomStartRadius: 'borderBottomRightRadius',
  borderBottomEndRadius: 'borderBottomLeftRadius',
}

/**
 * The key to write for a logical corner radius: the corner counterpart of
 * `resolveLogicalKey` in `@rootnative/utils`, with the same rule.
 *
 * react-native-web resolves a start or end corner from its locale context,
 * which is LTR under `<html dir="rtl">` too, also in a `StyleSheet.create`
 * style. So there, under an RTL document, this returns the physical key. In
 * each other case it returns the logical key, which keeps the precedence of a
 * later style that sets the same key.
 */
export function resolveLogicalCornerKey(key: LogicalCornerKey): string {
  if (!webKeepsPhysicalSides()) return key
  return RTL_CORNER_KEYS[key]
}
