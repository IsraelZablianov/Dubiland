# 2026-04-10 — Profile Picker FTUE Choice Architecture + Route-Honest Actions (DUB-263)

## Context

- Source issue: [DUB-263](/DUB/issues/DUB-263)
- Surface: `/profiles` (`packages/web/src/pages/ProfilePicker.tsx`)
- Audience: parent + child co-play, with child cognitive limits (ages 3-7)
- Platform constraints: Hebrew RTL-first, touch-first, tablet-primary, audio-first

## 1) UX Outcome

The profile picker must reduce first-session decision load and keep labels honest:

- First view shows at most 3 primary interactive targets.
- "Add child" wording appears only when the action actually starts add-child.
- Child can reach play in one obvious action (`continue`) after a simple profile pick.

## 2) Current Gaps (from [DUB-263](/DUB/issues/DUB-263))

1. Four equal profile cards (`guest` + three demo names) create choice overload for preoperational users.
2. `profile.addChild` currently navigates to `/parent`, which breaks label->destination expectation.
3. Footer duplicates parent actions (`addChild` + `manageProfiles`) before child value is shown.

## 3) Required Screen States

| State | Trigger | Primary profile choices shown | Secondary actions |
|---|---|---|---|
| `ftue_collapsed` | Guest mode / first session | `guest` card only | `more demo profiles`, `parent zone`, `continue` |
| `ftue_expanded_demo` | Tap `more demo profiles` | Bottom sheet with `maya/noam/liel` demo cards | same as above |
| `profile_selected` | Any profile card selected | Selected card has clear active style | `continue` enabled |

Behavior constraints:

- In `ftue_collapsed`, no more than 1 visible profile card on the main grid.
- Demo profiles are discoverable but not equal-weight on first paint.
- Tapping a demo profile in sheet sets selection and closes sheet.

## 4) Choice Architecture + Layout

## Main structure

1. Header: `whoPlaysToday` + subtitle (existing).
2. Primary profile zone: one large selected-capable card (`guest` by default).
3. Progressive disclosure control: `more demo profiles` (secondary, non-primary color weight).
4. Footer actions:
   - Primary CTA: `continue`.
   - Secondary CTA: `parent zone` (route `/parent`).

## RTL placement

- Profile content remains centered, reading order right-to-left.
- Progressive disclosure control appears below the profile card, aligned to the right edge in RTL.
- Mascot remains visually supportive and must not cover CTA row.

## Touch + size contract

- Primary profile card interactive zone: >= `--touch-primary-action-prominent` (72px) in both dimensions for core tap cluster.
- CTA buttons: primary >=60px height, secondary >=44px height.
- Minimum spacing between interactive elements: 12-16px.

## 5) Route-Honesty Contract (Non-Negotiable)

### Immediate (P0)

- Remove `profile.addChild` from this screen until a real add-child flow exists.
- Keep `/parent` navigation but label it as parent area management.

### Future (P1)

- If product adds actual child creation (`/profiles/new` or modal), then restore `profile.addChild` for that route only.

Rule:

- "add" verbs are reserved for creation flows.
- "manage/parent zone" labels are reserved for `/parent`.

## 6) FED Component Contract (Implementation-Ready)

```ts
type PickerState = 'ftue_collapsed' | 'ftue_expanded_demo' | 'profile_selected';

interface ProfilePickerViewModel {
  primaryProfiles: ActiveChildProfile[]; // initially [{guest}]
  demoProfiles: ActiveChildProfile[];    // maya/noam/liel in sheet
  selectedProfileId: string;
  state: PickerState;
}
```

Implementation notes:

- Keep optimistic selection (`setSelectedProfileId`) instant.
- Keep `continue` disabled only if no profile selected.
- Do not render 4 equal profile cards on first paint.

## 7) i18n + Audio Requirements

Do not hardcode text. Add/adjust i18n keys in `common.profile`:

- `parentZone` (new) -> label for `/parent` action on `/profiles`
- `moreDemoProfiles` (new) -> disclosure trigger text
- `demoSheetTitle` (new) -> sheet heading for demo profiles

Behavioral text policy:

- `addChild` must not be used unless action opens real add-child flow.

Audio parity (required):

- Add matching MP3 files for each new visible key under `packages/web/public/audio/he/profile/`.
- Hook new keys into audio manifest/overrides the same way as existing profile labels.

## 8) Interaction + Motion

- Tap feedback within 100ms on cards and buttons.
- Sheet open/close: 300-500ms ease-out (respect reduced motion).
- Selection feedback: border + slight lift (existing pattern), no rapid flashing.
- Demo sheet should not auto-open on load.

## 9) Acceptance Checklist

## UX

- First paint on `/profiles` shows <=3 primary interactive targets.
- Child can complete pick + continue without entering parent surfaces.
- Label and destination are semantically aligned.

## FED

- `profile.addChild` removed or hidden in P0 implementation.
- New `profile.parentZone` key used for `/parent` button.
- Demo profiles moved to progressive disclosure surface.

## QA

- RTL alignment validated for card, disclosure control, and CTA row.
- Touch target sizes meet 44/60/72 contracts.
- No broken focus/keyboard interactions (`Enter` and `Space` still select cards).
- Audio files exist for every newly visible label.

## 10) PM Decision (Tracked, Not Blocking P0)

Optional follow-up experiment: skip `/profiles` and go straight to `/home` when guest profile is already active. This is a PM tradeoff between faster time-to-value and teaching profile concept early; do not block P0 usability fix.
