import { Box, Column, Grid, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { ScrollView, StyleSheet } from 'react-native'

function Swatch({ label, wide }: { label: string; wide?: boolean }) {
  const { colors } = useTheme()
  return (
    <Box
      p="sm"
      align="center"
      justify="center"
      style={[
        styles.swatch,
        wide ? styles.swatchWide : null,
        { backgroundColor: colors.primaryContainer },
      ]}
    >
      <Typography variant="labelSmall">{label}</Typography>
    </Box>
  )
}

export default function LayoutScreen() {
  const { colors } = useTheme()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Layout Showcase</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Box — Spacing &amp; Background
        </Typography>
        <Box p="lg" bg={colors.secondaryContainer} style={styles.rounded}>
          <Typography variant="bodyMedium">
            Box with large padding and themed background.
          </Typography>
        </Box>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Box — Directional Padding (pt / pb / ps / pe)
        </Typography>
        <Box
          pt="xs"
          pb="lg"
          ps="xl"
          pe="xs"
          bg={colors.tertiaryContainer}
          style={styles.rounded}
        >
          <Box p="sm" bg={colors.surface} style={styles.rounded}>
            <Typography variant="bodySmall">
              pt=xs · pb=lg · ps=xl · pe=xs — start/end are logical, so they
              flip when you toggle RTL from the app bar.
            </Typography>
          </Box>
        </Box>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Box — Margins (mx / my / mt / mb / ms / me)
        </Typography>
        <Box bg={colors.surfaceVariant} style={styles.rounded}>
          <Box
            mx="lg"
            my="sm"
            p="sm"
            bg={colors.primaryContainer}
            style={styles.rounded}
          >
            <Typography variant="labelSmall">mx=lg · my=sm</Typography>
          </Box>
          <Box
            mt="xs"
            mb="lg"
            ms="xl"
            me="sm"
            p="sm"
            bg={colors.secondaryContainer}
            style={styles.rounded}
          >
            <Typography variant="labelSmall">
              mt=xs · mb=lg · ms=xl · me=sm
            </Typography>
          </Box>
        </Box>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Row</Typography>
        <Row gap="sm">
          <Swatch label="A" />
          <Swatch label="B" />
          <Swatch label="C" />
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Row — rowGap vs columnGap</Typography>
        <Typography variant="bodySmall">
          Tight columnGap, generous rowGap — visible once the items wrap.
        </Typography>
        <Row wrap rowGap="lg" columnGap="xs">
          <Swatch wide label="1" />
          <Swatch wide label="2" />
          <Swatch wide label="3" />
          <Swatch wide label="4" />
          <Swatch wide label="5" />
          <Swatch wide label="6" />
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Row — Inverted</Typography>
        <Typography variant="bodySmall">
          Source order is A, B, C — inverted renders it C, B, A.
        </Typography>
        <Row gap="sm" inverted>
          <Swatch label="A" />
          <Swatch label="B" />
          <Swatch label="C" />
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Row — Space Between</Typography>
        <Row gap="sm" justify="space-between">
          <Swatch label="Start" />
          <Swatch label="End" />
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Column</Typography>
        <Column gap="sm">
          <Swatch label="1" />
          <Swatch label="2" />
          <Swatch label="3" />
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Column — Inverted</Typography>
        <Typography variant="bodySmall">
          Source order is 1, 2, 3 — inverted stacks it bottom-up.
        </Typography>
        <Column gap="sm" inverted>
          <Swatch label="1" />
          <Swatch label="2" />
          <Swatch label="3" />
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Grid — 3 Columns</Typography>
        <Grid columns={3} gap="sm">
          <Swatch label="1" />
          <Swatch label="2" />
          <Swatch label="3" />
          <Swatch label="4" />
          <Swatch label="5" />
          <Swatch label="6" />
        </Grid>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Grid — 2 Columns</Typography>
        <Grid columns={2} gap="sm">
          <Swatch label="A" />
          <Swatch label="B" />
          <Swatch label="C" />
          <Swatch label="D" />
        </Grid>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Nested Layout</Typography>
        <Column
          gap="sm"
          p="md"
          bg={colors.surfaceVariant}
          style={styles.rounded}
        >
          <Row gap="sm" justify="space-between" align="center">
            <Typography variant="titleMedium">Header</Typography>
            <Swatch label="Icon" />
          </Row>
          <Grid columns={3} gap="sm">
            <Swatch label="1" />
            <Swatch label="2" />
            <Swatch label="3" />
          </Grid>
        </Column>
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
  swatch: {
    borderRadius: 8,
    minHeight: 48,
  },
  swatchWide: {
    minWidth: 96,
  },
  rounded: {
    borderRadius: 12,
  },
})
