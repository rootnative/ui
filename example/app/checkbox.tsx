import { Checkbox, Column, Row, Typography } from '@rootnative/components'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const topicLabels = ['Product updates', 'Security alerts', 'Weekly digest']

export default function CheckboxScreen() {
  const [checkA, setCheckA] = useState(true)
  const [checkB, setCheckB] = useState(false)
  const [checkC, setCheckC] = useState(false)
  const [redCheck, setRedCheck] = useState(true)
  const [topics, setTopics] = useState([true, false, false])
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const allTopics = topics.every(Boolean)
  const someTopics = topics.some(Boolean)
  const setTopic = (index: number) => (next: boolean) =>
    setTopics((prev) => prev.map((value, i) => (i === index ? next : value)))
  const toggleAllTopics = () => setTopics((prev) => prev.map(() => !allTopics))

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenIntro />
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
        <Typography variant="titleSmall">Indeterminate</Typography>
        <Row gap="sm" align="center">
          <Checkbox
            value={allTopics}
            indeterminate={someTopics && !allTopics}
            onValueChange={toggleAllTopics}
          />
          <Typography variant="bodyMedium">All notifications</Typography>
        </Row>
        <Column gap="sm" style={styles.indent}>
          {topicLabels.map((label, index) => (
            <Row key={label} gap="sm" align="center">
              <Checkbox value={topics[index]} onValueChange={setTopic(index)} />
              <Typography variant="bodyMedium">{label}</Typography>
            </Row>
          ))}
        </Column>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Error</Typography>
        <Row gap="sm" align="center">
          <Checkbox
            value={acceptedTerms}
            onValueChange={setAcceptedTerms}
            error={!acceptedTerms}
          />
          <Typography variant="bodyMedium">
            Accept the terms (required)
          </Typography>
        </Row>
        <Row gap="sm" align="center">
          <Checkbox value error />
          <Typography variant="bodyMedium">Checked (error)</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Checkbox indeterminate error />
          <Typography variant="bodyMedium">Indeterminate (error)</Typography>
        </Row>
        <Row gap="sm" align="center">
          <Checkbox value error disabled />
          <Typography variant="bodyMedium">Disabled wins over error</Typography>
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

      <Column gap="sm">
        <Typography variant="titleSmall">Custom Check Icon</Typography>
        <Row gap="sm" align="center">
          <Checkbox value checkIcon="star" />
          <Typography variant="bodyMedium">
            checkIcon — for resolvers that don&apos;t map the default
            &quot;check&quot; name
          </Typography>
        </Row>
      </Column>
      <ScreenNavFooter />
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
  indent: {
    paddingStart: 32,
  },
})
