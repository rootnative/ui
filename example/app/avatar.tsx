import { Avatar, Column, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'

export default function AvatarScreen() {
  const theme = useTheme()

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Column gap="xl" style={styles.container}>
        {/* Sizes */}
        <Column gap="sm">
          <Typography variant="titleMedium">Sizes</Typography>
          <Row gap="md" align="center">
            <Avatar size="xSmall" label="AB" />
            <Avatar size="small" label="AB" />
            <Avatar size="medium" label="AB" />
            <Avatar size="large" label="AB" />
            <Avatar size="xLarge" label="AB" />
          </Row>
        </Column>

        {/* Content types */}
        <Column gap="sm">
          <Typography variant="titleMedium">Content — Initials</Typography>
          <Row gap="md" align="center">
            <Avatar label="A" />
            <Avatar label="JD" />
            <Avatar label="Raaj" />
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Content — Icon</Typography>
          <Row gap="md" align="center">
            <Avatar icon="account" />
            <Avatar icon="account-group" />
            <Avatar icon="robot" />
            <Avatar icon="alien" />
          </Row>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Content — Image</Typography>
          <Row gap="md" align="center">
            <Avatar
              size="large"
              imageUri="https://i.pravatar.cc/150?img=1"
              accessibilityLabel="User photo"
            />
            <Avatar
              size="large"
              imageUri="https://i.pravatar.cc/150?img=2"
              accessibilityLabel="User photo"
            />
            <Avatar
              size="large"
              imageUri="https://i.pravatar.cc/150?img=3"
              accessibilityLabel="User photo"
            />
          </Row>
        </Column>

        {/* Colors */}
        <Column gap="sm">
          <Typography variant="titleMedium">Color overrides</Typography>
          <Row gap="md" align="center">
            <Avatar
              label="PK"
              containerColor={theme.colors.primaryContainer}
              contentColor={theme.colors.onPrimaryContainer}
            />
            <Avatar
              label="SK"
              containerColor={theme.colors.secondaryContainer}
              contentColor={theme.colors.onSecondaryContainer}
            />
            <Avatar
              label="TK"
              containerColor={theme.colors.tertiaryContainer}
              contentColor={theme.colors.onTertiaryContainer}
            />
            <Avatar
              label="EK"
              containerColor={theme.colors.errorContainer}
              contentColor={theme.colors.onErrorContainer}
            />
          </Row>
        </Column>

        {/* Interactive */}
        <Column gap="sm">
          <Typography variant="titleMedium">Interactive (pressable)</Typography>
          <Row gap="md" align="center">
            <Avatar
              label="JD"
              onPress={() => Alert.alert('Avatar pressed')}
              accessibilityLabel="Open profile"
            />
            <Avatar
              icon="account"
              size="large"
              onPress={() => Alert.alert('Avatar pressed')}
              accessibilityLabel="Open account"
            />
            <Avatar
              imageUri="https://i.pravatar.cc/150?img=5"
              size="large"
              onPress={() => Alert.alert('Avatar pressed')}
              accessibilityLabel="Open photo profile"
            />
          </Row>
        </Column>

        {/* Used in a list-like context */}
        <Column gap="sm">
          <Typography variant="titleMedium">Chat list example</Typography>
          <Column gap="xs">
            {[
              { initials: 'RS', name: 'Rahul Shah', msg: "Hey! What's up?" },
              {
                initials: 'PM',
                name: 'Priya Mehta',
                msg: 'Sent you a snap 👻',
              },
              {
                initials: 'AK',
                name: 'Arjun Kumar',
                msg: 'See you tomorrow',
              },
            ].map((item) => (
              <View
                key={item.initials}
                style={[
                  styles.chatRow,
                  { borderBottomColor: theme.colors.outlineVariant },
                ]}
              >
                <Avatar label={item.initials} size="medium" />
                <Column style={styles.chatText}>
                  <Typography variant="titleSmall">{item.name}</Typography>
                  <Typography
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                    numberOfLines={1}
                  >
                    {item.msg}
                  </Typography>
                </Column>
              </View>
            ))}
          </Column>
        </Column>
      </Column>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  container: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatText: {
    flex: 1,
  },
})
