import {
  KeyboardAvoidingWrapper,
  TextField,
  Typography,
  ButtonGroup,
  Column,
  Row,
  Slider,
  Switch,
  Box,
} from '@rootnative/components'
import type { ButtonGroupItem, SliderValue } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import type { KeyboardAvoidingViewProps } from 'react-native'
import { StyleSheet } from 'react-native'

type Behavior = NonNullable<KeyboardAvoidingViewProps['behavior']>

const behaviorItems: ButtonGroupItem[] = [
  { value: 'padding', label: 'padding' },
  { value: 'height', label: 'height' },
  { value: 'position', label: 'position' },
]

export default function KeyboardAvoidingWrapperScreen() {
  const [enabled, setEnabled] = useState(true)
  const [behavior, setBehavior] = useState<Behavior>('padding')
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  const theme = useTheme()
  const subtleStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  )
  const badgeStyle = useMemo(
    () => ({
      backgroundColor: keyboardVisible
        ? theme.colors.primaryContainer
        : theme.colors.surfaceContainerHigh,
    }),
    [
      keyboardVisible,
      theme.colors.primaryContainer,
      theme.colors.surfaceContainerHigh,
    ],
  )
  const badgeLabelStyle = useMemo(
    () => ({
      color: keyboardVisible
        ? theme.colors.onPrimaryContainer
        : theme.colors.onSurfaceVariant,
    }),
    [
      keyboardVisible,
      theme.colors.onPrimaryContainer,
      theme.colors.onSurfaceVariant,
    ],
  )

  const handleBehaviorChange = (value: string | null) => {
    if (value) setBehavior(value as Behavior)
  }
  const handleOffsetChange = (value: SliderValue) => {
    if (typeof value === 'number') setVerticalOffset(value)
  }

  return (
    <KeyboardAvoidingWrapper
      enabled={enabled}
      behavior={behavior}
      keyboardVerticalOffset={verticalOffset}
      onKeyboardShow={() => setKeyboardVisible(true)}
      onKeyboardHide={() => setKeyboardVisible(false)}
      scrollViewProps={{ bounces: false }}
      contentContainerStyle={styles.content}
    >
      <Typography variant="headlineSmall">KeyboardAvoidingWrapper</Typography>

      <Column gap="lg">
        <Typography variant="titleSmall">Settings</Typography>

        <Row justify="space-between" align="center">
          <Column>
            <Typography variant="bodyMedium">enabled</Typography>
            <Typography variant="bodySmall" style={subtleStyle}>
              Toggle keyboard avoidance on/off
            </Typography>
          </Column>
          <Switch value={enabled} onValueChange={setEnabled} />
        </Row>

        <Column gap="xs">
          <Typography variant="bodyMedium">behavior</Typography>
          <Typography variant="bodySmall" style={subtleStyle}>
            Avoidance strategy — iOS honors all three, Android generally resizes
            the window on its own.
          </Typography>
          <ButtonGroup
            variant="connected"
            selectionMode="single"
            size="extraSmall"
            value={behavior}
            onValueChange={handleBehaviorChange}
            items={behaviorItems}
          />
        </Column>

        <Column gap="xs">
          <Typography variant="bodyMedium">
            keyboardVerticalOffset: {verticalOffset}
          </Typography>
          <Typography variant="bodySmall" style={subtleStyle}>
            Extra space added on top of the keyboard height — use it to account
            for a header or tab bar.
          </Typography>
          <Slider
            value={verticalOffset}
            onValueChange={handleOffsetChange}
            minimumValue={0}
            maximumValue={120}
            step={12}
          />
        </Column>
      </Column>

      <Box px="md" py="sm" style={[styles.statusBadge, badgeStyle]}>
        <Typography variant="labelMedium" style={badgeLabelStyle}>
          Keyboard: {keyboardVisible ? 'visible' : 'hidden'}
        </Typography>
      </Box>

      <Column gap="lg">
        <Typography variant="titleSmall">Form Demo</Typography>
        <TextField label="Name" value={name} onChangeText={setName} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextField label="Address" value={address} onChangeText={setAddress} />
        <TextField label="City" value={city} onChangeText={setCity} />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </Column>
    </KeyboardAvoidingWrapper>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 120,
    rowGap: 28,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
})
