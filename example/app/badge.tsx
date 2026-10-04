import {
  Badge,
  Column,
  Container,
  Icon,
  IconButton,
  NavigationBar,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

export default function BadgeScreen() {
  const theme = useTheme()
  const [count, setCount] = useState(3)
  const [tab, setTab] = useState('inbox')

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Container width="expanded" p="lg" gap="xl">
        <ScreenIntro />

        <Column gap="sm">
          <Typography variant="titleMedium">Sizes</Typography>
          <Typography variant="bodyMedium">
            A badge with no label is a 6dp dot. A badge with a label is a 16dp
            pill.
          </Typography>
          <Row gap="xl" align="center">
            <Badge accessibilityLabel="New activity">
              <Icon
                source="bell-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <Badge label={3}>
              <Icon
                source="bell-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <Badge label={42}>
              <Icon
                source="email-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <Badge label={1200}>
              <Icon
                source="email-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Max</Typography>
          <Row gap="xl" align="center">
            <Badge label={120} max={99}>
              <Icon
                source="message-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <Badge label={9} max={9}>
              <Icon
                source="message-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <Badge label="NEW">
              <Icon
                source="star-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Visible</Typography>
          <Typography variant="bodyMedium">
            The anchor keeps its layout when the badge is hidden.
          </Typography>
          <Row gap="md" align="center">
            <Badge label={count} visible={count > 0}>
              <Icon
                source="cart-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <IconButton
              icon="plus"
              accessibilityLabel="Add one"
              onPress={() => setCount((c) => c + 1)}
            />
            <IconButton
              icon="minus"
              accessibilityLabel="Remove one"
              onPress={() => setCount((c) => Math.max(0, c - 1))}
            />
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Standalone</Typography>
          <Row gap="md" align="center">
            <Typography variant="bodyLarge">Inbox</Typography>
            <Badge label={12} />
            <Badge />
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Custom colors</Typography>
          <Row gap="xl" align="center">
            <Badge
              label={5}
              containerColor={theme.colors.primary}
              contentColor={theme.colors.onPrimary}
            >
              <Icon
                source="bell-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
            <Badge containerColor={theme.colors.tertiary}>
              <Icon
                source="bell-outline"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </Badge>
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">In a NavigationBar</Typography>
          <NavigationBar
            value={tab}
            onValueChange={setTab}
            items={[
              {
                value: 'home',
                label: 'Home',
                icon: 'home-outline',
                selectedIcon: 'home',
              },
              {
                value: 'inbox',
                label: 'Inbox',
                icon: 'email-outline',
                selectedIcon: 'email',
                badge: 7,
                accessibilityLabel: 'Inbox, 7 unread',
              },
              {
                value: 'alerts',
                label: 'Alerts',
                icon: 'bell-outline',
                selectedIcon: 'bell',
                badge: true,
                accessibilityLabel: 'Alerts, new activity',
              },
              {
                value: 'you',
                label: 'You',
                icon: 'account-outline',
                selectedIcon: 'account',
                badge: 1000,
              },
            ]}
          />
        </Column>

        <ScreenNavFooter />
      </Container>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
})
