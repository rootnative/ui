import { Column, Slider, Typography } from '@rootnative/components'
import type { SliderValue } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

export default function SliderScreen() {
  const theme = useTheme()
  const [continuous, setContinuous] = useState(0.4)
  const [discrete, setDiscrete] = useState(40)
  const [withIcons, setWithIcons] = useState(0.6)
  const [centered, setCentered] = useState(0)
  const [rangeContinuous, setRangeContinuous] = useState<[number, number]>([
    25, 75,
  ])
  const [rangeDiscrete, setRangeDiscrete] = useState<[number, number]>([2, 6])
  const [custom, setCustom] = useState(0.5)
  const [noTicks, setNoTicks] = useState(50)
  const [temperature, setTemperature] = useState(21)
  const [committedTemperature, setCommittedTemperature] = useState(21)

  const setSingle = (setter: (n: number) => void) => (v: SliderValue) => {
    if (typeof v === 'number') setter(v)
  }
  const setRange =
    (setter: (r: [number, number]) => void) => (v: SliderValue) => {
      if (Array.isArray(v)) setter(v as [number, number])
    }

  const captionStyle = { color: theme.colors.onSurfaceVariant }
  const formatTemperature = (value: number) => `${Math.round(value)}°C`

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenIntro />
      <Column gap="sm">
        <Typography variant="titleSmall">Continuous</Typography>
        <Slider value={continuous} onValueChange={setSingle(setContinuous)} />
        <Typography variant="bodySmall" style={captionStyle}>
          Value: {continuous.toFixed(2)}
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Discrete (step = 10)</Typography>
        <Slider
          value={discrete}
          onValueChange={setSingle(setDiscrete)}
          minimumValue={0}
          maximumValue={100}
          step={10}
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Value: {discrete}
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Discrete without tick marks (step = 25)
        </Typography>
        <Slider
          value={noTicks}
          onValueChange={setSingle(setNoTicks)}
          minimumValue={0}
          maximumValue={100}
          step={25}
          showTickMarks={false}
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Value: {noTicks} — still snaps to the step, tick marks suppressed with
          showTickMarks
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Formatted label + commit on release
        </Typography>
        <Slider
          value={temperature}
          onValueChange={setSingle(setTemperature)}
          onSlidingComplete={setSingle(setCommittedTemperature)}
          minimumValue={16}
          maximumValue={30}
          step={1}
          showValueLabel="always"
          formatValueLabel={formatTemperature}
          startIcon="snowflake"
          endIcon="white-balance-sunny"
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Dragging: {formatTemperature(temperature)} · committed:{' '}
          {formatTemperature(committedTemperature)} — the second value only
          updates on release via onSlidingComplete
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">With start / end icons</Typography>
        <Slider
          value={withIcons}
          onValueChange={setSingle(setWithIcons)}
          startIcon="volume-low"
          endIcon="volume-high"
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Volume: {Math.round(withIcons * 100)}%
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Centered (−50 to 50)</Typography>
        <Slider
          value={centered}
          onValueChange={setSingle(setCentered)}
          minimumValue={-50}
          maximumValue={50}
          step={5}
          centered
          showValueLabel="always"
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Balance: {centered}
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Range — continuous</Typography>
        <Slider
          value={rangeContinuous}
          onValueChange={setRange(setRangeContinuous)}
          minimumValue={0}
          maximumValue={100}
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Range: {Math.round(rangeContinuous[0])} –{' '}
          {Math.round(rangeContinuous[1])}
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">
          Range — discrete (step = 1)
        </Typography>
        <Slider
          value={rangeDiscrete}
          onValueChange={setRange(setRangeDiscrete)}
          minimumValue={0}
          maximumValue={10}
          step={1}
          showValueLabel="always"
        />
        <Typography variant="bodySmall" style={captionStyle}>
          Range: {rangeDiscrete[0]} – {rangeDiscrete[1]}
        </Typography>
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Custom colors</Typography>
        <Slider
          value={custom}
          onValueChange={setSingle(setCustom)}
          containerColor="#2E7D32"
          contentColor="#1B5E20"
          inactiveTrackColor="#C8E6C9"
        />
      </Column>

      <Column gap="sm">
        <Typography variant="titleSmall">Disabled</Typography>
        <Slider value={0.7} disabled />
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
})
