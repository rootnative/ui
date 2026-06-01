import { AppBar, Box, Typography, Column } from '@rootnative/components'
import type {
  AppBarAction,
  AppBarColorScheme,
  AppBarVariant,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

const variants: Array<{
  key: AppBarVariant
  label: string
  variant: AppBarVariant
  title: string
}> = [
  {
    key: 'small',
    label: 'Small',
    variant: 'small',
    title: 'Small App Bar',
  },
  {
    key: 'center-aligned',
    label: 'Center Aligned',
    variant: 'center-aligned',
    title: 'Centered App Bar',
  },
  {
    key: 'medium',
    label: 'Medium',
    variant: 'medium',
    title: 'Medium App Bar',
  },
  {
    key: 'large',
    label: 'Large',
    variant: 'large',
    title: 'Large App Bar',
  },
]

const colorSchemes: Array<{
  key: AppBarColorScheme
  label: string
}> = [
  { key: 'surface', label: 'Surface (default)' },
  { key: 'surfaceContainerLowest', label: 'Surface Container Lowest' },
  { key: 'surfaceContainerLow', label: 'Surface Container Low' },
  { key: 'surfaceContainer', label: 'Surface Container' },
  { key: 'surfaceContainerHigh', label: 'Surface Container High' },
  { key: 'surfaceContainerHighest', label: 'Surface Container Highest' },
  { key: 'primary', label: 'Primary' },
  { key: 'primaryContainer', label: 'Primary Container' },
]

const longTitle = 'Very Long App Bar Title That Should Truncate Properly'
const actions: AppBarAction[] = [
  {
    icon: 'magnify',
    accessibilityLabel: 'Search',
  },
  {
    icon: 'dots-vertical',
    accessibilityLabel: 'More options',
  },
]

export default function AppBarScreen() {
  const router = useRouter()
  const theme = useTheme()
  const previewStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.shape.cornerMedium,
      overflow: 'hidden' as const,
    }),
    [theme.colors.outlineVariant, theme.shape.cornerMedium],
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">AppBar Showcase</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Variants</Typography>
        <Column gap="md">
          {variants.map((item) => (
            <Column key={`base-${item.key}`} gap="sm">
              <Typography variant="labelMedium">{item.label}</Typography>
              <Box style={previewStyle}>
                <AppBar
                  title={item.title}
                  variant={item.variant}
                  actions={actions}
                />
              </Box>
            </Column>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">With Back Button</Typography>
        <Column gap="md">
          {variants.map((item) => (
            <Column key={`back-${item.key}`} gap="sm">
              <Typography variant="labelMedium">{item.label}</Typography>
              <Box style={previewStyle}>
                <AppBar
                  title={item.title}
                  variant={item.variant}
                  canGoBack
                  actions={actions}
                  onBackPress={() => router.back()}
                />
              </Box>
            </Column>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Elevated</Typography>
        <Column gap="md">
          {variants.map((item) => (
            <Column key={`elevated-${item.key}`} gap="sm">
              <Typography variant="labelMedium">{item.label}</Typography>
              <Box style={previewStyle}>
                <AppBar
                  title={item.title}
                  variant={item.variant}
                  elevated
                  canGoBack
                  actions={actions}
                  onBackPress={() => router.back()}
                />
              </Box>
            </Column>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Color Schemes</Typography>
        <Column gap="md">
          {colorSchemes.map((scheme) => (
            <Column key={scheme.key} gap="sm">
              <Typography variant="labelMedium">{scheme.label}</Typography>
              <Box style={previewStyle}>
                <AppBar
                  title={scheme.label}
                  colorScheme={scheme.key}
                  canGoBack
                  actions={actions}
                  onBackPress={() => router.back()}
                />
              </Box>
            </Column>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Long Title</Typography>
        <Column gap="md">
          {variants.map((item) => (
            <Column key={`long-${item.key}`} gap="sm">
              <Typography variant="labelMedium">{item.label}</Typography>
              <Box style={previewStyle}>
                <AppBar
                  title={longTitle}
                  variant={item.variant}
                  canGoBack
                  actions={actions}
                  onBackPress={() => router.back()}
                />
              </Box>
            </Column>
          ))}
        </Column>
      </Column>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    rowGap: 20,
  },
})
