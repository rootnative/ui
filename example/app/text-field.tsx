import {
  KeyboardAvoidingWrapper,
  TextField,
  Typography,
  Column,
  Row,
} from '@rootnative/components'
import { useState } from 'react'
import { StyleSheet } from 'react-native'

export default function TextFieldScreen() {
  const [filledValue, setFilledValue] = useState('')
  const [outlinedValue, setOutlinedValue] = useState('')
  const [errorValue, setErrorValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [multilineValue, setMultilineValue] = useState('')
  const [bioValue, setBioValue] = useState('')
  const [couponValue, setCouponValue] = useState('')

  return (
    <KeyboardAvoidingWrapper
      scrollViewProps={{ bounces: false }}
      contentContainerStyle={styles.content}
    >
      <Typography variant="headlineSmall">TextField Showcase</Typography>

      <Column gap="lg">
        <Typography variant="titleSmall">Filled Variant</Typography>
        <TextField
          label="Label"
          value={filledValue}
          onChangeText={setFilledValue}
          supportingText="Supporting text"
        />
        <TextField
          label="With icons"
          leadingIcon="magnify"
          trailingIcon="close-circle"
          onTrailingIconPress={() => {}}
        />
        <TextField label="Disabled" disabled value="Disabled value" />
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Outlined Variant</Typography>
        <TextField
          variant="outlined"
          label="Label"
          value={outlinedValue}
          onChangeText={setOutlinedValue}
          supportingText="Supporting text"
        />
        <TextField
          variant="outlined"
          label="With icons"
          leadingIcon="magnify"
          trailingIcon="close-circle"
          onTrailingIconPress={() => {}}
        />
        <TextField
          variant="outlined"
          label="Disabled"
          disabled
          value="Disabled value"
        />
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Error States</Typography>
        <Row gap="md">
          <TextField
            label="Filled error"
            value={errorValue}
            onChangeText={setErrorValue}
            error
            errorText="Error message goes here"
            trailingIcon="alert-circle"
            style={styles.flex}
          />
          <TextField
            variant="outlined"
            label="Outlined error"
            value={errorValue}
            onChangeText={setErrorValue}
            error
            errorText="Error message goes here"
            trailingIcon="alert-circle"
            style={styles.flex}
          />
        </Row>
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Password</Typography>
        <TextField
          label="Password"
          value={passwordValue}
          onChangeText={setPasswordValue}
          secureTextEntry={!showPassword}
          trailingIcon={showPassword ? 'eye-off' : 'eye'}
          onTrailingIconPress={() => setShowPassword((prev) => !prev)}
          trailingIconAccessibilityLabel={
            showPassword ? 'Hide password' : 'Show password'
          }
        />
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Character Counter</Typography>
        <TextField
          label="Bio"
          value={bioValue}
          onChangeText={setBioValue}
          maxLength={80}
          supportingText="Counter shows automatically once maxLength is set"
        />
        <TextField
          variant="outlined"
          label="Bio (counter hidden)"
          value={bioValue}
          onChangeText={setBioValue}
          maxLength={80}
          showCharacterCounter={false}
          supportingText="Same maxLength, showCharacterCounter turned off"
        />
        <TextField
          label="Bio (error)"
          value={bioValue}
          onChangeText={setBioValue}
          maxLength={80}
          error
          errorText="Counter keeps its place next to the error message"
        />
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Custom Input Style</Typography>
        <TextField
          variant="outlined"
          label="Coupon code"
          value={couponValue}
          onChangeText={setCouponValue}
          autoCapitalize="characters"
          autoCorrect={false}
          inputStyle={styles.codeInput}
          supportingText="inputStyle targets the input text only — the label keeps its own type"
        />
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <TextField
          label="Custom container"
          containerColor="#E8F5E9"
          contentColor="#2E7D32"
        />
        <TextField
          variant="outlined"
          label="Custom outlined"
          containerColor="#FFF3E0"
          contentColor="#E65100"
        />
      </Column>

      <Column gap="lg">
        <Typography variant="titleSmall">Multiline</Typography>
        <TextField
          label="Description"
          value={multilineValue}
          onChangeText={setMultilineValue}
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
  flex: {
    flex: 1,
  },
  codeInput: {
    letterSpacing: 4,
    fontWeight: '600',
  },
})
