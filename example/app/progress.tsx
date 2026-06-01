import {
  CircularProgress,
  Column,
  LinearProgress,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export default function ProgressScreen() {
  const theme = useTheme()
  const [value, setValue] = useState(0.25)

  // Auto-advance demo for showing the determinate animation transitions.
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => (v >= 1 ? 0 : Math.min(1, v + 0.07)))
    }, 600)
    return () => clearInterval(id)
  }, [])

  const captionStyle = { color: theme.colors.onSurfaceVariant }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Progress</Typography>

      <Column gap="md">
        <Typography variant="titleSmall">Linear — determinate</Typography>
        <LinearProgress progress={value} />
        <Typography variant="bodySmall" style={captionStyle}>
          {Math.round(value * 100)}%
        </Typography>
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Linear — fixed values</Typography>
        <LinearProgress progress={0} />
        <LinearProgress progress={0.35} />
        <LinearProgress progress={0.7} />
        <LinearProgress progress={1} />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Linear — indeterminate</Typography>
        <LinearProgress />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Linear — no stop indicator</Typography>
        <LinearProgress progress={value} stopIndicator={false} />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Linear — custom thickness</Typography>
        <LinearProgress progress={value} thickness={8} />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Linear — custom colors</Typography>
        <LinearProgress
          progress={value}
          containerColor="#2E7D32"
          trackColor="#C8E6C9"
        />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Circular — determinate</Typography>
        <Row gap="lg" align="center">
          <CircularProgress progress={value} />
          <Typography variant="bodySmall" style={captionStyle}>
            {Math.round(value * 100)}%
          </Typography>
        </Row>
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Circular — sizes</Typography>
        <Row gap="lg" align="center">
          <CircularProgress progress={value} size={24} thickness={3} />
          <CircularProgress progress={value} size={40} />
          <CircularProgress progress={value} size={56} thickness={5} />
          <CircularProgress progress={value} size={72} thickness={6} />
        </Row>
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Circular — indeterminate</Typography>
        <Row gap="lg" align="center">
          <CircularProgress size={24} thickness={3} />
          <CircularProgress />
          <CircularProgress size={56} thickness={5} />
        </Row>
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Circular — custom colors</Typography>
        <Row gap="lg" align="center">
          <CircularProgress
            progress={value}
            containerColor="#D32F2F"
            trackColor="#FFCDD2"
          />
          <CircularProgress containerColor="#1976D2" trackColor="#BBDEFB" />
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
