import { Box, Column, Typography, Card } from '@rootnative/components'
import { ThemeProvider, useTheme } from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'

function HomeScreen() {
  const theme = useTheme()

  return (
    <Box
      flex={1}
      align="center"
      justify="center"
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Column gap="lg" style={styles.content}>
        <Column gap="sm">
          <Typography variant="headlineMedium">
            Welcome to RootNative
          </Typography>
          <Typography
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Material Design 3 components for React Native
          </Typography>
        </Column>

        <Card variant="filled">
          <Column px="lg" py="lg" gap="md">
            <Typography variant="titleMedium">Get Started</Typography>
            <Typography
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Edit App.tsx to start building your app.
            </Typography>
          </Column>
        </Card>
      </Column>
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <HomeScreen />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
})
