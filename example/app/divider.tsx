import {
  Column,
  Divider,
  List,
  ListItem,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

export default function DividerScreen() {
  const theme = useTheme()

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const surfaceBlock = useMemo(
    () => [
      styles.block,
      { backgroundColor: theme.colors.surfaceContainerHighest },
    ],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )
  const listSurface = useMemo(
    () => [
      styles.listSurface,
      { backgroundColor: theme.colors.surfaceContainerLow },
    ],
    [theme],
  )

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <Column gap="xl" style={styles.container}>
        <ScreenIntro />
        {/* Horizontal */}
        <Column gap="sm">
          <Typography variant="titleMedium">Horizontal</Typography>
          <Typography variant="bodySmall" style={mutedText}>
            Full-bleed 1dp rule in `outlineVariant`.
          </Typography>
          <Divider />
        </Column>

        {/* Insets */}
        <Column gap="sm">
          <Typography variant="titleMedium">Insets</Typography>
          <Typography variant="bodySmall" style={mutedText}>
            `inset` insets the leading edge, `insetEnd` the trailing edge. Both
            accept a number in dp; `inset` also accepts `true` for the MD3 list
            inset (56dp).
          </Typography>
          <Column gap="md">
            <Column gap="xs">
              <Typography variant="labelSmall" style={mutedText}>
                inset
              </Typography>
              <Divider inset />
            </Column>
            <Column gap="xs">
              <Typography variant="labelSmall" style={mutedText}>
                {'inset={16}'}
              </Typography>
              <Divider inset={16} />
            </Column>
            <Column gap="xs">
              <Typography variant="labelSmall" style={mutedText}>
                {'inset={16} insetEnd={16}'}
              </Typography>
              <Divider inset={16} insetEnd={16} />
            </Column>
          </Column>
        </Column>

        {/* Vertical */}
        <Column gap="sm">
          <Typography variant="titleMedium">Vertical</Typography>
          <Typography variant="bodySmall" style={mutedText}>
            Stretches to the height of its row, so the parent controls the
            length.
          </Typography>
          <Row align="center" style={styles.verticalRow}>
            <View style={surfaceBlock} />
            <Divider orientation="vertical" />
            <View style={surfaceBlock} />
            <Divider orientation="vertical" inset={8} insetEnd={8} />
            <View style={surfaceBlock} />
          </Row>
        </Column>

        {/* Thickness */}
        <Column gap="sm">
          <Typography variant="titleMedium">Thickness</Typography>
          <Column gap="md">
            <Divider />
            <Divider thickness={2} />
            <Divider thickness={4} />
          </Column>
        </Column>

        {/* Color override */}
        <Column gap="sm">
          <Typography variant="titleMedium">Color override</Typography>
          <Column gap="md">
            <Divider containerColor={theme.colors.primary} thickness={2} />
            <Divider containerColor={theme.colors.error} thickness={2} />
            <Divider containerColor={theme.colors.outline} thickness={2} />
          </Column>
        </Column>

        {/* In a list */}
        <Column gap="sm">
          <Typography variant="titleMedium">Separating list items</Typography>
          <View style={listSurface}>
            <List>
              <ListItem headlineText="Photos" supportingText="248 items" />
              <Divider inset />
              <ListItem headlineText="Videos" supportingText="12 items" />
              <Divider inset />
              <ListItem headlineText="Documents" supportingText="61 items" />
            </List>
          </View>
        </Column>
        <ScreenNavFooter />
      </Column>
    </ScrollView>
  )
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
  verticalRow: {
    height: 56,
  },
  block: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  listSurface: {
    borderRadius: 12,
    overflow: 'hidden',
  },
})
