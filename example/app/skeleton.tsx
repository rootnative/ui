import {
  Button,
  Card,
  Column,
  Row,
  Skeleton,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

export default function SkeletonScreen() {
  const theme = useTheme()
  const [loaded, setLoaded] = useState(false)

  const captionStyle = { color: theme.colors.onSurfaceVariant }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenIntro />
      <Column gap="sm">
        <Typography variant="titleSmall">Text lines</Typography>
        <Column gap="sm">
          <Skeleton />
          <Skeleton width="80%" />
          <Skeleton width="60%" />
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Shapes</Typography>
        <Row gap="lg" align="center">
          <Column align="center" gap="xs">
            <Skeleton shape="circle" width={48} height={48} />
            <Typography variant="labelSmall" style={captionStyle}>
              circle
            </Typography>
          </Column>
          <Column align="center" gap="xs">
            <Skeleton width={96} height={48} />
            <Typography variant="labelSmall" style={captionStyle}>
              rounded
            </Typography>
          </Column>
          <Column align="center" gap="xs">
            <Skeleton shape="rectangle" width={96} height={48} />
            <Typography variant="labelSmall" style={captionStyle}>
              rectangle
            </Typography>
          </Column>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Card placeholder</Typography>
        <Card variant="outlined">
          <Column p="md" gap="md">
            {loaded ? (
              <>
                <Row gap="md" align="center">
                  <Typography variant="titleMedium">Whiskers</Typography>
                </Row>
                <Typography variant="bodyMedium">
                  A ginger cat who naps through every photo shoot and still gets
                  the most likes.
                </Typography>
              </>
            ) : (
              <>
                <Row gap="md" align="center">
                  <Skeleton shape="circle" width={40} height={40} />
                  <Skeleton width={120} height={20} />
                </Row>
                <Skeleton height={160} />
                <Column gap="sm">
                  <Skeleton />
                  <Skeleton width="70%" />
                </Column>
              </>
            )}
          </Column>
        </Card>
        <Button variant="tonal" onPress={() => setLoaded((v) => !v)}>
          {loaded ? 'Show skeleton' : 'Show content'}
        </Button>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Static and custom color</Typography>
        <Column gap="sm">
          <Skeleton animated={false} />
          <Skeleton
            containerColor={theme.colors.secondaryContainer}
            width="80%"
          />
        </Column>
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
