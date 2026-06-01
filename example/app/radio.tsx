import { Column, Radio, Row, Typography } from '@rootnative/components'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export default function RadioScreen() {
  const [radioValue, setRadioValue] = useState<string>('option1')
  const [blueRadio, setBlueRadio] = useState<string>('blue')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Radio</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Radio Group</Typography>
        <Row gap="sm" align="center">
          <Radio
            value={radioValue === 'option1'}
            onValueChange={() => setRadioValue('option1')}
          />
          <Typography variant="bodyMedium">Option 1</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Radio
            value={radioValue === 'option2'}
            onValueChange={() => setRadioValue('option2')}
          />
          <Typography variant="bodyMedium">Option 2</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Radio
            value={radioValue === 'option3'}
            onValueChange={() => setRadioValue('option3')}
          />
          <Typography variant="bodyMedium">Option 3</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled</Typography>
        <Row gap="sm" align="center">
          <Radio value={false} disabled />
          <Typography variant="bodyMedium">Unselected (disabled)</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Radio value disabled />
          <Typography variant="bodyMedium">Selected (disabled)</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <Row gap="sm" align="center">
          <Radio
            value={blueRadio === 'blue'}
            onValueChange={() =>
              setBlueRadio((v) => (v === 'blue' ? '' : 'blue'))
            }
            containerColor="#1565C0"
          />
          <Typography variant="bodyMedium">Blue radio</Typography>
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
    padding: 24,
    rowGap: 20,
  },
})
