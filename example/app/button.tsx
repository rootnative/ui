import { Button, Column, Row, Typography } from '@rootnative/components'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const variants = ['filled', 'elevated', 'tonal', 'outlined', 'text'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

export default function ButtonScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenIntro />
      <Column gap="sm">
        <Typography variant="titleSmall">Variants</Typography>
        <Row wrap gap="sm">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {`${variant} button`}
            </Button>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled Variants</Typography>
        <Row wrap gap="sm">
          {variants.map((variant) => (
            <Button key={`disabled-${variant}`} variant={variant} disabled>
              {`${variant} button`}
            </Button>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Buttons: With Icons</Typography>
        <Row wrap gap="sm">
          <Button variant="filled" leadingIcon="plus">
            Add Item
          </Button>
          <Button variant="outlined" trailingIcon="arrow-right">
            Continue
          </Button>
          <Button
            variant="tonal"
            leadingIcon="heart-outline"
            trailingIcon="share-variant"
          >
            Favorite
          </Button>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Sizes (XS–XL)</Typography>
        <Row wrap gap="sm" align="center">
          {sizes.map((size) => (
            <Button key={size} size={size} leadingIcon="plus">
              {size.toUpperCase()}
            </Button>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Square Shape</Typography>
        <Row wrap gap="sm" align="center">
          {sizes.map((size) => (
            <Button key={size} size={size} shape="square">
              {size.toUpperCase()}
            </Button>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Icon Size</Typography>
        <Typography variant="bodySmall" style={styles.muted}>
          iconSize overrides the size-derived icon size (20 dp at size s).
        </Typography>
        <Row wrap gap="sm" align="center">
          <Button leadingIcon="plus" iconSize={14}>
            14 dp
          </Button>
          <Button leadingIcon="plus">Default</Button>
          <Button leadingIcon="plus" iconSize={28}>
            28 dp
          </Button>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Label Style</Typography>
        <Typography variant="bodySmall" style={styles.muted}>
          labelStyle affects the text only — icons keep the size and color
          derived from the variant.
        </Typography>
        <Row wrap gap="sm" align="center">
          <Button
            variant="tonal"
            leadingIcon="rocket-launch-outline"
            labelStyle={styles.brandLabel}
          >
            Launch
          </Button>
          <Button variant="outlined" labelStyle={styles.italicLabel}>
            Read more
          </Button>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <Row wrap gap="sm">
          <Button containerColor="#B00020" contentColor="#FFFFFF">
            Danger
          </Button>
          <Button variant="outlined" contentColor="#00796B">
            Teal Bold
          </Button>
          <Button
            variant="tonal"
            containerColor="#E8DEF8"
            contentColor="#4A148C"
          >
            Custom Tonal
          </Button>
        </Row>
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
  muted: {
    opacity: 0.7,
  },
  brandLabel: {
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  italicLabel: {
    fontStyle: 'italic',
  },
})
