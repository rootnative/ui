import { Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { ScrollView, StyleSheet, View } from 'react-native'

const variants = [
  'displayLarge',
  'displayMedium',
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
  'titleLarge',
  'titleMedium',
  'titleSmall',
  'bodyLarge',
  'bodyMedium',
  'bodySmall',
  'labelLarge',
  'labelMedium',
  'labelSmall',
] as const

const toSentenceCase = (value: string) => {
  const normalized = value.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const longText =
  'This is a very long text that demonstrates how the Typography component handles text overflow and truncation in real-world scenarios. It should wrap or truncate based on the configuration.'

export default function TypographyScreen() {
  const theme = useTheme()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Typography variant="headlineSmall">All Variants</Typography>
        {variants.map((variant) => (
          <Typography key={variant} variant={variant}>
            {toSentenceCase(variant)}
          </Typography>
        ))}
      </View>

      <View style={styles.section}>
        <Typography variant="headlineSmall">Single-Line Truncation</Typography>
        <Typography
          variant="titleMedium"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {longText}
        </Typography>
      </View>

      <View style={styles.section}>
        <Typography variant="headlineSmall">Color Overrides</Typography>
        <Typography variant="bodyLarge" style={{ color: theme.colors.primary }}>
          Primary color text
        </Typography>
        <Typography variant="bodyLarge" style={{ color: theme.colors.error }}>
          Error color text
        </Typography>
        <Typography
          variant="bodyLarge"
          style={{ color: theme.colors.tertiary }}
        >
          Tertiary color text
        </Typography>
      </View>

      <View style={styles.section}>
        <Typography variant="headlineSmall">Custom Styles</Typography>
        <Typography variant="bodyMedium" style={styles.italic}>
          Italic text using custom style
        </Typography>
        <Typography variant="bodyMedium" style={styles.underline}>
          Underlined text
        </Typography>
        <Typography variant="bodyMedium" style={styles.uppercase}>
          Uppercase text
        </Typography>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    rowGap: 32,
  },
  section: {
    rowGap: 8,
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
})
