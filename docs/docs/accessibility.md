---
sidebar_position: 9
---

# Accessibility

Components ship with MD3 roles, labels and state already wired. This page is
about the parts that aren't automatic: what you have to supply, what differs
between web and native, and what the library does not yet do.

## One spelling, both platforms

Every component announces its state with `aria-*` props — `aria-checked`,
`aria-selected`, `aria-expanded`, `aria-valuenow`, `aria-disabled`.

That is not a web bias. React Native normalizes those props back into
`accessibilityState` / `accessibilityValue` for native, while
react-native-web 0.21 reads *only* the ARIA spelling and silently discards
RN's nested `accessibilityState={{ ... }}` object. One spelling covers both;
the nested object covers native alone.

It matters if you override accessibility props yourself:

```tsx
// Reaches a screen reader on iOS, Android and web.
<Pressable aria-selected={selected} role="tab" />

// Works on native. On web the state never reaches the DOM.
<Pressable accessibilityState={{ selected }} accessibilityRole="tab" />
```

`TextInput` is the exception — it does *not* normalize, so `TextField` carries
both spellings internally.

## What you have to supply

The library cannot invent these.

**Labels for anything icon-only.** `IconButton`, `FAB` with no label, and
`Chip`'s trailing close affordance render a glyph and nothing else. Pass
`accessibilityLabel`:

```tsx
<IconButton icon="delete" accessibilityLabel="Delete message" />
<FAB icon="add" accessibilityLabel="New event" />
```

**Labels for bare selection controls.** `Checkbox`, `Radio` and `Switch` draw
the control only — they have no `label` prop, because MD3 puts the label in the
surrounding row. A control with visible text next to it still needs the text
associated with it:

```tsx
<ListItem
  headline="Push notifications"
  trailing={<Switch value={on} onValueChange={setOn} />}
/>

// Standalone, with the text outside any labelled container:
<Row>
  <Checkbox value={agreed} onValueChange={setAgreed} accessibilityLabel="Agree to terms" />
  <Text>I agree to the terms</Text>
</Row>
```

**A name for a `Dialog` without a plain-text headline.** `Dialog` lifts its
accessible name from `Dialog.Title` when the headline is a string. Build the
headline out of nodes and there is no single string to announce, so pass
`accessibilityLabel` yourself.

## Dialogs, menus and sheets on web

Portal-rendered surfaces are appended at the end of the tree, so on web the
browser's tab order would walk straight past them into the content behind.
`aria-modal` tells assistive technology a surface is modal; it is not a focus
boundary. `Dialog`, `Menu` and the modal `BottomSheet` therefore contain focus
themselves:

- Focus moves into the surface when it opens — the first focusable element
  inside it, or the surface itself when it has none.
- Tab and Shift-Tab cycle within the surface. In a `Menu`, Arrow Down and
  Arrow Up move between items as well, which is what `role="menu"` promises.
- **Escape** dismisses. A `Dialog` with `dismissable={false}` and a
  `BottomSheet` with `dismissable={false}` ignore it, matching what a scrim tap
  does.
- Closing returns focus to whatever held it before — usually the control that
  opened the surface.

None of this runs on native, where there is no tab order to contain: iOS and
Android take the screen reader out of the background from
`accessibilityViewIsModal`, and Android's hardware back button already
dismisses.

`Menu`'s trigger is annotated for you. It gets `aria-haspopup="menu"` and an
`aria-expanded` that tracks the menu, in both the controlled and uncontrolled
forms, so a screen reader announces the control as opening a menu rather than
as a plain button.

## Dialog vs alertdialog

`Dialog` announces itself as `role="dialog"`. Assistive technology treats
`alertdialog` as an interruption, so it is opt-in — use it for something the
user must resolve, not for every confirmation:

```tsx
<Dialog visible={visible} onDismiss={close} role="alertdialog">
  <Dialog.Title>Delete this project?</Dialog.Title>
  <Dialog.Content>This cannot be undone.</Dialog.Content>
</Dialog>
```

## Text fields

`TextField` connects its own supporting text — the error message when there is
one — to the input. On web that is `aria-describedby` pointing at the
supporting-text node; on native, which has no equivalent, the same text becomes
the input's `accessibilityHint`. `errorText` (or `error`) also sets
`aria-invalid` on web, so the field is announced as invalid and not merely
described.

Both come from props you already pass:

```tsx
<TextField
  label="Email"
  value={email}
  onChangeText={setEmail}
  errorText={invalid ? 'Enter a valid address' : undefined}
/>
```

## Tooltips

A tooltip renders in a portal, far from its anchor in the DOM, so nothing
connects the two for a keyboard or screen-reader user. While a tooltip is
shown, its anchor carries `aria-describedby` pointing at it. This is web-only —
React Native has no concept of one view describing another, and on touch a
tooltip is a long-press affordance rather than something a screen reader
narrates.

## Reduced motion

Handled by the theme, not by you — see [Motion](./motion.md). Every animated
component collapses to a hard cut when the OS setting is on.

## Known limitations

Stated rather than implied, because they affect what you can promise your own
users:

- **Native modal containment is unverified.** `Dialog` and the modal
  `BottomSheet` set `accessibilityViewIsModal`, but iOS applies that flag
  relative to a view's *siblings*, and a portal surface's siblings are other
  portal layers rather than your app content. Whether VoiceOver can reach
  behind an open dialog on iOS has not been confirmed on a device.
- **`Menu` is deliberately not marked modal on native.** Marking the surface
  modal removes its siblings from the accessibility tree, and the dismiss
  region behind the menu is a sibling — it is the only exit a screen-reader
  user has. Containing the screen reader here needs the portal host to own the
  flag, which is a change we have not made.
- **`role="menu"` items are Tab stops on web, not a roving-tabindex group.**
  Arrow keys work; the strict ARIA menu pattern would also make the item group
  a single tab stop.
- **RTL has not been swept.** Everything routes through `selectRTL`, but no
  platform pass has been run against a right-to-left locale.
