import { Column, FAB, Row, Typography } from '@rootnative/components'
import { ScrollView, StyleSheet } from 'react-native'

const variants = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary', value: 'tertiary' },
  { label: 'Surface', value: 'surface' },
] as const

const sizes = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
] as const

export default function FABScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">FAB Showcase</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Variants</Typography>
        <Row gap="lg" wrap>
          {variants.map((option) => (
            <Column key={option.value} align="center" gap="xs">
              <FAB
                icon="plus"
                variant={option.value}
                accessibilityLabel={`${option.label} FAB`}
              />
              <Typography variant="labelSmall">{option.label}</Typography>
            </Column>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Sizes</Typography>
        <Row gap="lg" align="center">
          {sizes.map((option) => (
            <Column key={option.value} align="center" gap="xs">
              <FAB
                icon="plus"
                size={option.value}
                accessibilityLabel={`${option.label} FAB`}
              />
              <Typography variant="labelSmall">{option.label}</Typography>
            </Column>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Extended</Typography>
        <Column gap="md" align="flex-start">
          <FAB icon="plus" label="Compose" />
          <FAB
            icon="map-marker-outline"
            label="Add location"
            variant="tertiary"
          />
          <FAB icon="pencil-outline" label="Edit" variant="surface" />
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <Row gap="md" align="center">
          <FAB
            icon="heart"
            containerColor="#B00020"
            contentColor="#FFFFFF"
            accessibilityLabel="Favorite"
          />
          <FAB
            icon="star"
            label="Star"
            containerColor="#FFB300"
            contentColor="#1F1300"
          />
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled</Typography>
        <Row gap="md" align="center">
          <FAB icon="plus" disabled accessibilityLabel="Add" />
          <FAB icon="plus" label="Compose" disabled />
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
