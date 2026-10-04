import {
  Column,
  Container,
  Icon,
  List,
  ListDivider,
  ListItem,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const longSupporting =
  'Ali Connors — I will be in your neighborhood doing errands this weekend, ' +
  'so let me know if you want to grab brunch somewhere near the park.'

function DemoIcon({ name }: { name: string }) {
  const theme = useTheme()
  return <Icon source={name} size={24} color={theme.colors.onSurfaceVariant} />
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
    <ScrollView style={styles.container}>
      <Container width="expanded" p="lg" gap={20}>
        <ScreenIntro />
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
              leadingContent={<DemoIcon name="image" />}
            />
            <ListDivider insetStart />
            <ListItem
              headlineText="Recipes"
              supportingText="Jan 17, 2024"
              leadingContent={<DemoIcon name="book-open-variant" />}
            />
            <ListDivider insetStart />
            <ListItem
              headlineText="Work"
              supportingText="Jan 28, 2024"
              leadingContent={<DemoIcon name="briefcase" />}
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
            <ListDivider insetStart />
            <ListItem
              headlineText="Bob"
              supportingText="Sounds great, see you then!"
              leadingContent={<Avatar label="B" />}
              trailingSupportingText="20 min"
            />
          </List>
        </Column>

        <Column gap="sm">
          <Typography variant="titleSmall">
            Supporting text line clamp
          </Typography>
          <List>
            <ListItem
              headlineText="One line (default)"
              supportingText={longSupporting}
              leadingContent={<DemoIcon name="email-outline" />}
            />
            <ListDivider insetStart />
            <ListItem
              headlineText="Two lines"
              supportingText={longSupporting}
              supportingTextNumberOfLines={2}
              leadingContent={<DemoIcon name="email-outline" />}
            />
            <ListDivider insetStart />
            <ListItem
              headlineText="Three lines"
              supportingText={longSupporting}
              supportingTextNumberOfLines={3}
              leadingContent={<DemoIcon name="email-outline" />}
            />
          </List>
        </Column>

        <Column gap="sm">
          <Typography variant="titleSmall">Interactive items</Typography>
          <List>
            <ListItem
              headlineText="Wi-Fi"
              supportingText="Connected"
              leadingContent={<DemoIcon name="wifi" />}
              onPress={() => Alert.alert('Wi-Fi tapped')}
            />
            <ListDivider insetStart />
            <ListItem
              headlineText="Bluetooth"
              supportingText="Nearby devices"
              leadingContent={<DemoIcon name="bluetooth" />}
              onPress={() => Alert.alert('Bluetooth tapped')}
            />
            <ListDivider insetStart />
            <ListItem
              headlineText="Airplane mode"
              supportingText="Off"
              leadingContent={<DemoIcon name="airplane" />}
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
              leadingContent={<DemoIcon name="lock" />}
              onPress={() => {}}
              disabled
            />
            <ListItem
              headlineText="Enabled item"
              supportingText="Can interact"
              leadingContent={<DemoIcon name="lock-open" />}
              onPress={() => Alert.alert('Pressed')}
            />
          </List>
        </Column>
        <ScreenNavFooter />
      </Container>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
