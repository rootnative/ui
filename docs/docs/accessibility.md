---
sidebar_position: 10
description: What MD3 roles, labels, and state the components wire for you — and what you still have to supply per platform.
---

# Accessibility

The components ship with the MD3 roles, labels and state already set. This
page covers the parts that aren't automatic: what you have to supply, what
differs between the web and native, and what the library doesn't do yet.

## One spelling, both platforms

Every component announces its state with `aria-*` props: `aria-checked`,
`aria-selected`, `aria-expanded`, `aria-valuenow`, `aria-disabled`.

That is not a web bias. React Native normalizes those props back into
`accessibilityState` / `accessibilityValue` for native. react-native-web 0.21
reads *only* the ARIA spelling, and it drops the nested
`accessibilityState={{ ... }}` object of RN without a warning. One spelling
covers both platforms. The nested object covers native alone.

This matters when you override accessibility props yourself:

```tsx
// Reaches a screen reader on iOS, Android and web.
<Pressable aria-selected={selected} role="tab" />

// Works on native. On web the state never reaches the DOM.
<Pressable accessibilityState={{ selected }} accessibilityRole="tab" />
```

`TextInput` is the exception. It does *not* normalize, so `TextField` carries
both spellings internally.

## Icons are decorative

Every icon that a component renders for you (`leadingIcon`, `trailingIcon`,
the check mark of a `Checkbox`, the thumb glyph of a `Switch`, the icon of a
`Tab`) sits inside a node marked `aria-hidden`, so it never reaches the
accessibility tree. The accessible name of a control comes from its visible
text, or from the `accessibilityLabel` you pass, and never from the icon.

That is not cosmetic. An icon font renders its glyph as *text* in a
private-use-area codepoint, and React Native merges the text of descendant
nodes into the name of an accessible ancestor. Without the flag,
`<Button leadingIcon="plus">Add Item</Button>` announced as "&#xF0415;, Add
Item", and a checked `Checkbox`, which has no text of its own, announced as
the check glyph alone. A screen reader reads a private-use codepoint as
nothing, or as an unknown symbol.

One result matters when you test with `@testing-library/react-native`. Its
queries skip elements hidden from accessibility by default, so an assertion
that an icon rendered has to opt in.

```tsx
// Finds nothing — the icon is hidden from the accessibility tree.
expect(screen.queryByText('check')).toBeNull()

// Asserts the icon rendered.
expect(screen.getByText('check', { includeHiddenElements: true })).toBeTruthy()
```

If you pass your own node as an icon, the same applies. The component wraps
it for you, so it needs no flag of its own.

## Touch targets

Several MD3 Expressive size tokens are smaller than the 48dp WCAG 2.5.5 / MD3
minimum on purpose. A `Button` and a `ButtonGroup` item at `extraSmall` are
32dp tall, and a `Switch` track is 32dp. On native those controls carry a
`hitSlop` that brings the *touch* area back to 48dp, and moves no pixel of
layout, so the small sizes stay usable.

`ButtonGroup` grows its target vertically only. Items in the `connected`
variant sit 2dp apart, so a horizontal slop would make the touch area of each
item overlap its neighbour.

**This does not apply on web.** react-native-web does not implement `hitSlop`,
so on web these controls are exactly their token size. If you use
`extraSmall` on a touch-capable web build, give them room yourself.

## What you have to supply

The library can't invent these.

**Labels for anything icon-only.** `IconButton` and `FAB` with no label render
a glyph and nothing else. Pass `accessibilityLabel`:

```tsx
<IconButton icon="delete" accessibilityLabel="Delete message" />
<FAB icon="add" accessibilityLabel="New event" />
```

The trailing close control of a `Chip` is the exception. It labels itself as
`Remove {label}`, with the text of the chip inside, because it is a second
accessibility target inside what looks like one control, and "Remove" alone
would not say which chip. That default is English, so a localized app should
pass the whole string:

