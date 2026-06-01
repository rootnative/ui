import { Button, Column, Row, Typography } from '@rootnative/components'
import { ScrollView, StyleSheet } from 'react-native'

const variants = ['filled', 'elevated', 'tonal', 'outlined', 'text'] as const

export default function ButtonScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Button Showcase</Typography>

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
