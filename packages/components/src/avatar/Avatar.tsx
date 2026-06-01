import { useIconResolver, useTheme } from '@rootnative/core'
import { blendColor, renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { createStyles } from './styles'
import type { AvatarProps, AvatarSize } from './types'

const ICON_PX: Record<AvatarSize, number> = {
  xSmall: 14,
  small: 18,
  medium: 24,
  large: 32,
  xLarge: 56,
}

const LABEL_FONT_SIZE: Record<AvatarSize, number> = {
  xSmall: 10,
  small: 12,
  medium: 14,
  large: 22,
  xLarge: 36,
}

function getSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: AvatarSize,
) {
  if (size === 'xSmall') return styles.sizeXSmall
  if (size === 'small') return styles.sizeSmall
  if (size === 'large') return styles.sizeLarge
  if (size === 'xLarge') return styles.sizeXLarge
  return styles.sizeMedium
}

export function Avatar({
  imageUri,
  icon,
  label,
  size = 'medium',
  containerColor,
  contentColor,
  style,
  onPress,
  accessibilityLabel,
  ...props
}: AvatarProps) {
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])

  const bgColor = containerColor ?? theme.colors.primaryContainer
  const fgColor = contentColor ?? theme.colors.onPrimaryContainer
  const isInteractive = onPress !== undefined
  const sizeStyle = getSizeStyle(styles, size)
  const iconPx = ICON_PX[size]
  const labelFontSize = LABEL_FONT_SIZE[size]
  const initials = label ? label.slice(0, 2).toUpperCase() : undefined
  const initialsStyle = useMemo(
    () => ({
      color: fgColor,
      fontSize: labelFontSize,
      fontWeight: '500' as const,
    }),
    [fgColor, labelFontSize],
  )

  const containerOverrides = useMemo(
    () => ({
      base: { backgroundColor: bgColor } as ViewStyle,
      hovered: {
        backgroundColor: blendColor(
          bgColor,
          fgColor,
          theme.stateLayer.hoveredOpacity,
        ),
      } as ViewStyle,
      pressed: {
        backgroundColor: blendColor(
          bgColor,
          fgColor,
          theme.stateLayer.pressedOpacity,
        ),
      } as ViewStyle,
    }),
    [bgColor, fgColor, theme.stateLayer],
  )

  const content = imageUri ? (
    <Image source={{ uri: imageUri }} style={styles.image} accessible={false} />
  ) : label && !icon ? (
    <Text style={initialsStyle} numberOfLines={1} allowFontScaling={false}>
      {initials}
    </Text>
  ) : (
    renderIcon(
      icon ?? 'account',
      { size: iconPx, color: fgColor },
      iconResolver,
    )
  )

  if (!isInteractive) {
    return (
      <View
        {...props}
        accessibilityLabel={accessibilityLabel}
        style={[styles.container, sizeStyle, containerOverrides.base, style]}
      >
        {content}
      </View>
    )
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({
        pressed,
        hovered,
      }: {
        pressed: boolean
        hovered?: boolean
      }) => {
        return [
          styles.container,
          sizeStyle,
          containerOverrides.base,
          styles.interactive,
          hovered && !pressed ? containerOverrides.hovered : undefined,
          pressed ? containerOverrides.pressed : undefined,
          style,
        ]
      }}
    >
      {content}
    </Pressable>
  )
}
