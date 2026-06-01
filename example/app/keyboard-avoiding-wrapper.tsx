import {
  KeyboardAvoidingWrapper,
  TextField,
  Typography,
  Column,
  Row,
  Switch,
  Box,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useState } from 'react'
import { StyleSheet } from 'react-native'

export default function KeyboardAvoidingWrapperScreen() {
  const [enabled, setEnabled] = useState(true)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  const theme = useTheme()
  const subtleColor = theme.colors.onSurfaceVariant

  return (
    <KeyboardAvoidingWrapper
      enabled={enabled}
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
            <Typography variant="bodySmall" style={{ color: subtleColor }}>
              Toggle keyboard avoidance on/off
            </Typography>
          </Column>
          <Switch value={enabled} onValueChange={setEnabled} />
        </Row>
      </Column>

      <Box
        px="md"
        py="sm"
        style={[
          styles.statusBadge,
          {
            backgroundColor: keyboardVisible
              ? theme.colors.primaryContainer
              : theme.colors.surfaceContainerHigh,
          },
        ]}
      >
        <Typography
          variant="labelMedium"
          style={{
            color: keyboardVisible
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurfaceVariant,
          }}
        >
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
