import { Column, Row, Switch, Typography } from '@rootnative/components'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export default function SwitchScreen() {
  const [basic, setBasic] = useState(false)
  const [withIcon, setWithIcon] = useState(true)
  const [customIcon, setCustomIcon] = useState(false)
  const [greenSwitch, setGreenSwitch] = useState(true)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="headlineSmall">Switch</Typography>

      <Column gap="sm">
        <Typography variant="titleSmall">Basic</Typography>
        <Row gap="md" align="center">
          <Switch value={basic} onValueChange={setBasic} />
          <Typography variant="bodyMedium">{basic ? 'On' : 'Off'}</Typography>
        </Row>
        <Row gap="md" align="center">
          <Switch value={withIcon} onValueChange={setWithIcon} />
          <Typography variant="bodyMedium">With check icon</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Icons</Typography>
        <Row gap="md" align="center">
          <Switch
            value={customIcon}
            onValueChange={setCustomIcon}
            selectedIcon="bell"
            unselectedIcon="bell-off"
          />
          <Typography variant="bodyMedium">Bell / Bell-off</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled</Typography>
        <Row gap="md" align="center">
          <Switch value={false} disabled />
          <Typography variant="bodyMedium">Off (disabled)</Typography>
        </Row>
        <Row gap="md" align="center">
          <Switch value disabled />
          <Typography variant="bodyMedium">On (disabled)</Typography>
        </Row>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Colors</Typography>
        <Row gap="md" align="center">
          <Switch
            value={greenSwitch}
            onValueChange={setGreenSwitch}
            containerColor="#2E7D32"
            contentColor="#C8E6C9"
          />
          <Typography variant="bodyMedium">Green switch</Typography>
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
