# 2026-04-10 — Age-Range Filter UX + Content Tag Card Spec (DUB-143)

## Context

- Source issue: [DUB-143](/DUB/issues/DUB-143)
- Parent requirement: [DUB-112](/DUB/issues/DUB-112)
- Taxonomy alignment: [DUB-145](/DUB/issues/DUB-145)
- Audience: children ages 3-7 (pre-readers) with parent-guided browsing
- Platform constraints: Hebrew RTL-first, touch-first, tablet-primary, no hover dependence

## 1) UX Outcome

Parents can immediately see and control age suitability while children still get a simple, visual browsing flow:

- Default content view follows the active child profile age.
- Manual age browsing is one-tap and reversible.
- Tags on every card make age/topic/difficulty visible without opening content.
- Filter changes feel instant (local state first, async persistence second).

## 2) Age Filter Placement + Anatomy

## Placement

Use one shared filter pattern on:

1. Child browsing surfaces (`/home` game selection block now, unified catalog later).
2. Parent browsing surfaces (games/videos/songs inventory when available).

Keep the filter above card grids so cause/effect is immediate.

## Component

`AgeRangeFilterBar` (horizontal chip row, RTL scroll origin on the right):

- Right-side lead item: `דובי` guidance avatar/icon pointing toward the active chip.
- Age chips: `3-4`, `4-5`, `5-6`, `6-7` (interactive, minimum `--touch-filter-chip`).
- Optional parent chip: `all` (show all ages, still sorted by relevance).
- Reset action appears only when manual override is active.

No bottom-edge placement (avoid tablet wrist-rest conflict).

## 3) Interaction States (Required)

| State | Trigger | Visual behavior | Data behavior |
|---|---|---|---|
| `default_profile_age` | Initial load with child age known | Matching age chip is preselected; reset hidden | `selectedAgeBand = profileAgeBand`, `isManualOverride = false` |
| `manual_override` | Tap non-profile age chip (or `all`) | Newly selected chip becomes active; reset action appears | `selectedAgeBand = tappedBand`, `isManualOverride = true` |
| `reset_to_profile_age` | Tap reset action | Profile-age chip regains active style; reset disappears | `selectedAgeBand = profileAgeBand`, `isManualOverride = false` |
| `no_profile_age_fallback` | Guest/no age profile | `all` starts active; no reset shown | `selectedAgeBand = all`, `isManualOverride = false` |
| `persisting_override` | Manual state sync to backend | No UI blocking; optional subtle sync indicator | Optimistic local update first, async save in background |

## Filtering + ranking rule (aligned with [DUB-145](/DUB/issues/DUB-145))

For a selected age band:

1. Include content where selected band matches `age.primary.*` or `age.support.*`.
2. Rank `primary` matches before `support` matches.
3. Within each bucket, keep existing content ordering (`sort_order` / authored ranking).

If `all` is selected, show all content and still rank by:
`primary match to profile age` -> `support match to profile age` -> remaining.

## 4) Tag Presentation on Content Cards

## Card metadata row

Add a top metadata row on all content cards (games/videos/songs):

1. Primary age chip (required): e.g. `3-4`.
2. Support age chip (optional): e.g. `+5-6` (max 1 visible on card; more collapse to `+N`).
3. Topic chip (required): icon + short label (`math`, `letters`, `reading`).
4. Difficulty chip (required): icon + `1-5` visual scale.

RTL order is right-to-left, with age first on the right edge.

## Chip behavior

- Informational chips are non-interactive (`--tag-chip-height`).
- Interactive filter chips use minimum 44px hit area.
- Max two rows of metadata; truncate overflow gracefully (never overlap thumbnail/title).
- Highest saturation reserved for active filter and success states, not passive tags.

## Difficulty representation

Prefer icon + compact step meter (e.g. filled/empty dots) rather than dense text for child readability.

## 5) FED Component Contract (Implementation-Ready)

```ts
type AgeBand = '3-4' | '4-5' | '5-6' | '6-7' | 'all';
type TopicTag = 'math' | 'letters' | 'reading';

interface AgeRangeFilterState {
  profileAgeBand?: Exclude<AgeBand, 'all'>;
  selectedAgeBand: AgeBand;
  isManualOverride: boolean;
}

interface AgeRangeFilterBarProps {
  state: AgeRangeFilterState;
  ageBands: Exclude<AgeBand, 'all'>[];
  allowAllAges?: boolean;
  onSelectBand: (band: AgeBand) => void;
  onResetToProfileAge: () => void;
}

interface ContentTagRowProps {
  agePrimary: Exclude<AgeBand, 'all'>;
  ageSupport?: Exclude<AgeBand, 'all'>[];
  topic: TopicTag;
  difficulty: 1 | 2 | 3 | 4 | 5;
}
```

Implementation note:
- Keep filter state client-side for instant response.
- Persist `manual override` preference asynchronously per child profile.

## 6) Design Token Contract

Token additions are now defined in `packages/web/src/components/design-system/tokens.css`.

Use these for implementation (no hardcoded colors):

- Surface: `--color-filter-surface`, `--color-filter-border`
- Filter chip: `--color-filter-chip-bg`, `--color-filter-chip-border`, `--color-filter-chip-active-bg`, `--color-filter-chip-active-text`, `--shadow-filter-chip-active`
- Tag chips: `--color-tag-age-primary-bg`, `--color-tag-age-support-bg`, `--color-tag-topic-bg`, `--color-tag-difficulty-bg`, `--color-tag-text`, `--color-tag-border`
- Size/shape: `--touch-filter-chip`, `--tag-chip-height`, `--radius-tag-pill`

## 7) i18n + Audio Requirements

Do not render raw Hebrew strings in components. Use keys and matching audio:

- `contentFilters.age.title`
- `contentFilters.age.band.3_4`
- `contentFilters.age.band.4_5`
- `contentFilters.age.band.5_6`
- `contentFilters.age.band.6_7`
- `contentFilters.age.all`
- `contentFilters.age.resetToProfile`
- `contentTags.topic.math`
- `contentTags.topic.letters`
- `contentTags.topic.reading`
- `contentTags.difficulty.label`

Audio parity:
- Every visible label/action above must map to an audio file.
- On filter change, play a short confirmation cue (plus optional spoken age label).

## 8) FED Handoff Checklist

- Extend `GameCard` metadata area to support tag chips (age/topic/difficulty) with RTL ordering.
- Add `AgeRangeFilterBar` above the content grid using optimistic local state.
- Implement required interaction states (`default`, `manual override`, `reset`, `no profile age`).
- Apply only tokenized colors/shape/spacing from `tokens.css`.
- Keep interactive controls >=44px and primary filter actions >=60px when styled as main CTA.

## 9) QA Validation Checklist

- RTL: chips, row order, and horizontal scroll origin are correct in Hebrew.
- Touch: no interactive chip under 44px; no bottom-edge critical controls.
- State logic: reset appears only in manual mode and restores profile-age defaults.
- Ranking: `primary` age matches appear above `support` matches.
- Accessibility: visible active state, clear focus ring, reduced-motion safe behavior.
- Audio: filter and tag labels are fully covered by i18n + audio assets.

## 10) Dependency Note

[DUB-141](/DUB/issues/DUB-141) is still open for final architecture/data contracts. If backend tag field names differ, keep this UX behavior and remap only the transport layer names.
