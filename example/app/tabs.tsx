import {
  Card,
  Column,
  Tabs,
  Typography,
  type TabItem,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const SECTIONS: TabItem[] = [
  { value: 'flights', label: 'Flights' },
  { value: 'trips', label: 'Trips' },
  { value: 'explore', label: 'Explore' },
]

const WITH_ICONS: TabItem[] = [
  { value: 'flights', label: 'Flights', icon: 'airplane' },
  { value: 'hotels', label: 'Hotels', icon: 'bed-outline' },
  { value: 'cars', label: 'Cars', icon: 'car-outline' },
]

const MANY: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'questions', label: 'Questions' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'returns', label: 'Returns' },
]

const PANELS: Record<string, string> = {
  flights: 'Two seats left at this price.',
  trips: 'Nothing booked yet.',
  explore: 'Places you might like.',
}

function TabsScreenContent() {
  const theme = useTheme()
  const [section, setSection] = useState('flights')
  const [scrollableSection, setScrollableSection] = useState('reviews')

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
          <Typography variant="titleMedium">Primary</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Tabs
                items={SECTIONS}
                value={section}
                onValueChange={setSection}
              />
              <Column p="md" gap="xs">
                <Typography variant="bodyMedium">{PANELS[section]}</Typography>
                <Typography variant="bodySmall" style={mutedText}>
                  Tabs is a bar, not a navigator — the panel below is this
                  screen&apos;s own state.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Primary with icons</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Tabs items={WITH_ICONS} />
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  An icon above the label grows a primary tab to 64dp. The
                  indicator matches the label, not the tab.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Secondary</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Tabs variant="secondary" items={WITH_ICONS} />
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  A secondary tab keeps its icon inline at 48dp, activates in
                  `onSurface`, and takes a full-width 2dp indicator.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Scrollable</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Tabs
                scrollable
                items={MANY}
                value={scrollableSection}
                onValueChange={setScrollableSection}
              />
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  Natural widths, floored at 90dp, with the active tab scrolled
                  into view. Selected: {scrollableSection}
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Disabled and overrides</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Tabs
                showDivider={false}
                containerColor={theme.colors.surfaceContainerHigh}
                selectedContentColor={theme.colors.tertiary}
                indicatorColor={theme.colors.tertiary}
                items={[
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                  { value: 'deleted', label: 'Deleted', disabled: true },
                ]}
              />
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  No divider, a tinted row, a tertiary indicator, and a disabled
                  tab at 38%.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>
        <ScreenNavFooter />
      </Column>
    </ScrollView>
  )
}

export default function TabsScreen() {
  return <TabsScreenContent />
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
