import {
  Button,
  Card,
  Checkbox,
  Chip,
  Column,
  Container,
  Divider,
  Row,
  SideSheet,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { catalogMetadata } from '../src/metadata'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

type OpenSheet = 'filters' | 'levels' | 'detached' | null

const GENRES = ['Drama', 'Comedy', 'Documentary', 'Animation']
const SORT_ORDERS = ['Newest', 'Oldest', 'Title']

export function generateMetadata() {
  return catalogMetadata('/side-sheet')
}

export default function SideSheetScreen() {
  const theme = useTheme()
  const [open, setOpen] = useState<OpenSheet>(null)
  const [genres, setGenres] = useState<string[]>(['Drama'])
  const [unwatched, setUnwatched] = useState(true)
  const [shorts, setShorts] = useState(false)
  const [level, setLevel] = useState<'settings' | 'sort'>('settings')
  const [sort, setSort] = useState('Newest')
  const [details, setDetails] = useState(true)

  const close = () => setOpen(null)
  const openLevels = () => {
    setLevel('settings')
    setOpen('levels')
  }
  const toggleGenre = (genre: string) =>
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre],
    )

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )
  const panelStyle = useMemo(
    () => [styles.panel, { backgroundColor: theme.colors.surfaceContainer }],
    [theme],
  )

  return (
    <>
      <ScrollView contentContainerStyle={scrollStyle}>
        <Container width="expanded" p="lg" gap="xl">
          <ScreenIntro />

          <Column gap="sm">
            <Typography variant="titleMedium">Modal</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  Slides in from the end edge over a scrim. The close button,
                  the scrim, Android back and Escape dismiss it. The actions
                  stay at the bottom while the content scrolls.
                </Typography>
                <Row gap="sm">
                  <Button onPress={() => setOpen('filters')}>
                    Open filters
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Second level</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  onBack adds a back button before the headline, for a sheet
                  that shows a second level of content. Sort order: {sort}.
                </Typography>
                <Row gap="sm">
                  <Button variant="tonal" onPress={openLevels}>
                    Open settings
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Detached, start edge</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  {'edge="start"'} enters from the start edge, which is the
                  right edge in RTL. detached adds a 16dp margin and rounds all
                  four corners.
                </Typography>
                <Row gap="sm">
                  <Button
                    variant="outlined"
                    onPress={() => setOpen('detached')}
                  >
                    Open
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Standard</Typography>
            <Card variant="outlined">
              <Row style={styles.frame}>
                <Column p="md" gap="sm" style={panelStyle}>
                  <Typography variant="bodyMedium">Main content</Typography>
                  <Typography variant="bodySmall" style={mutedText}>
                    A standard sheet renders in place beside the content, which
                    stays interactive. It is 256dp wide; this one is narrowed
                    with width to fit the demo.
                  </Typography>
                  {details ? null : (
                    <Row>
                      <Button variant="tonal" onPress={() => setDetails(true)}>
                        Show details
                      </Button>
                    </Row>
                  )}
                </Column>
                {details ? (
                  <>
                    <Divider orientation="vertical" />
                    <SideSheet
                      variant="standard"
                      headline="Details"
                      width={220}
                      onDismiss={() => setDetails(false)}
                    >
                      <Column gap="xs">
                        <Typography variant="labelLarge">Modified</Typography>
                        <Typography variant="bodyMedium" style={mutedText}>
                          31 Oct 2026
                        </Typography>
                        <Typography variant="labelLarge">Size</Typography>
                        <Typography variant="bodyMedium" style={mutedText}>
                          2.4 MB
                        </Typography>
                      </Column>
                    </SideSheet>
                  </>
                ) : null}
              </Row>
            </Card>
          </Column>

          <ScreenNavFooter />
        </Container>
      </ScrollView>

      <SideSheet
        visible={open === 'filters'}
        onDismiss={close}
        headline="Filters"
        actions={
          <>
            <Button onPress={close}>Save</Button>
            <Button variant="outlined" onPress={close}>
              Cancel
            </Button>
          </>
        }
      >
        <Column gap="lg">
          <Column gap="sm">
            <Typography variant="titleSmall">Genres</Typography>
            <Row gap="sm" wrap>
              {GENRES.map((genre) => (
                <Chip
                  key={genre}
                  variant="filter"
                  selected={genres.includes(genre)}
                  onPress={() => toggleGenre(genre)}
                >
                  {genre}
                </Chip>
              ))}
            </Row>
          </Column>
          <Column gap="sm">
            <Typography variant="titleSmall">Show</Typography>
            <Row gap="sm" align="center">
              <Checkbox
                value={unwatched}
                onValueChange={setUnwatched}
                accessibilityLabel="Only unwatched"
              />
              <Typography variant="bodyMedium">Only unwatched</Typography>
            </Row>
            <Row gap="sm" align="center">
              <Checkbox
                value={shorts}
                onValueChange={setShorts}
                accessibilityLabel="Include short films"
              />
              <Typography variant="bodyMedium">Include short films</Typography>
            </Row>
          </Column>
        </Column>
      </SideSheet>

      <SideSheet
        visible={open === 'levels'}
        onDismiss={close}
        headline={level === 'settings' ? 'Settings' : 'Sort order'}
        onBack={level === 'sort' ? () => setLevel('settings') : undefined}
      >
        {level === 'settings' ? (
          <Column gap="md">
            <Typography variant="bodyMedium" style={mutedText}>
              The list is sorted by {sort.toLowerCase()} first.
            </Typography>
            <Row>
              <Button
                variant="tonal"
                trailingIcon="chevron-right"
                onPress={() => setLevel('sort')}
              >
                Sort order
              </Button>
            </Row>
          </Column>
        ) : (
          <Row gap="sm" wrap>
            {SORT_ORDERS.map((order) => (
              <Chip
                key={order}
                variant="filter"
                selected={sort === order}
                onPress={() => setSort(order)}
              >
                {order}
              </Chip>
            ))}
          </Row>
        )}
      </SideSheet>

      <SideSheet
        visible={open === 'detached'}
        onDismiss={close}
        headline="Account"
        edge="start"
        detached
      >
        <Typography variant="bodyMedium" style={mutedText}>
          Signed in as reader@example.com.
        </Typography>
      </SideSheet>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  frame: {
    height: 360,
    overflow: 'hidden',
  },
  panel: {
    flex: 1,
    alignSelf: 'stretch',
  },
})