```tsx
<Chip variant="input" onClose={remove} closeAccessibilityLabel="Salmon entfernen">
  Salmon
</Chip>
```

**Labels for bare selection controls.** `Checkbox`, `Radio` and `Switch` draw
the control only. They have no `label` prop, because MD3 puts the label in the
surrounding row. A control with visible text next to it still needs a link to
that text:

```tsx
<ListItem
  headlineText="Push notifications"
  trailingContent={<Switch value={on} onValueChange={setOn} />}
/>

// Standalone, with the text outside any labelled container:
<Row>
  <Checkbox value={agreed} onValueChange={setAgreed} accessibilityLabel="Agree to terms" />
  <Text>I agree to the terms</Text>
</Row>
```

**A name for a `Dialog` without a plain-text headline.** `Dialog` takes its
accessible name from `Dialog.Title` when the headline is a string. When you
build the headline out of nodes, there is no single string to announce, so
pass `accessibilityLabel` yourself.

## Dialogs, menus and sheets on web

A portal appends its surface at the end of the tree, so on web the tab order
of the browser would walk straight past the surface into the content behind
it. `aria-modal` tells assistive technology that a surface is modal. It is not
a focus boundary. So `Dialog`, `Menu` and the modal `BottomSheet` keep the
focus inside themselves:

- Focus moves into the surface when it opens: to the first focusable element
  inside it, or to the surface itself when it has none.
- Tab and Shift-Tab cycle inside the surface. In a `Menu`, Arrow Down and
  Arrow Up also move between the items, which is what `role="menu"` promises.
- **Escape** dismisses. A `Dialog` with `dismissable={false}` and a
  `BottomSheet` with `dismissable={false}` ignore it, the same as a scrim tap.
- On close, focus returns to the element that held it before, usually the
  control that opened the surface.

None of this runs on native, where there is no tab order to contain. iOS and
Android take the screen reader out of the background from
`accessibilityViewIsModal`, and the hardware back button of Android already
dismisses.

The trigger of a `Menu` is annotated for you. It gets `aria-haspopup="menu"`
and an `aria-expanded` that follows the menu, in both the controlled and the
uncontrolled form. So a screen reader announces the control as a control that
opens a menu, not as a plain button.

## Dialog vs alertdialog

`Dialog` announces itself as `role="dialog"`. Assistive technology treats
`alertdialog` as an interruption, so it is opt-in. Use it for something the
user must resolve, not for every confirmation:

```tsx
<Dialog visible={visible} onDismiss={close} role="alertdialog">
  <Dialog.Title>Delete this project?</Dialog.Title>
  <Dialog.Content>This cannot be undone.</Dialog.Content>
</Dialog>
```

## Text fields

`TextField` connects its own supporting text (the error message when there is
one) to the input. On web that is an `aria-describedby` that points at the
supporting-text node. Native has no equivalent, so there the same text becomes
the `accessibilityHint` of the input. `errorText` (or `error`) also sets
`aria-invalid` on web, so the field is announced as invalid, and not only
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

A `trailingIcon` is a button only when you give it `onTrailingIconPress`. With
a handler it is a real control and needs a name. Pass
`trailingIconAccessibilityLabel`, because the icon itself is hidden and can't
supply one. Without a handler the icon is pure decoration, so it leaves the
accessibility tree. It does not announce itself as a disabled, unnamed button.

```tsx
<TextField
  label="Search"
  trailingIcon="close"
  onTrailingIconPress={clear}
  trailingIconAccessibilityLabel="Clear search"
/>
```

## Tooltips

A tooltip renders in a portal, far from its anchor in the DOM, so nothing
connects the two for a keyboard or screen-reader user. While a tooltip is
shown, its anchor carries an `aria-describedby` that points at it. This is
web-only. React Native has no concept of one view that describes another, and
on touch a tooltip is a long-press control, not something a screen reader
narrates.

On web a tooltip also opens when its anchor takes keyboard focus, and closes
on Escape, so a keyboard user reads the same text as a pointer user.

