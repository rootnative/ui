import {
  Button,
  Card,
  Carousel,
  Column,
  Container,
  Row,
  Typography,
} from '@rootnative/components'
import type { CarouselItemInfo, CarouselRef } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { Motion, useInterpolatedStyle } from '@rootnative/inertia'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { catalogMetadata } from '../src/metadata'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

interface Place {
  id: string
  title: string
  tone: keyof MaterialTheme['colors']
}

const PLACES: Place[] = [
  { id: 'cabin', title: 'Cabin by the lake', tone: 'primaryContainer' },
  { id: 'shore', title: 'North shore', tone: 'tertiaryContainer' },
  { id: 'ridge', title: 'Ridge trail', tone: 'secondaryContainer' },
  { id: 'dunes', title: 'Dunes at dusk', tone: 'errorContainer' },
  { id: 'falls', title: 'Hidden falls', tone: 'surfaceVariant' },
  { id: 'harbor', title: 'Old harbor', tone: 'inverseSurface' },
]

const ON_TONE: Record<string, keyof MaterialTheme['colors']> = {
  primaryContainer: 'onPrimaryContainer',
  tertiaryContainer: 'onTertiaryContainer',
  secondaryContainer: 'onSecondaryContainer',
  errorContainer: 'onErrorContainer',
  surfaceVariant: 'onSurfaceVariant',
  inverseSurface: 'inverseOnSurface',
}

const keyOf = (place: Place) => place.id
const labelOf = (place: Place) => place.title

/** A colored item with a label that fades out as the item shrinks. */
function PlaceItem({ item, progress }: CarouselItemInfo<Place>) {
  const theme = useTheme()
  const fade = useInterpolatedStyle(progress, { opacity: [0, 1] })
  const fill = useMemo(
    () => [styles.fill, { backgroundColor: theme.colors[item.tone] }],
    [theme, item.tone],
  )
  const label = useMemo(
    () => ({ color: theme.colors[ON_TONE[item.tone]] }),
    [theme, item.tone],
  )
  return (
    <View style={fill}>
      <Motion.View style={[styles.label, fade]}>
        <Typography variant="titleMedium" style={label}>
          {item.title}
        </Typography>
      </Motion.View>
    </View>
  )
}

/** A colored item with no label, for the variants that keep one size. */
function Swatch({ item }: CarouselItemInfo<Place>) {
  const theme = useTheme()
  const fill = useMemo(
    () => [styles.fill, { backgroundColor: theme.colors[item.tone] }],
    [theme, item.tone],
  )
  return <View style={fill} />
}

function CarouselScreenContent() {
  const theme = useTheme()
  const [index, setIndex] = useState(0)
  const [pressed, setPressed] = useState<string | null>(null)
  const carouselRef = useRef<CarouselRef>(null)

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(
    () => setIndex((i) => Math.min(PLACES.length - 1, i + 1)),
    [],
  )
  const toLast = useCallback(
    () => carouselRef.current?.scrollToIndex(PLACES.length - 1),
    [],
  )
  const onItemPress = useCallback((place: Place) => setPressed(place.title), [])

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <Container width="expanded" p="lg" gap="xl">
        <ScreenIntro />

        <Column gap="sm">
          <Typography variant="titleMedium">Multi-browse</Typography>
          <Card variant="outlined">
            <Column gap="sm" py="md">
              <Carousel
                items={PLACES}
                keyExtractor={keyOf}
                contentPadding={16}
                renderItem={PlaceItem}
              />
              <Column px="md">
                <Typography variant="bodySmall" style={mutedText}>
                  Large, medium and small items at once. An item changes size as
                  it scrolls, and its label fades with it. The last item ends
                  large at the end edge.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Hero</Typography>
          <Card variant="outlined">
            <Column gap="sm" py="md">
              <Carousel
                variant="hero"
                items={PLACES}
                keyExtractor={keyOf}
                contentPadding={16}
                renderItem={PlaceItem}
              />
              <Column px="md">
                <Typography variant="bodySmall" style={mutedText}>
                  One large item and a 56dp preview of the next one.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Uncontained</Typography>
          <Card variant="outlined">
            <Column gap="sm" py="md">
              <Carousel
                variant="uncontained"
                itemWidth={240}
                itemHeight={140}
                items={PLACES}
                keyExtractor={keyOf}
                contentPadding={16}
                renderItem={Swatch}
              />
              <Column px="md">
                <Typography variant="bodySmall" style={mutedText}>
                  Items of one width that run past the edge, with no size
                  change.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Full-screen</Typography>
          <Card variant="outlined">
            <Column gap="sm" py="md">
              <Carousel
                variant="full-screen"
                items={PLACES}
                keyExtractor={keyOf}
                contentPadding={16}
                renderItem={PlaceItem}
                style={styles.fullScreenFrame}
              />
              <Column px="md">
                <Typography variant="bodySmall" style={mutedText}>
                  Vertical, one item per screen. The carousel takes the height
                  of its style, 360dp here.
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">
            Selection and pressable items
          </Typography>
          <Card variant="outlined">
            <Column gap="sm" py="md">
              <Carousel
                ref={carouselRef}
                items={PLACES}
                keyExtractor={keyOf}
                index={index}
                onIndexChange={setIndex}
                onItemPress={onItemPress}
                itemAccessibilityLabel={labelOf}
                contentPadding={16}
                renderItem={PlaceItem}
              />
              <Column px="md" gap="sm">
                <Row gap="sm" align="center" wrap>
                  <Button variant="tonal" onPress={back}>
                    Back
                  </Button>
                  <Button variant="tonal" onPress={next}>
                    Next
                  </Button>
                  <Button variant="text" onPress={toLast}>
                    Last
                  </Button>
                </Row>
                <Typography variant="bodySmall" style={mutedText}>
                  Item {index + 1} of {PLACES.length}.{' '}
                  {pressed === null ? 'Press an item.' : `Pressed: ${pressed}.`}
                </Typography>
              </Column>
            </Column>
          </Card>
        </Column>

        <ScreenNavFooter />
      </Container>
    </ScrollView>
  )
}

export function generateMetadata() {
  return catalogMetadata('/carousel')
}

export default function CarouselScreen() {
  return <CarouselScreenContent />
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  fill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    padding: 16,
  },
  fullScreenFrame: {
    height: 360,
  },
})
