import { AppBar, Box, Typography, Column } from '@rootnative/components'
import type {
  AppBarAction,
  AppBarColorScheme,
  AppBarVariant,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Motion, useScroll } from '@rootnative/inertia'
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

function CollapseDemo({ variant }: { variant: 'medium' | 'large' }) {
  const { scrollY, onScroll } = useScroll()

  return (
    <>
      <AppBar
        title={variant === 'large' ? 'Large App Bar' : 'Medium App Bar'}
        variant={variant}
        canGoBack
        actions={actions}
        scrollOffset={scrollY}
      />
      <Motion.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
        style={styles.collapseScroll}
        contentContainerStyle={styles.collapseScrollContent}
      >
        {Array.from({ length: 16 }, (_, index) => (
          <Typography key={index} variant="bodyMedium">
            Scroll content row {index + 1}
          </Typography>
        ))}
      </Motion.ScrollView>
    </>
  )
}

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
        <Typography variant="titleSmall">Collapse on Scroll</Typography>
        <Typography variant="bodySmall">
          Medium and large bars collapse to the small form as the content
          scrolls, driven by `scrollOffset` from inertia&apos;s useScroll().
        </Typography>
        <Column gap="md">
          {(['medium', 'large'] as const).map((variant) => (
            <Column key={`collapse-${variant}`} gap="sm">
              <Typography variant="labelMedium">
                {variant === 'large' ? 'Large' : 'Medium'}
              </Typography>
              <Box style={[previewStyle, styles.collapseFrame]}>
                <CollapseDemo variant={variant} />
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
  collapseFrame: {
    height: 320,
  },
  collapseScroll: {
    flex: 1,
  },
  collapseScrollContent: {
    padding: 16,
    rowGap: 16,
  },
})