## Reduced motion

The theme handles this, not you; see [Motion](./motion.md). Every animated
component collapses to a hard cut when the OS setting is on.

## Keys on web

On web, Enter presses each control. Space presses a control whose role is
`button`, `checkbox`, `switch`, `radio` or `tab`, as the WAI-ARIA patterns
say. A held key presses once, and Space does not scroll the page.

A role that you pass counts too, for example `role="checkbox"` with
`aria-checked` on a pressable `Card`, or `role="switch"` on a pressable
`ListItem` that holds a passive `Switch`. A key from a focused element inside
the control, such as a link in a card, does not press the control. When your
own `onKeyDown` calls `preventDefault`, Space does not press.

react-native-web presses a `Pressable` on Space only for the `button` role.
A `Pressable` of your own with one of the other roles answers Enter only.

## Focus rings on web

`Button`, `IconButton`, `FAB` and `Chip` draw their MD3 focus ring as a CSS
outline on web: 3 px wide, 2 px outside the control, on a node with the box
of the control. An outline is ink, not layout, so the ring adds no scrollable
overflow. A ring drawn as a box 5 px outside the control reached past the
page edge in a bar with the 4 px MD3 gutter, and widened the page by 1 px,
with the ring at opacity 0. On native the ring stays a bordered node outside
the control. The other controls still draw the ring as an outset node on
both platforms. A container that puts one of them under 5 px from the edge
of a scroll container needs `overflow: 'hidden'`.

## Known limitations

We state these, because they affect what you can promise your own users:

- **Native modal containment does not work.** `Dialog` and the modal
  `BottomSheet` set `accessibilityViewIsModal`, but the flag hides the
  *siblings* of the flagged view, and the siblings of a portal surface are
  other portal layers. Your app content sits one level up, as a sibling of
  the portal outlet, out of reach of the flag. So a screen reader can swipe
  past an open dialog into the content behind it on iOS and Android. Web is
  not affected: the focus containment there is real, and it does not depend
  on this flag.

  The fix is that the portal *host* owns the flag, not the surface. That is a
  structural change we have not made. If your app depends on containment
  today, the workaround is to mark your own content branch
  `importantForAccessibility="no-hide-descendants"` (Android) /
  `accessibilityElementsHidden` (iOS) while a modal surface is open.
- **Nothing restores the screen-reader cursor on native.** When a `Dialog`,
  `Menu` or modal `BottomSheet` closes, *keyboard* focus returns on web, but
  the native reader cursor does not move back to the control that opened the
  surface. It falls back to wherever the platform puts it, usually the top of
  the screen. On web, focus return works as described above.
- **`Menu` is not marked modal on native, on purpose.** A modal mark removes
  the siblings of the surface from the accessibility tree, and the dismiss
  region behind the menu is a sibling. It is the only exit that a
  screen-reader user has. To contain the screen reader here, the portal host
  must own the flag, which is a change we have not made.
- **`role="menu"` items are Tab stops on web, not a roving-tabindex group.**
  The arrow keys work. The strict ARIA menu pattern would also make the item
  group a single tab stop.
- **We did not sweep RTL.** Everything routes through `selectRTL`, but we ran
  no platform pass against a right-to-left locale.
- **Touch targets are corrected only on native.** The `hitSlop` that lifts
  the smallest size tokens to 48dp is a no-op under react-native-web, so a
  touch-capable web build gets the token size. See "Touch targets" above.

The first two are pinned as failing tests in
`packages/components/src/__tests__/screen-reader-native.test.tsx`, so we track
them. Both are implementation gaps behind a settled API. A fix needs no change
to any prop, so neither fix is a breaking change.

Beyond these, we checked the screen-reader behaviour of the library by a
source audit and by DOM-level tests on web. We have not run a full VoiceOver
and TalkBack pass over the component catalog, so the announcement wording and
the traversal order on native are less checked than the roles and the labels.
