import { Checkbox, Column, Row, Typography } from '@rootnative/components'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export default function CheckboxScreen() {
  const [checkA, setCheckA] = useState(true)
  const [checkB, setCheckB] = useState(false)
  const [checkC, setCheckC] = useState(false)
  const [redCheck, setRedCheck] = useState(true)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Checkbox</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Basic</Typography>
        <Row gap="sm" align="center">
          <Checkbox value={checkA} onValueChange={setCheckA} />
          <Typography variant="bodyMedium">Notifications</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Checkbox value={checkB} onValueChange={setCheckB} />
          <Typography variant="bodyMedium">Dark mode</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Checkbox value={checkC} onValueChange={setCheckC} />
          <Typography variant="bodyMedium">Auto-update</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled</Typography>
        <Row gap="sm" align="center">
          <Checkbox value={false} disabled />
          <Typography variant="bodyMedium">Unchecked (disabled)</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Checkbox value disabled />
          <Typography variant="bodyMedium">Checked (disabled)</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <Row gap="sm" align="center">
          <Checkbox
            value={redCheck}
            onValueChange={setRedCheck}
            containerColor="#B00020"
            contentColor="#FFFFFF"
          />
          <Typography variant="bodyMedium">Red checkbox</Typography>
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
