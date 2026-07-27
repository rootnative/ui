import { Platform } from 'react-native'

/**
 * Whether a copy-to-clipboard button can do anything on this platform.
 *
 * Web only, on purpose: the example app avoids an `expo-clipboard` dependency
 * (it would land in the lockfile and in the web export embedded on the docs
 * homepage), and React Native's core `Clipboard` is deprecated. On native the
 * command text is rendered `selectable` instead, so a long press offers the
 * platform's own Copy action.
 */
export function canCopy(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  )
}

/** Copy `text` to the system clipboard. Resolves `false` when unsupported. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!canCopy()) {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Denied permission, insecure context, etc. — leave the button unchanged.
    return false
  }
}
