import { Button, Card, Typography, Column } from '@rootnative/components'
import { Alert, Image, ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const variants = ['elevated', 'filled', 'outlined'] as const

export default function CardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenIntro />
      <Column gap="sm">
        <Typography variant="titleSmall">Variants</Typography>
        <Column gap="sm">
          {variants.map((variant) => (
            <Card key={variant} variant={variant}>
              <Card.Content>
                <Typography variant="titleMedium">{variant}</Typography>
                <Typography variant="bodyMedium">
                  This is a non-interactive {variant} card.
                </Typography>
              </Card.Content>
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
              <Card.Content>
                <Typography variant="titleMedium">{variant}</Typography>
                <Typography variant="bodyMedium">
                  Tap this interactive {variant} card.
                </Typography>
              </Card.Content>
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
              <Card.Content>
                <Typography variant="titleMedium">{variant}</Typography>
                <Typography variant="bodyMedium">
                  Disabled {variant} card.
                </Typography>
              </Card.Content>
            </Card>
          ))}
        </Column>
      </Column>
      <Column gap="sm">
        <Typography variant="titleSmall">Regions</Typography>
        <Card variant="elevated">
          <Card.Media height={160}>
            <Image
              source={{ uri: 'https://picsum.photos/id/1018/600/400' }}
              resizeMode="cover"
            />
          </Card.Media>
          <Card.Content>
            <Typography variant="titleMedium">Media + Content</Typography>
            <Typography variant="bodyMedium">
              The media sits edge-to-edge and the card radius clips it.
            </Typography>
          </Card.Content>
          <Card.Actions>
            <Button variant="text" onPress={() => Alert.alert('Shared')}>
              Share
            </Button>
            <Button variant="filled" onPress={() => Alert.alert('Booked')}>
              Book
            </Button>
          </Card.Actions>
        </Card>

        <Card variant="outlined">
          <Card.Media aspectRatio={16 / 9}>
            <Image
              source={{ uri: 'https://picsum.photos/id/1015/600/400' }}
              resizeMode="cover"
            />
          </Card.Media>
          <Card.Content>
            <Typography variant="titleMedium">aspectRatio media</Typography>
            <Typography variant="bodyMedium">
              A 16:9 region that stays proportional as the card resizes.
            </Typography>
          </Card.Content>
        </Card>

        <Card variant="filled">
          <Card.Content>
            <Typography variant="titleMedium">Actions alignment</Typography>
            <Typography variant="bodyMedium">
              Actions align to the trailing edge by default.
            </Typography>
          </Card.Content>
          <Card.Actions align="space-between">
            <Button variant="text" onPress={() => Alert.alert('Back')}>
              Back
            </Button>
            <Button variant="filled" onPress={() => Alert.alert('Next')}>
              Next
            </Button>
          </Card.Actions>
        </Card>
      </Column>
      <ScreenNavFooter />
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
