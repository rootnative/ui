import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Column,
  FAB,
  Grid,
  IconButton,
  LinearProgress,
  ListItem,
  Radio,
  Row,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@rootnative/components'
import { useTheme, useBreakpointValue } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'

interface ComponentEntry {
  label: string
  route: string
  description: string
}

interface ComponentSection {
  title: string
  description: string
  items: ComponentEntry[]
}

const sections: ComponentSection[] = [
  {
    title: 'Foundations',
    description: 'Type, layout, and direction primitives',
    items: [
      {
        label: 'Typography',
        route: '/typography',
        description: 'Display, headline, body, and label text styles',
      },
      {
        label: 'Layout',
        route: '/layout',
        description: 'Flexbox primitives for building page structure',
      },
      {
        label: 'RTL',
        route: '/rtl',
        description: 'Right-to-left layout — toggle from the AppBar',
      },
    ],
  },
  {
    title: 'Actions & Inputs',
    description: 'Buttons, chips, and text fields',
    items: [
      {
        label: 'Button',
        route: '/button',
        description: 'Filled, outlined, tonal, elevated, and text buttons',
      },
      {
        label: 'ButtonGroup',
        route: '/button-group',
        description:
          'Standard and connected button groups with single/multi select',
      },
      {
        label: 'IconButton',
        route: '/icon-button',
        description: 'Compact icon-only actions with toggle and size variants',
      },
      {
        label: 'FAB',
        route: '/fab',
        description:
          'Floating action button — primary, surface, sizes, and extended',
      },
      {
        label: 'Chip',
        route: '/chip',
        description: 'Compact elements for filters and selections',
      },
      {
        label: 'TextField',
        route: '/text-field',
        description: 'Filled and outlined text input fields',
      },
      {
        label: 'Keyboard Wrapper',
        route: '/keyboard-avoiding-wrapper',
        description: 'Smart keyboard-aware wrapper with platform behavior',
      },
    ],
  },
  {
    title: 'Selection',
    description: 'Toggles, checkboxes, radios, and sliders',
    items: [
      {
        label: 'Switch',
        route: '/switch',
        description: 'Toggle controls for on/off settings',
      },
      {
        label: 'Checkbox',
        route: '/checkbox',
        description: 'Selection controls for multiple choices',
      },
      {
        label: 'Radio',
        route: '/radio',
        description: 'Selection controls for single-choice options',
      },
      {
        label: 'Slider',
        route: '/slider',
        description: 'Continuous, discrete, range, and centered MD3 sliders',
      },
    ],
  },
  {
    title: 'Containment & Display',
    description: 'Surfaces, lists, app bars, avatars, and progress',
    items: [
      {
        label: 'AppBar',
        route: '/appbar',
        description: 'Top app bars for navigation and actions',
      },
      {
        label: 'Card',
        route: '/card',
        description: 'Contained surfaces for grouping related content',
      },
      {
        label: 'List',
        route: '/list',
        description: 'Vertically arranged items with text and icons',
      },
      {
        label: 'Avatar',
        route: '/avatar',
        description: 'Circular user representations — image, icon, or initials',
      },
      {
        label: 'Progress',
        route: '/progress',
        description:
          'Linear and circular progress (determinate, indeterminate)',
      },
      {
        label: 'Loading Indicator',
        route: '/loading-indicator',
        description:
          'Expressive shape-morphing loading spinner (contained + uncontained)',
      },
      {
        label: 'Portal',
        route: '/portal',
        description:
          'Render overlays above the rest of the tree — toasts, dialogs, scrims',
      },
    ],
  },
]

const totalComponents = sections.reduce((sum, s) => sum + s.items.length, 0)

