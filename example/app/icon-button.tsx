import { Column, IconButton, Row, Typography } from '@rootnative/components'
import { ScrollView, StyleSheet } from 'react-native'

const variants = [
  { label: 'Filled', value: 'filled' },
  { label: 'Tonal', value: 'tonal' },
  { label: 'Outlined', value: 'outlined' },
  { label: 'Standard', value: 'standard' },
] as const

const sizes = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
] as const

const widths = [
  { label: 'Narrow', value: 'narrow' },
  { label: 'Uniform', value: 'uniform' },
  { label: 'Wide', value: 'wide' },
] as const

export default function IconButtonScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">IconButton Showcase</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Variants</Typography>
        <Row gap="lg">
          {variants.map((option) => (
            <Column key={option.value} align="center" gap="xs">
              <IconButton
                icon="heart-outline"
                variant={option.value}
                accessibilityLabel={`${option.label} heart`}
              />
              <Typography variant="labelSmall">{option.label}</Typography>
            </Column>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Sizes (XS–XL)</Typography>
        <Row gap="lg" align="center" wrap>
          {sizes.map((option) => (
            <Column key={option.value} align="center" gap="xs">
              <IconButton
                icon="heart-outline"
                size={option.value}
                variant="filled"
                accessibilityLabel={`${option.label} heart`}
              />
              <Typography variant="labelSmall">{option.label}</Typography>
            </Column>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Width (size M)</Typography>
        <Row gap="lg" align="center" wrap>
          {widths.map((option) => (
            <Column key={option.value} align="center" gap="xs">
              <IconButton
                icon="heart-outline"
                size="m"
                width={option.value}
                variant="tonal"
                accessibilityLabel={`${option.label} heart`}
              />
              <Typography variant="labelSmall">{option.label}</Typography>
            </Column>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Square Shape + Toggle</Typography>
        <Row gap="lg" align="center" wrap>
          {sizes.map((option) => (
            <Column key={option.value} align="center" gap="xs">
              <IconButton
                icon="heart-outline"
                selectedIcon="heart"
                size={option.value}
                shape="square"
                selected
                variant="filled"
                accessibilityLabel={`${option.label} square`}
              />
              <Typography variant="labelSmall">{option.label}</Typography>
            </Column>
          ))}
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <Row gap="sm">
          <IconButton
            icon="delete"
            containerColor="#B00020"
            contentColor="#FFFFFF"
            accessibilityLabel="Delete"
          />
          <IconButton
            icon="star"
            variant="outlined"
            contentColor="#FF8F00"
            accessibilityLabel="Star"
          />
          <IconButton
            icon="leaf"
            containerColor="#E8F5E9"
            contentColor="#2E7D32"
            accessibilityLabel="Eco"
          />
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Toggle States</Typography>
        {variants.map((option) => (
          <Column key={`state-${option.value}`} gap="xs">
            <Typography variant="labelSmall">{option.label}</Typography>
            <Row gap="lg">
              <Column align="center" gap="xs">
                <IconButton
                  icon="heart-outline"
                  selected={false}
                  variant={option.value}
                  accessibilityLabel="Like"
                />
                <Typography variant="labelSmall">Default</Typography>
              </Column>
              <Column align="center" gap="xs">
                <IconButton
                  icon="heart-outline"
                  selectedIcon="heart"
                  selected
                  variant={option.value}
                  accessibilityLabel="Like"
                />
                <Typography variant="labelSmall">Selected</Typography>
              </Column>
              <Column align="center" gap="xs">
                <IconButton
                  icon="heart-outline"
                  selected={false}
                  variant={option.value}
                  disabled
                  accessibilityLabel="Like"
                />
                <Typography variant="labelSmall">Disabled</Typography>
              </Column>
              <Column align="center" gap="xs">
                <IconButton
                  icon="heart-outline"
                  selectedIcon="heart"
                  selected
                  variant={option.value}
                  disabled
                  accessibilityLabel="Like"
                />
                <Typography variant="labelSmall">Sel + Dis</Typography>
              </Column>
            </Row>
          </Column>
        ))}
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
