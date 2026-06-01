import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  Box,
  Button,
  Chip,
  Column,
  Grid,
  List,
  ListDivider,
  ListItem,
  Row,
  Switch,
  TextField,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { I18nManager, ScrollView, StyleSheet } from 'react-native'

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme()
  return (
    <Typography
      variant="labelLarge"
      style={[styles.sectionTitle, { color: colors.primary }]}
    >
      {children}
    </Typography>
  )
}

function Icon({ name }: { name: string }) {
  const { colors } = useTheme()
  return (
    <MaterialCommunityIcons
      name={name as never}
      size={24}
      color={colors.onSurfaceVariant}
    />
  )
}

function Cell({ label }: { label: string }) {
  const { colors } = useTheme()
  return (
    <Box
      align="center"
      justify="center"
      p="sm"
      style={[styles.cell, { backgroundColor: colors.primaryContainer }]}
    >
      <Typography variant="labelMedium">{label}</Typography>
    </Box>
  )
}

export default function RTLScreen() {
  const { colors } = useTheme()
  const direction = I18nManager.isRTL ? 'RTL' : 'LTR'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Box
        p="md"
        style={[styles.badge, { backgroundColor: colors.tertiaryContainer }]}
      >
        <Typography
          variant="bodyMedium"
          style={{ color: colors.onTertiaryContainer }}
        >
          Current direction:{' '}
          <Typography variant="labelLarge">{direction}</Typography>
          {'\n'}Use the pilcrow icon in the AppBar to toggle RTL.
        </Typography>
      </Box>

      <SectionTitle>Grid (3 columns)</SectionTitle>
      <Grid columns={3} gap="sm">
        <Cell label="1" />
        <Cell label="2" />
        <Cell label="3" />
        <Cell label="4" />
        <Cell label="5" />
        <Cell label="6" />
      </Grid>

      <SectionTitle>Grid (2 columns)</SectionTitle>
      <Grid columns={2} gap="md">
        <Cell label="A" />
        <Cell label="B" />
        <Cell label="C" />
        <Cell label="D" />
      </Grid>

      <SectionTitle>Row — leading / trailing icons</SectionTitle>
      <Column gap="sm">
        <Button variant="filled" trailingIcon="arrow-right">
          Leading icon
        </Button>
        <Button variant="outlined" leadingIcon="arrow-left">
          Trailing icon
        </Button>
      </Column>

      <SectionTitle>Chips</SectionTitle>
      <Row gap="sm" wrap>
        <Chip leadingIcon="check">Selected</Chip>
        <Chip leadingIcon="close">Dismiss</Chip>
        <Chip>No icon</Chip>
      </Row>

      <SectionTitle>TextField</SectionTitle>
      <Column gap="sm">
        <TextField label="Filled (label animates from start)" />
        <TextField variant="outlined" label="Outlined" leadingIcon="magnify" />
        <TextField
          variant="outlined"
          label="With both icons"
          leadingIcon="magnify"
          trailingIcon="close"
        />
      </Column>

      <SectionTitle>List — leading &amp; trailing content</SectionTitle>
      <List>
        <ListItem
          headlineText="Leading icon"
          leadingContent={<Icon name="account-circle" />}
          trailingSupportingText="Detail"
        />
        <ListItem
          headlineText="Leading icon + trailing icon"
          leadingContent={<Icon name="bell-outline" />}
          trailingContent={<Icon name="chevron-right" />}
        />
        <ListItem
          headlineText="Inset divider below"
          leadingContent={<Icon name="folder-outline" />}
        />
        <ListDivider inset />
        <ListItem
          headlineText="Last item"
          leadingContent={<Icon name="star-outline" />}
        />
      </List>

      <SectionTitle>Switch</SectionTitle>
      <Column gap="sm">
        <Row gap="md" align="center">
          <Switch value={true} onValueChange={() => {}} />
          <Typography variant="bodyMedium">On</Typography>
        </Row>
        <Row gap="md" align="center">
          <Switch value={false} onValueChange={() => {}} />
          <Typography variant="bodyMedium">Off</Typography>
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
    padding: 16,
    rowGap: 12,
    paddingBottom: 40,
  },
  badge: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    marginTop: 8,
  },
  cell: {
    borderRadius: 8,
    minHeight: 48,
  },
})
