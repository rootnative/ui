import { Card, Column, Icon, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const SIZES = [16, 20, 24, 32, 40, 48]

function IconScreenContent() {
  const theme = useTheme()

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <Column gap="xl" style={styles.container}>
        <ScreenIntro />
        <Column gap="sm">
          <Typography variant="titleMedium">Sizes</Typography>
          <Card variant="outlined">
            <Row p="md" gap="md" align="center" wrap>
              {SIZES.map((size) => (
                <Icon key={size} source="star" size={size} />
              ))}
            </Row>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Colors</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Row gap="md" align="center">
                <Icon source="palette-outline" />
                <Icon source="palette-outline" color={theme.colors.primary} />
                <Icon source="palette-outline" color={theme.colors.secondary} />
                <Icon source="palette-outline" color={theme.colors.tertiary} />
                <Icon source="palette-outline" color={theme.colors.error} />
                <Icon
                  source="palette-outline"
                  color={theme.colors.onSurfaceVariant}
                />
              </Row>
              <Typography variant="bodySmall" style={mutedText}>
                The default is onSurface. Pass any theme color.
              </Typography>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Decorative or labelled</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Row gap="md" align="center">
                <Icon source="check-circle-outline" />
                <Typography variant="bodyMedium">
                  Decorative, next to text that carries the meaning
                </Typography>
              </Row>
              <Row gap="md" align="center">
                <Icon
                  source="wifi-strength-4"
                  accessibilityLabel="Wi-Fi connected"
                />
                <Typography variant="bodyMedium">
                  Labelled, announced as &quot;Wi-Fi connected&quot;
                </Typography>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Render function</Typography>
          <Card variant="outlined">
            <Row p="md" gap="md" align="center">
              <Icon
                size={32}
                source={({ size, color }) => (
                  <Typography
                    variant="labelLarge"
                    style={{ fontSize: size / 2, color }}
                  >
                    RN
                  </Typography>
                )}
              />
              <Typography variant="bodySmall" style={mutedText}>
                A render function receives the resolved size and color.
              </Typography>
            </Row>
          </Card>
        </Column>
        <ScreenNavFooter />
      </Column>
    </ScrollView>
  )
}

export default function IconScreen() {
  return <IconScreenContent />
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  container: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
})
