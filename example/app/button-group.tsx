import { ButtonGroup, Column, Typography } from '@rootnative/components'
import type { ButtonGroupItem, ButtonGroupSize } from '@rootnative/components'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

const alignmentItems: ButtonGroupItem[] = [
  { value: 'left', label: 'Left', leadingIcon: 'format-align-left' },
  { value: 'center', label: 'Center', leadingIcon: 'format-align-center' },
  { value: 'right', label: 'Right', leadingIcon: 'format-align-right' },
  { value: 'justify', label: 'Justify', leadingIcon: 'format-align-justify' },
]

const formattingItems: ButtonGroupItem[] = [
  { value: 'bold', label: 'Bold', leadingIcon: 'format-bold' },
  { value: 'italic', label: 'Italic', leadingIcon: 'format-italic' },
  {
    value: 'underline',
    label: 'Underline',
    leadingIcon: 'format-underline',
  },
]

const actionItems: ButtonGroupItem[] = [
  { value: 'reply', label: 'Reply', leadingIcon: 'reply' },
  { value: 'forward', label: 'Forward', leadingIcon: 'share' },
  { value: 'archive', label: 'Archive', leadingIcon: 'archive-outline' },
]

const sizes: ButtonGroupSize[] = [
  'extraSmall',
  'small',
  'medium',
  'large',
  'extraLarge',
]

export default function ButtonGroupScreen() {
  const [alignment, setAlignment] = useState<string | null>('left')
  const [formatting, setFormatting] = useState<string[]>(['bold'])
  const [connectedAlignment, setConnectedAlignment] = useState<string | null>(
    'center',
  )
  const [connectedFormatting, setConnectedFormatting] = useState<string[]>([
    'bold',
    'italic',
  ])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Button Group Showcase</Typography>
      <Typography variant="bodyMedium" style={styles.muted}>
        MD3 Expressive Button Groups — replaces the deprecated Segmented Button.
      </Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Standard · single select</Typography>
        <ButtonGroup
          variant="standard"
          selectionMode="single"
          value={alignment}
          onValueChange={setAlignment}
          items={alignmentItems}
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Standard · multiple select</Typography>
        <ButtonGroup
          variant="standard"
          selectionMode="multiple"
          value={formatting}
          onValueChange={setFormatting}
          items={formattingItems}
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Connected · single select</Typography>
        <ButtonGroup
          variant="connected"
          selectionMode="single"
          value={connectedAlignment}
          onValueChange={setConnectedAlignment}
          items={alignmentItems}
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Connected · multiple select
        </Typography>
        <ButtonGroup
          variant="connected"
          selectionMode="multiple"
          value={connectedFormatting}
          onValueChange={setConnectedFormatting}
          items={formattingItems}
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Standard · actions only</Typography>
        <Typography variant="bodySmall" style={styles.muted}>
          selectionMode=&quot;none&quot; — items act as standalone buttons.
        </Typography>
        <ButtonGroup
          variant="standard"
          selectionMode="none"
          items={actionItems}
          onItemPress={() => {}}
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Sizes</Typography>
        {sizes.map((size) => (
          <Column key={size} gap="xs">
            <Typography variant="labelSmall" style={styles.muted}>
              {size}
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sizeScrollContent}
            >
              <ButtonGroup
                variant="connected"
                selectionMode="single"
                size={size}
                defaultValue="center"
                items={[
                  {
                    value: 'left',
                    leadingIcon: 'format-align-left',
                    accessibilityLabel: 'Align left',
                  },
                  {
                    value: 'center',
                    leadingIcon: 'format-align-center',
                    accessibilityLabel: 'Align center',
                  },
                  {
                    value: 'right',
                    leadingIcon: 'format-align-right',
                    accessibilityLabel: 'Align right',
                  },
                ]}
              />
            </ScrollView>
          </Column>
        ))}
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled</Typography>
        <ButtonGroup
          variant="connected"
          selectionMode="single"
          defaultValue="b"
          disabled
          items={[
            { value: 'a', label: 'One' },
            { value: 'b', label: 'Two' },
            { value: 'c', label: 'Three' },
          ]}
        />
        <Typography variant="bodySmall" style={styles.muted}>
          Per-item disabled
        </Typography>
        <ButtonGroup
          variant="standard"
          selectionMode="single"
          defaultValue="a"
          items={[
            { value: 'a', label: 'Available' },
            { value: 'b', label: 'Locked', disabled: true },
            { value: 'c', label: 'Available' },
          ]}
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom colors</Typography>
        <ButtonGroup
          variant="connected"
          selectionMode="single"
          defaultValue="b"
          containerColor="#E8DEF8"
          contentColor="#4A148C"
          selectedContainerColor="#6750A4"
          selectedContentColor="#FFFFFF"
          items={[
            { value: 'a', label: 'Day', leadingIcon: 'weather-sunny' },
            { value: 'b', label: 'Night', leadingIcon: 'weather-night' },
            { value: 'c', label: 'Auto', leadingIcon: 'theme-light-dark' },
          ]}
        />
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
    rowGap: 24,
  },
  muted: {
    opacity: 0.7,
  },
  sizeScrollContent: {
    paddingEnd: 24,
  },
})
