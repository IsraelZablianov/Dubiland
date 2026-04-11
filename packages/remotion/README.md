# Dubiland Remotion

## Blend to Read compositions

This package now also registers the Blend to Read mini-episode lane:

- `BlendToReadTemplate` (parametric via `inputProps.episodeId`)
- `BlendToRead-episode-01-cv-patah`
- `BlendToRead-episode-02-cv-segol`
- `BlendToRead-episode-03-cv-hirik`
- `BlendToRead-episode-04-cvc-bridge`
- `BlendToRead-episode-05-word-transfer`
- `BlendToRead-episode-06-challenge`

The episode/key contract is shared in:

- `packages/remotion/src/content/blendToReadVideoShorts.ts`

Each episode exposes three checkpoint cue windows through timeline metadata (`timeline.checkpoints`) for runtime wiring.

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

Blend-to-read render examples:

```bash
yarn workspace @dubiland/remotion render \
  BlendToRead-episode-01-cv-patah \
  out/blend-to-read-ep01.mp4

yarn workspace @dubiland/remotion render \
  BlendToReadTemplate \
  out/blend-to-read-ep06.mp4 \
  --props='{"episodeId":"episode-06-challenge"}'
```

To render the template composition with a different letter:

```bash
yarn workspace @dubiland/remotion render \
  LettersSeriesTemplate \
  out/letters-bet.mp4 \
  --props='{"letter":"bet"}'
```
