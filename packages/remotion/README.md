# Dubiland Remotion

## Letters Series compositions

This package registers reusable Hebrew letter lesson videos:

- `LettersSeriesTemplate` (parametric via `inputProps.letter`)
- `LettersSeries-alef`
- `LettersSeries-bet`
- `LettersSeries-gimel`
- `LettersSeries-dalet`
- `LettersSeries-he`
- `LettersSeries-vav`

## Timeline behavior

`calculateMetadata` measures real clip durations with `@remotion/media-utils` from the TTS bundle (`packages/web/public/audio/he/manifest.json`) and computes scene frames for:

1. Intro
2. Pronunciation
3. Example word
4. Practice cue
5. Celebration

Durations are not guessed; composition length follows real audio.

## Audio dependency

Remotion static assets are linked to web audio through:

- `packages/remotion/public/audio/he -> ../../../web/public/audio/he` (symlink)

If your environment does not preserve symlinks, create this link before rendering.

## Rendering

```bash
yarn workspace @dubiland/remotion studio

yarn workspace @dubiland/remotion render LettersSeries-alef out/letters-alef.mp4
```

To render the template composition with a different letter:

```bash
yarn workspace @dubiland/remotion render \
  LettersSeriesTemplate \
  out/letters-bet.mp4 \
  --props='{"letter":"bet"}'
```
