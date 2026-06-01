import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  List,
  ListItem,
  ListDivider,
  Typography,
  Column,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'

function Icon({ name }: { name: string }) {
  const theme = useTheme()
  return (
    <MaterialCommunityIcons
      name={name as never}
      size={24}
      color={theme.colors.onSurfaceVariant}
    />
  )
}

function Avatar({ label }: { label: string }) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <Typography variant="titleSmall" color={theme.colors.onPrimaryContainer}>
        {label}
      </Typography>
    </View>
  )
}

export default function ListScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">List Showcase</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">One-line items</Typography>
        <List>
          <ListItem headlineText="Item one" />
          <ListItem headlineText="Item two" />
          <ListItem headlineText="Item three" />
        </List>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Two-line items</Typography>
        <List>
          <ListItem headlineText="Photos" supportingText="Jan 9, 2024" />
          <ListDivider />
          <ListItem headlineText="Recipes" supportingText="Jan 17, 2024" />
          <ListDivider />
          <ListItem headlineText="Work" supportingText="Jan 28, 2024" />
        </List>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Three-line items</Typography>
        <List>
          <ListItem
            headlineText="Brunch this weekend?"
            overlineText="MESSAGES"
            supportingText="Ali Connors — I'll be in your neighborhood this weekend."
          />
          <ListDivider />
          <ListItem
            headlineText="Summer BBQ"
            overlineText="EVENTS"
            supportingText="Wish I could come, but I'm out of town this weekend."
          />
        </List>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">With leading icons</Typography>
        <List>
          <ListItem
            headlineText="Photos"
            supportingText="Jan 9, 2024"
            leadingContent={<Icon name="image" />}
          />
          <ListDivider inset />
          <ListItem
            headlineText="Recipes"
            supportingText="Jan 17, 2024"
            leadingContent={<Icon name="book-open-variant" />}
          />
          <ListDivider inset />
          <ListItem
            headlineText="Work"
            supportingText="Jan 28, 2024"
            leadingContent={<Icon name="briefcase" />}
          />
        </List>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          With avatars and trailing text
        </Typography>
        <List>
          <ListItem
            headlineText="Alice"
            supportingText="Are we still meeting tomorrow?"
            leadingContent={<Avatar label="A" />}
            trailingSupportingText="5 min"
          />
          <ListDivider inset />
          <ListItem
            headlineText="Bob"
            supportingText="Sounds great, see you then!"
            leadingContent={<Avatar label="B" />}
            trailingSupportingText="20 min"
          />
        </List>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Interactive items</Typography>
        <List>
          <ListItem
            headlineText="Wi-Fi"
            supportingText="Connected"
            leadingContent={<Icon name="wifi" />}
            onPress={() => Alert.alert('Wi-Fi tapped')}
          />
          <ListDivider inset />
          <ListItem
            headlineText="Bluetooth"
            supportingText="Nearby devices"
            leadingContent={<Icon name="bluetooth" />}
            onPress={() => Alert.alert('Bluetooth tapped')}
          />
          <ListDivider inset />
          <ListItem
            headlineText="Airplane mode"
            supportingText="Off"
            leadingContent={<Icon name="airplane" />}
            onPress={() => Alert.alert('Airplane tapped')}
          />
        </List>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled items</Typography>
        <List>
          <ListItem
            headlineText="Disabled item"
            supportingText="Cannot interact"
            leadingContent={<Icon name="lock" />}
            onPress={() => {}}
            disabled
          />
          <ListItem
            headlineText="Enabled item"
            supportingText="Can interact"
            leadingContent={<Icon name="lock-open" />}
            onPress={() => Alert.alert('Pressed')}
          />
        </List>
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