function Preview({ label, theme }: { label: string; theme: MaterialTheme }) {
  switch (label) {
    case 'Typography':
      return (
        <Column align="center" gap="xs">
          <Typography variant="displaySmall">Aa</Typography>
          <Typography variant="labelSmall" style={previewMutedText(theme)}>
            Type scale
          </Typography>
        </Column>
      )
    case 'Layout':
      return (
        <Column gap="xs">
          <Row gap="xs">
            <Box bg={theme.colors.primary} style={previewStyles.swatch} />
            <Box bg={theme.colors.secondary} style={previewStyles.swatch} />
            <Box bg={theme.colors.tertiary} style={previewStyles.swatch} />
          </Row>
          <Row gap="xs">
            <Box
              bg={theme.colors.primaryContainer}
              style={previewStyles.swatch}
            />
            <Box
              bg={theme.colors.secondaryContainer}
              style={previewStyles.swatch}
            />
            <Box
              bg={theme.colors.tertiaryContainer}
              style={previewStyles.swatch}
            />
          </Row>
        </Column>
      )
    case 'RTL':
      return (
        <Row gap="md" align="center">
          <MaterialCommunityIcons
            name="format-pilcrow-arrow-left"
            size={32}
            color={theme.colors.primary}
          />
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <MaterialCommunityIcons
            name="format-pilcrow-arrow-right"
            size={32}
            color={theme.colors.tertiary}
          />
        </Row>
      )
    case 'Button':
      return (
        <Column gap="xs">
          <Button variant="filled">Filled</Button>
          <Button variant="outlined">Outlined</Button>
        </Column>
      )
    case 'ButtonGroup':
      return (
        <ButtonGroup
          variant="connected"
          selectionMode="single"
          size="extraSmall"
          defaultValue="b"
          items={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
            { value: 'c', label: 'C' },
          ]}
        />
      )
    case 'IconButton':
      return (
        <Row gap="sm" align="center">
          <IconButton
            icon="heart-outline"
            variant="filled"
            accessibilityLabel="Like (filled)"
          />
          <IconButton
            icon="heart-outline"
            variant="tonal"
            accessibilityLabel="Like (tonal)"
          />
          <IconButton
            icon="heart-outline"
            variant="outlined"
            accessibilityLabel="Like (outlined)"
          />
        </Row>
      )
    case 'FAB':
      return (
        <Row gap="sm" wrap align="center" justify="center">
          <FAB icon="plus" accessibilityLabel="Add" />
          <FAB icon="pencil-outline" label="Edit" />
        </Row>
      )
    case 'Chip':
      return (
        <Row gap="xs" wrap justify="center">
          <Chip variant="filter" selected>
            Selected
          </Chip>
          <Chip variant="assist">Assist</Chip>
        </Row>
      )
    case 'TextField':
      return (
        <View style={previewStyles.fieldWrapper}>
          <TextField label="Email" variant="outlined" />
        </View>
      )
    case 'Keyboard Wrapper':
      return (
        <MaterialCommunityIcons
          name="keyboard-outline"
          size={48}
          color={theme.colors.primary}
        />
      )
    case 'Switch':
      return (
        <Row gap="md" align="center">
          <Switch value={true} />
          <Switch value={false} />
        </Row>
      )
    case 'Checkbox':
      return (
        <Row gap="md" align="center">
          <Checkbox value={true} />
          <Checkbox value={false} />
        </Row>
      )
    case 'Radio':
      return (
        <Row gap="md" align="center">
          <Radio value={true} />
          <Radio value={false} />
        </Row>
      )
    case 'Slider':
      return (
        <View style={previewStyles.sliderWrapper}>
          <Slider value={0.6} />
        </View>
      )
    case 'AppBar':
      return (
        <Row
          bg={theme.colors.surfaceContainer}
          style={previewStyles.appBar}
          align="center"
          gap="sm"
          px="sm"
        >
          <Box bg={theme.colors.onSurface} style={previewStyles.appBarHandle} />
          <View style={previewStyles.appBarSpacer}>
            <Box
              bg={theme.colors.onSurfaceVariant}
              style={previewStyles.appBarTitle}
            />
          </View>
          <Box bg={theme.colors.onSurface} style={previewStyles.appBarHandle} />
          <Box bg={theme.colors.onSurface} style={previewStyles.appBarHandle} />
        </Row>
      )
    case 'Card':
      return (
        <View style={previewStyles.cardMini}>
          <Card variant="elevated">
            <Column p="sm" gap="xs">
              <Typography variant="labelLarge">Card title</Typography>
              <Typography variant="labelSmall" style={previewMutedText(theme)}>
                Supporting line
              </Typography>
            </Column>
          </Card>
        </View>
      )
    case 'List':
      return (
        <Column style={previewStyles.listMini} gap="xs">
          <ListItem
            leadingContent={<Avatar size="xSmall" label="JD" />}
            headlineText="Jane Doe"
            supportingText="Updated just now"
          />
          <ListItem
            leadingContent={<Avatar size="xSmall" label="AK" />}
            headlineText="Alex Kim"
          />
        </Column>
      )
    case 'Avatar':
      return (
        <Row gap="sm" align="center">
          <Avatar size="small" label="JD" />
          <Avatar size="medium" label="AK" />
          <Avatar size="small" icon="account" />
        </Row>
      )
    case 'Progress':
      return (
        <Column gap="md" align="center" style={previewStyles.progressWrapper}>
          <LinearProgress progress={0.65} />
          <CircularProgress progress={0.5} size={36} />
        </Column>
      )
    case 'Portal':
      return (
        <View style={previewStyles.portalWrapper}>
          <Box
            bg={theme.colors.surfaceContainer}
            style={previewStyles.portalSurface}
          />
          <Box
            bg={theme.colors.inverseSurface}
            style={previewStyles.portalToast}
          />
        </View>
      )
    default:
      return null
  }
}

const previewMutedText = (theme: MaterialTheme) => ({
  color: theme.colors.onSurfaceVariant,
})

