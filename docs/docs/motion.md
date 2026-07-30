---
sidebar_position: 8
---

# Motion

Every animation in RootNative UI runs on [`@rootnative/inertia`](https://rootnative.github.io/inertia/) — the theme owns the motion *values*, inertia owns the *mechanism*. Nothing in the library calls React Native's `Animated` API or `react-native-reanimated` directly.

Two things follow from that, and they're the whole page:

1. **Motion tokens are theme tokens.** Change `theme.motion` and every component's timing changes with it.
2. **Reduced motion is honored out of the box.** `ThemeProvider` opts the whole tree into the OS accessibility setting, and every animated component collapses to a hard cut when it's on.

## Setup

There isn't any. `ThemeProvider` already mounts inertia's `<MotionConfig>` for you:

```tsx
import { ThemeProvider } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider>
      {/* motion tokens registered, reduced motion respected */}
      <MyApp />
    </ThemeProvider>
  )
}
```

`@rootnative/inertia` is a **required** peer of both `@rootnative/core` and `@rootnative/components`, so npm and pnpm install it for you. Yarn classic users need to add it by hand — see [Installation](./installation#peer-dependencies).

## Motion tokens

The theme's `motion` group holds three kinds of value:

| Group | Tokens | Used for |
|-------|--------|----------|
| Durations | `durationShort1`–`durationExtraLong4` (50ms–1000ms) | Timing-based transitions |
| Easings | `easingLinear`, `easingStandard*`, `easingEmphasized*` | Cubic-bezier curves, as CSS-style strings |
| Springs | `springFastSpatial`, `springDefaultSpatial`, `springSlowSpatial`, `springFastEffects`, `springDefaultEffects`, `springSlowEffects` | Everything the components animate today |

The spring tokens follow the MD3 Expressive motion-physics scheme, pinned from androidx `ExpressiveMotionTokens.kt`. The naming is a grid — **fast / default / slow** × **spatial / effects**:

- **Spatial** springs move things (position, size, corner radius, a thumb sliding). They overshoot: damping ratio 0.6 for fast, 0.8 for default and slow.
- **Effects** springs change appearance (color, opacity, state layers). They're critically damped and never overshoot.

```tsx
const theme = useTheme()

theme.motion.springFastSpatial   // { tension: 800, friction: 33.94, mass: 1 }
theme.motion.springFastEffects   // { tension: 3800, friction: 123.29, mass: 1 }
theme.motion.durationMedium2     // 300
theme.motion.easingEmphasized    // 'cubic-bezier(0.2, 0, 0, 1)'
```

`tension` / `friction` / `mass` is the react-spring vocabulary inertia uses. `tension` is Compose's `stiffness`; `friction` is `dampingRatio * 2 * sqrt(tension)`.

### Named transitions

`ThemeProvider` registers each motion token with inertia under a string name, so anywhere inertia accepts a transition you can pass the name instead of rebuilding the config:

| Name | Token |
|------|-------|
| `'state-hover'`, `'state-press'`, `'state-focus'` | `springFastEffects` |
| `'spring-fast-spatial'` | `springFastSpatial` |
| `'spring-default-spatial'` | `springDefaultSpatial` |
| `'spring-slow-spatial'` | `springSlowSpatial` |
| `'spring-fast-effects'` | `springFastEffects` |
| `'spring-default-effects'` | `springDefaultEffects` |
| `'spring-slow-effects'` | `springSlowEffects` |

```tsx
import { Motion } from '@rootnative/inertia'

<Motion.View animate={{ opacity: 1 }} transition="spring-default-effects" />
```

The names are registered as TypeScript types too, so they autocomplete and a typo is a compile error. Nest your own `<MotionConfig transitions>` to add more — nested registries merge, child wins.

#### `motionTransitions` — build that registry yourself

The mapping in the table above is a pure function, exported for the case where you mount a `<MotionConfig>` that `ThemeProvider` isn't the parent of:

```tsx
import { motionTransitions, useTheme } from '@rootnative/core'
import { MotionConfig } from '@rootnative/inertia'

function MotionIsland({ children }) {
  const theme = useTheme()
  return (
    <MotionConfig transitions={motionTransitions(theme.motion)}>
      {children}
    </MotionConfig>
  )
}
```

`motionTransitions(motion)` takes a theme's `motion` object and returns inertia's `NamedTransitions` — the nine names in the table, resolved against those tokens. You don't need it for normal use: `ThemeProvider` already calls it and feeds the result to its own `MotionConfig`, and a nested `MotionConfig` inherits what the parent registered. Reach for it when you're overriding `reducedMotion` on a nested config and want to be explicit about carrying the theme's transitions through, or when you're driving inertia from outside a `ThemeProvider` entirely.

### Retuning motion

Motion is part of the theme, so retuning it is a theme override:

```tsx
import { ThemeProvider, lightTheme } from '@rootnative/core'

const calmTheme = {
  ...lightTheme,
  motion: {
    ...lightTheme.motion,
    // Critically damped — kill the Expressive overshoot everywhere.
    springDefaultSpatial: { tension: 380, friction: 39, mass: 1 },
  },
}

<ThemeProvider theme={calmTheme}>{children}</ThemeProvider>
```

Every component that references `springDefaultSpatial` picks the new value up — no per-component props to thread.

## Elevation on hover

Four components raise their shadow one MD3 elevation level while hovered, and interpolate between the two levels rather than swapping them:

| Component | Rest → hover | Applies when |
|-----------|--------------|--------------|
| `Card` | `level1` → `level2` | `variant="elevated"`, interactive (`onPress` set), not disabled |
| `Button` | `level1` → `level2` | `variant="elevated"`, not disabled |
| `Chip` | `level1` → `level2` | `elevated`, on any variant except `input`, not disabled |
| `FAB` | `level3` → `level4` | Always (FAB is elevated by definition), not disabled |

This is hover, so in practice it's web, a trackpad, or a pointer-capable tablet — touch has no hover state, and nothing changes on a phone. Disabled surfaces stay flat at their resting level; the raise is interaction feedback, and a control that can't be interacted with shouldn't offer it.

There's nothing to configure and no prop to opt out. If you need a fixed shadow, set it in `style` on a non-interactive variant, or retune the elevation tokens on the theme — both endpoints read `theme.elevation.*`, so a flatter theme flattens the hover raise with it.

## Reduced motion

Users who set **Reduce Motion** (iOS), **Remove animations** (Android), or `prefers-reduced-motion: reduce` (web) get a library that still works and still changes state — it just stops interpolating between states. A checkbox mark appears instead of springing in; a switch thumb jumps to the other end; the loading indicator's shape morph and spin both stop.

This is on by default. `ThemeProvider` mounts `<MotionConfig>` with inertia's default `reducedMotion="user"`, which reads the OS setting through Reanimated's `useReducedMotion()`.

Every component animates something and therefore responds to the setting, except these five, which have no animated value at all: `Divider`, `KeyboardAvoidingWrapper`, `Layout` (`Box`, `Row`, `Column`, `Grid`), `Portal`, and `Typography`.

That includes the overlay surfaces — `Dialog`, `Menu`, `Tooltip`, `Snackbar` and `BottomSheet` all cut straight to their open state instead of scaling and fading in, and `BottomSheet` still drags: a gesture you are actively driving is not an animation, so reduced motion only collapses the release settle.

### Overriding it

Nest an inertia `<MotionConfig>` anywhere below `ThemeProvider`:

```tsx
import { MotionConfig } from '@rootnative/inertia'

// Force animations on for a subtree, ignoring the OS setting.
<MotionConfig reducedMotion="never">
  <Onboarding />
</MotionConfig>

// Force them off — useful for snapshot tests and screenshot tooling.
<MotionConfig reducedMotion="always">
  <App />
</MotionConfig>
```

| Value | Behavior |
|-------|----------|
| `'user'` | Default. Follow the OS accessibility setting. |
| `'never'` | Always animate, even when the user asked not to. |
| `'always'` | Never animate. |

Use `'never'` sparingly — it overrides an accessibility preference the user deliberately set. It's defensible for a transition that carries meaning nothing else conveys, and not much else.

Nested providers inherit: an omitted prop keeps the ancestor's value.

## Animating your own components

If you build animated components alongside the library, two rules keep them consistent with it.

**Use the theme's named transitions** rather than hand-rolled spring configs, so your motion retunes along with the library's:

```tsx
import { useAnimation } from '@rootnative/inertia'

const progress = useAnimation(open ? 1 : 0, 'spring-default-spatial')
```

**Reach for the hooks that gate on reduced motion.** inertia applies the gate inside `useAnimation`, `useAnimator`, `useGesture`, `useGestureLayer`, and the `Motion.*` primitives. It deliberately does *not* gate `useSpring` / `useBooleanSpring` — those are the raw mechanism, and collapsing them would strand a value mid-drag at their gesture-smoothing call sites. So:

```tsx
// Gated — snaps under reduced motion.
const progress = useAnimation(selected ? 1 : 0, 'spring-fast-spatial')

// NOT gated — animates even when the user asked for no motion.
const progress = useBooleanSpring(selected)
```

Pure interpolators (`useInterpolatedStyle`, `useColorTransition`, `useTransform`, `useShadow`) need no gate of their own — they inherit it from whatever progress value drives them.

To verify, assert that no Reanimated primitive runs under `reducedMotion="always"`:

```tsx
import { MotionConfig } from '@rootnative/inertia'
import * as Reanimated from 'react-native-reanimated'

it('runs no animation primitive when reducedMotion="always"', () => {
  const withSpring = jest.spyOn(Reanimated, 'withSpring')

  render(
    <ThemeProvider>
      <MotionConfig reducedMotion="always">
        <MyAnimatedThing active />
      </MotionConfig>
    </ThemeProvider>,
  )

  expect(withSpring).not.toHaveBeenCalled()
})
```

That's the same invariant the library holds itself to.
