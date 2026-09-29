import { useBreakpoint, useTheme, useWindowDimensions } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, Platform, Pressable, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'
import { Divider } from '../divider'
import { IconButton } from '../icon-button'
import { pointerEvents } from '../internal/pointerEvents'
import { useFocusTrap } from '../internal/useFocusTrap'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { SafeAreaView } from '../safe-area'
import { SEARCH_VIEW_SLIDE, createStyles } from './styles'
import type { SearchViewProps } from './types'

type SubmitHandler = NonNullable<TextInputProps['onSubmitEditing']>

/** Where a docked view sits, in layer coordinates. */
interface DockedFrame {
  top: number
  left: number
  width: number
}

function sameFrame(a: DockedFrame | null, b: DockedFrame): boolean {
  return (
    a !== null && a.top === b.top && a.left === b.left && a.width === b.width
  )
}

const DOCKED_MAX_HEIGHT_FRACTION = 2 / 3

export function SearchView({
  visible,
  onDismiss,
  layout = 'auto',
  anchor,
  value,
  defaultValue,
  onChangeText,
  placeholder,
  placeholderTextColor,
  onSearch,
  backIcon = 'arrow-left',
  backAccessibilityLabel = 'Back',
  showClearButton = true,
  clearButtonAccessibilityLabel = 'Clear search',
  onClear,
  actions,
  dismissAccessibilityLabel = 'Close search',
  containerColor,
  contentColor,
  inputStyle,
  style,
  inputProps,
  ref,
  children,
  accessibilityLabel,
  role,
  testID,
  ...rest
}: SearchViewProps) {
  const theme = useTheme()
  const breakpoint = useBreakpoint()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const { colors, styles } = useMemo(
    () => createStyles(theme, containerColor),
    [theme, containerColor],
  )

  const docked =
    layout === 'docked' || (layout === 'auto' && breakpoint !== 'compact')

  const [internalValue, setInternalValue] = useState(
    () => value ?? defaultValue ?? '',
  )
  const inputRef = useRef<TextInput | null>(null)
  const setInputRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const hasValue = currentValue !== ''

  const handleChangeText = useCallback(
    (text: string) => {
      if (!isControlled) setInternalValue(text)
      onChangeText?.(text)
    },
    [isControlled, onChangeText],
  )

  const onSubmitEditing = inputProps?.onSubmitEditing
  const handleSubmit = useCallback<SubmitHandler>(
    (event) => {
      onSubmitEditing?.(event)
      onSearch?.(currentValue)
    },
    [currentValue, onSearch, onSubmitEditing],
  )

  const handleClear = useCallback(() => {
    // An uncontrolled input holds its own text, so it must be cleared
    // directly. `clear()` fires no `onChangeText`, so the call below does.
    if (!isControlled) {
      setInternalValue('')
      inputRef.current?.clear()
    }
    onChangeText?.('')
    onClear?.()
    inputRef.current?.focus()
  }, [isControlled, onChangeText, onClear])

  // Web keyboard containment: focus enters the input on open, Tab cycles
  // inside the view, Escape closes it, and focus returns to the trigger on
  // close. No-op on native, where `accessibilityViewIsModal` does the job.
  const surfaceRef = useFocusTrap({
    active: visible,
    onEscape: onDismiss,
    initialFocus: inputRef,
  })

  // Android hardware back closes the view before it pops the navigation
  // stack.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss()
        return true
      },
    )
    return () => subscription.remove()
  }, [visible, onDismiss])

  // A docked view with an anchor opens over it: same left edge, same top
  // edge, same width, so the header covers the bar. Both are measured in
  // window coordinates, and the layer's origin is subtracted, because a
  // `PortalHost` below an app bar does not start at the window origin.
  const layerRef = useRef<View | null>(null)
  const needsAnchor = docked && anchor !== undefined
  const [frame, setFrame] = useState<DockedFrame | null>(null)

  // Read inside `measure` rather than captured, so the layer's `onLayout`
  // keeps one callback identity across renders.
  const anchorRef = useRef(anchor)
  useEffect(() => {
    anchorRef.current = anchor
  })

  const measure = useCallback(() => {
    const anchorNode = anchorRef.current?.current
    if (!anchorNode) return
    anchorNode.measureInWindow((ax, ay, aw) => {
      // A view measured mid-layout reports NaN on Android. Skipping the
      // frame is right: another measure follows once layout settles.
      if (Number.isNaN(ax) || Number.isNaN(ay)) return
      const apply = (lx: number, ly: number) => {
        const next = { top: ay - ly, left: ax - lx, width: aw }
        setFrame((prev) => (sameFrame(prev, next) ? prev : next))
      }
      const layerNode = layerRef.current
      if (layerNode) {
        layerNode.measureInWindow((lx, ly) => {
          if (Number.isNaN(lx) || Number.isNaN(ly)) return
          apply(lx, ly)
        })
      } else {
        apply(0, 0)
      }
    })
  }, [])

  // Re-measures on open and on rotation / window resize. The layer mounts in
  // a later commit through the portal, so its `onLayout` measures again.
  useEffect(() => {
    if (!visible || !needsAnchor) return
    measure()
  }, [visible, needsAnchor, measure, windowWidth, windowHeight])

  useEffect(() => {
    if (visible) return
    // Deliberate and terminal: dropping the frame on close is what makes the
    // next open wait for a fresh measurement instead of flashing at the
    // previous position. It runs once per close and sets a value that cannot
    // re-trigger it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrame(null)
  }, [visible])

  const leadingIconColor = contentColor ?? colors.leadingIcon
  const trailingIconColor = contentColor ?? colors.trailingIcon

  const inputContentColor = useMemo(
    () => (contentColor ? { color: contentColor } : undefined),
    [contentColor],
  )
  const inputStyleArr = useMemo(
    () => [styles.input, inputContentColor, inputStyle],
    [styles.input, inputContentColor, inputStyle],
  )
  const dockedMaxHeight = useMemo(
    () =>
      windowHeight > 0
        ? { maxHeight: Math.round(windowHeight * DOCKED_MAX_HEIGHT_FRACTION) }
        : undefined,
    [windowHeight],
  )
  const dockedSurfaceStyle = useMemo(
    () => [styles.dockedSurface, dockedMaxHeight, style],
    [styles.dockedSurface, dockedMaxHeight, style],
  )
  const fullscreenSurfaceStyle = useMemo(
    () => [styles.fullscreenSurface, style],
    [styles.fullscreenSurface, style],
  )
  const anchoredFrameStyle = useMemo(
    () =>
      frame === null
        ? null
        : {
            position: 'absolute' as const,
            top: frame.top,
            left: frame.left,
            width: frame.width,
          },
    [frame],
  )
  const dockedLayerStyle = useMemo(
    () => [styles.dockedLayer, pointerEvents.boxNone],
    [styles.dockedLayer],
  )
  const fullscreenDismissStyle = useMemo(
    () => [styles.dismissArea, pointerEvents.none],
    [styles.dismissArea],
  )

  const header = (
    // `accessibilityRole`, not `role`: RN's `Role` union has no `search`
    // landmark, and react-native-web renders this one as `role="search"`.
    <View accessibilityRole="search" style={styles.header}>
      <View style={styles.slot}>
        <IconButton
          icon={backIcon}
          size="s"
          variant="standard"
          iconColor={leadingIconColor}
          accessibilityLabel={backAccessibilityLabel}
          onPress={onDismiss}
        />
      </View>
      <TextInput
        {...inputProps}
        ref={setInputRef}
        value={value}
        defaultValue={isControlled ? undefined : internalValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor ?? colors.placeholder}
        cursorColor={inputProps?.cursorColor ?? theme.colors.primary}
        selectionColor={inputProps?.selectionColor ?? theme.colors.primary}
        returnKeyType={inputProps?.returnKeyType ?? 'search'}
        role={inputProps?.role ?? 'searchbox'}
        accessibilityLabel={inputProps?.accessibilityLabel ?? placeholder}
        // On web the focus trap moves focus into the input on entry. An
        // `autoFocus` there would take focus before the trap records the
        // trigger, so the trap could not return focus to it on close.
        autoFocus={Platform.OS !== 'web'}
        style={inputStyleArr}
      />
      {showClearButton && hasValue ? (
        <View style={styles.slot}>
          <IconButton
            icon="close"
            size="s"
            variant="standard"
            iconColor={trailingIconColor}
            accessibilityLabel={clearButtonAccessibilityLabel}
            onPress={handleClear}
          />
        </View>
      ) : null}
      {actions?.map((action, index) => (
        <View key={`${action.accessibilityLabel}-${index}`} style={styles.slot}>
          <IconButton
            icon={action.icon}
            size="s"
            variant="standard"
            iconColor={trailingIconColor}
            accessibilityLabel={action.accessibilityLabel}
            onPress={action.onPress}
            disabled={action.disabled}
          />
        </View>
      ))}
    </View>
  )

  const surfaceProps = {
    ...rest,
    ref: surfaceRef,
    testID,
    // The view is modal on both layouts: a docked view closes on a press
    // outside it, so nothing behind it is reachable while it is open.
    role: role ?? ('dialog' as const),
    'aria-modal': true,
    accessibilityViewIsModal: true,
    accessibilityLabel: accessibilityLabel ?? placeholder,
  }

  const content = (
    <>
      {header}
      <Divider containerColor={colors.divider} />
      <View
        style={docked ? styles.dockedBody : styles.fullscreenBody}
        testID={testID === undefined ? undefined : `${testID}-body`}
      >
        {children}
      </View>
    </>
  )

  const surface = docked ? (
    <View {...surfaceProps} style={dockedSurfaceStyle}>
      {content}
    </View>
  ) : (
    <SafeAreaView
      {...surfaceProps}
      edges={['top', 'bottom']}
      style={fullscreenSurfaceStyle}
    >
      {content}
    </SafeAreaView>
  )

  const surfaceReady = !needsAnchor || anchoredFrameStyle !== null

  return (
    <Portal priority={PORTAL_LAYERS.dialog}>
      <Presence>
        {visible ? (
          <Motion.View
            key="layer"
            style={styles.layer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition="spring-fast-effects"
          >
            {docked ? (
              <Pressable
                ref={layerRef}
                onLayout={measure}
                style={styles.dismissArea}
                onPress={onDismiss}
                accessibilityLabel={dismissAccessibilityLabel}
                role="button"
                testID={testID === undefined ? undefined : `${testID}-dismiss`}
              />
            ) : (
              <View ref={layerRef} style={fullscreenDismissStyle} />
            )}
          </Motion.View>
        ) : null}

        {visible && surfaceReady ? (
          <Motion.View
            key="surface"
            // The entrance animates on this layer, not on the surface the
            // `testID` prop lands on, so it needs its own handle for tests.
            testID={testID === undefined ? undefined : `${testID}-layer`}
            style={
              docked
                ? (anchoredFrameStyle ?? dockedLayerStyle)
                : styles.fullscreenLayer
            }
            // MD3 expands the view out of the bar. A 24dp rise with a fade
            // reads the same at spring speed, on both layouts.
            initial={{ opacity: 0, translateY: -SEARCH_VIEW_SLIDE }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -SEARCH_VIEW_SLIDE }}
            transition="spring-default-spatial"
          >
            {docked && anchoredFrameStyle === null ? (
              <SafeAreaView edges={['top']} style={styles.dockedFallback}>
                {surface}
              </SafeAreaView>
            ) : (
              surface
            )}
          </Motion.View>
        ) : null}
      </Presence>
    </Portal>
  )
}