export default function HomeScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { width } = useWindowDimensions()
  const columnsForBreakpoint = useBreakpointValue({
    compact: 2,
    medium: 3,
    expanded: 4,
    large: 4,
  })
  // Two 128px-preview cards don't fit side by side under ~400dp (e.g. the
  // docs homepage phone-frame iframe) — fall back to a single column there.
  const columns = width < 400 ? 1 : columnsForBreakpoint
  const padding = useBreakpointValue({
    compact: 16,
    medium: 24,
    expanded: 32,
  })
  const previewHeight = useBreakpointValue({
    compact: 128,
    medium: 144,
    expanded: 160,
  })
  const heroVariant = useBreakpointValue({
    compact: 'displaySmall' as const,
    medium: 'displayMedium' as const,
    expanded: 'displayLarge' as const,
  })
  const taglineVariant = useBreakpointValue({
    compact: 'bodyLarge' as const,
    medium: 'titleMedium' as const,
    expanded: 'titleLarge' as const,
  })
  const sectionTitleVariant = useBreakpointValue({
    compact: 'titleMedium' as const,
    medium: 'titleLarge' as const,
  })

  const previewBoxStyle = useMemo(
    () => ({
      height: previewHeight,
      backgroundColor: theme.colors.surfaceContainerLow,
    }),
    [previewHeight, theme.colors.surfaceContainerLow],
  )
  const captionStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  )
  const descriptionStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant, minHeight: 32 }),
    [theme.colors.onSurfaceVariant],
  )
  const dotStyle = useMemo(
    () => ({ color: theme.colors.outlineVariant }),
    [theme.colors.outlineVariant],
  )

  const stats: Array<{ label: string; value: string }> = [
    { value: String(totalComponents), label: 'components' },
    { value: 'iOS · Android · Web', label: 'platforms' },
    { value: 'TypeScript', label: 'first' },
    { value: 'MIT', label: 'license' },
  ]

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { padding, paddingBottom: padding * 2 },
      ]}
    >
      <Column style={styles.container} gap="xl">
        <Column gap="md" style={styles.hero}>
          <Row gap="xs" align="center">
            <Chip variant="suggestion" leadingIcon="palette-outline">
              Material Design 3
            </Chip>
          </Row>
          <Typography variant={heroVariant}>RootNative UI</Typography>
          <Typography variant={taglineVariant} style={captionStyle}>
            Beautiful Material Design 3 components for React Native — copy,
            paste, ship.
          </Typography>
          <Row gap="md" wrap style={styles.statsRow}>
            {stats.map((stat, idx) => (
              <Row gap="md" align="center" key={stat.label}>
                <Column>
                  <Typography variant="titleMedium">{stat.value}</Typography>
                  <Typography variant="labelSmall" style={captionStyle}>
                    {stat.label}
                  </Typography>
                </Column>
                {idx < stats.length - 1 ? (
                  <Typography variant="titleMedium" style={dotStyle}>
                    ·
                  </Typography>
                ) : null}
              </Row>
            ))}
          </Row>
        </Column>

        {sections.map((section) => (
          <Column gap="md" key={section.title}>
            <Column gap="xs">
              <Typography variant={sectionTitleVariant}>
                {section.title}
              </Typography>
              <Typography variant="bodySmall" style={captionStyle}>
                {section.description}
              </Typography>
            </Column>
            <Grid columns={columns} gap="md">
              {section.items.map((item) => (
                <Card key={item.route} variant="outlined" style={styles.card}>
                  <Box align="center" justify="center" style={previewBoxStyle}>
                    <View
                      style={styles.previewInner}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      <Preview label={item.label} theme={theme} />
                    </View>
                  </Box>
                  <Column px="md" py="sm" gap="xs">
                    <Typography variant="titleMedium">{item.label}</Typography>
                    <Typography
                      variant="bodySmall"
                      style={descriptionStyle}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Typography>
                  </Column>
                  <Pressable
                    onPress={() => router.push(item.route)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    style={styles.pressOverlay}
                  />
                </Card>
              ))}
            </Grid>
          </Column>
        ))}
      </Column>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 1200,
  },
  hero: {
    paddingVertical: 16,
  },
  statsRow: {
    marginTop: 8,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  previewInner: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    pointerEvents: 'none',
  },
  pressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

const previewStyles = StyleSheet.create({
  swatch: {
    width: 22,
    height: 16,
    borderRadius: 4,
  },
  fieldWrapper: {
    width: '100%',
    maxWidth: 200,
  },
  sliderWrapper: {
    width: '100%',
    maxWidth: 200,
  },
  appBar: {
    width: '100%',
    maxWidth: 220,
    height: 40,
    borderRadius: 8,
  },
  appBarHandle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.7,
  },
  appBarTitle: {
    width: '70%',
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  appBarSpacer: {
    flex: 1,
  },
  cardMini: {
    width: '100%',
    maxWidth: 180,
  },
  listMini: {
    width: '100%',
    maxWidth: 220,
  },
  progressWrapper: {
    width: '100%',
    maxWidth: 180,
  },
  portalWrapper: {
    width: '100%',
    maxWidth: 180,
    height: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  portalSurface: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    opacity: 0.5,
  },
  portalToast: {
    position: 'absolute',
    bottom: 0,
    width: '70%',
    height: 24,
    borderRadius: 6,
  },
})
