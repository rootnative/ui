import { Card, Typography, Column } from '@rootnative/components'
import { Alert, ScrollView, StyleSheet } from 'react-native'

const variants = ['elevated', 'filled', 'outlined'] as const

export default function CardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Card Showcase</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Variants</Typography>
        <Column gap="sm">
          {variants.map((variant) => (
            <Card key={variant} variant={variant}>
              <Column p="md" gap="sm">
                <Typography variant="titleMedium">{variant}</Typography>
                <Typography variant="bodyMedium">
                  This is a non-interactive {variant} card.
                </Typography>
              </Column>
            </Card>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Interactive Variants</Typography>
        <Column gap="sm">
          {variants.map((variant) => (
            <Card
              key={`interactive-${variant}`}
              variant={variant}
              onPress={() => Alert.alert(`${variant} card pressed`)}
            >
              <Column p="md" gap="sm">
                <Typography variant="titleMedium">{variant}</Typography>
                <Typography variant="bodyMedium">
                  Tap this interactive {variant} card.
                </Typography>
              </Column>
            </Card>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled Variants</Typography>
        <Column gap="sm">
          {variants.map((variant) => (
            <Card
              key={`disabled-${variant}`}
              variant={variant}
              onPress={() => {}}
              disabled
            >
              <Column p="md" gap="sm">
                <Typography variant="titleMedium">{variant}</Typography>
                <Typography variant="bodyMedium">
                  Disabled {variant} card.
                </Typography>
              </Column>
            </Card>
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
