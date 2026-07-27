import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Card, Column, Divider, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { usePathname, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { I18nManager, StyleSheet, View } from 'react-native'
import type { CatalogEntry } from './catalog'
import { findNeighbors } from './catalog'

interface NavCardProps {
  entry: CatalogEntry
  direction: 'previous' | 'next'
}

function NavCard({ entry, direction }: NavCardProps) {
  const theme = useTheme()
  const router = useRouter()
  const isPrevious = direction === 'previous'
  // MaterialCommunityIcons chevrons are physical, not logical — flip them
  // by hand so "previous" still points backwards under the RTL toggle.
  const pointsLeft = isPrevious !== I18nManager.isRTL
  const icon = pointsLeft ? 'chevron-left' : 'chevron-right'

  const chevron = (
    <MaterialCommunityIcons
      name={icon}
      size={10}
      color={theme.colors.onSurfaceVariant}
    />
  )

  return (
    <Card
      variant="outlined"
      onPress={() => router.navigate(entry.route)}
      accessibilityLabel={`${isPrevious ? 'Previous' : 'Next'}: ${entry.label}`}
      style={styles.card}
    >
      <Row align="center" gap="xs" px="sm" py="sm">
        {isPrevious ? chevron : null}
        <Column flex={1} align={isPrevious ? 'flex-start' : 'flex-end'}>
          <Typography
            variant="labelSmall"
            color={theme.colors.onSurfaceVariant}
          >
            {isPrevious ? 'Previous' : 'Next'}
          </Typography>
          <Typography variant="titleSmall" numberOfLines={1}>
            {entry.label}
          </Typography>
        </Column>
        {isPrevious ? null : chevron}
      </Row>
    </Card>
  )
}

/**
 * Prev/next pair at the foot of a component demo screen, so the catalog can be
 * walked end to end without bouncing off the home screen every time.
 *
 * Takes no props — it resolves the current route against the catalog. Renders
 * nothing on a route that isn't in it.
 */
export function ScreenNavFooter() {
  const pathname = usePathname()
  const { previous, next } = useMemo(() => findNeighbors(pathname), [pathname])

  if (!previous && !next) {
    return null
  }

  return (
    <Column gap="md" style={styles.footer}>
      <Divider />
      <Row gap="sm" align="stretch">
        {previous ? (
          <NavCard entry={previous} direction="previous" />
        ) : (
          <View style={styles.spacer} />
        )}
        {next ? (
          <NavCard entry={next} direction="next" />
        ) : (
          <View style={styles.spacer} />
        )}
      </Row>
    </Column>
  )
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 8,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
})
