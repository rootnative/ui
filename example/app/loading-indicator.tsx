import {
  Column,
  LoadingIndicator,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export default function LoadingIndicatorScreen() {
  const theme = useTheme()
  const [value, setValue] = useState(0)

  // Auto-advance demo for the determinate morph (circle → soft burst).
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => (v >= 1 ? 0 : Math.min(1, v + 0.05)))
    }, 300)
    return () => clearInterval(id)
  }, [])

  const captionStyle = { color: theme.colors.onSurfaceVariant }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Loading Indicator</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Indeterminate</Typography>
        <Row gap="lg" align="center">
          <Column align="center" gap="xs">
            <LoadingIndicator accessibilityLabel="Loading" />
            <Typography variant="labelSmall" style={captionStyle}>
              Uncontained
            </Typography>
          </Column>
          <Column align="center" gap="xs">
            <LoadingIndicator contained accessibilityLabel="Loading" />
            <Typography variant="labelSmall" style={captionStyle}>
              Contained
            </Typography>
          </Column>
          <Column align="center" gap="xs">
            <LoadingIndicator size={72} accessibilityLabel="Loading" />
            <Typography variant="labelSmall" style={captionStyle}>
              72dp
            </Typography>
          </Column>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Determinate</Typography>
        <Row gap="lg" align="center">
          <Column align="center" gap="xs">
            <LoadingIndicator
              progress={value}
              accessibilityLabel="Loading progress"
            />
            <Typography variant="labelSmall" style={captionStyle}>
              {`${Math.round(value * 100)}%`}
            </Typography>
          </Column>
          <Column align="center" gap="xs">
            <LoadingIndicator
              contained
              progress={value}
              accessibilityLabel="Loading progress"
            />
            <Typography variant="labelSmall" style={captionStyle}>
              Contained
            </Typography>
          </Column>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Color</Typography>
        <Row gap="lg" align="center">
          <LoadingIndicator
            indicatorColor="#00796B"
            accessibilityLabel="Loading"
          />
          <LoadingIndicator
            contained
            indicatorColor="#FFFFFF"
            containerColor="#B00020"
            accessibilityLabel="Loading"
          />
        </Row>
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
