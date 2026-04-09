# Tools

## Nano Banana (Gemini Image Generation)

Nano Banana is Google's native image generation capability built into Gemini. It generates high-quality images from text prompts — ideal for creating Dubiland visual assets (mascot illustrations, game backgrounds, letter cards, etc.).

### Available Models

| Model | Alias | Best For |
|-------|-------|----------|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | High-volume, fast generation |
| `gemini-3-pro-image-preview` | Nano Banana Pro | Professional assets, complex prompts |
| `gemini-2.5-flash-image` | Nano Banana | Speed and efficiency |

### How to Generate Images

Use the **Gemini web UI** via browser tools. There is no working API key.

**Step 1 — Navigate and check auth:**

1. Use browser tools to navigate to `https://gemini.google.com/u/0/app`
2. Take a snapshot to check the page state
3. If you see **"Sign in"** instead of a user avatar/name → auth is needed, go to Step 2
4. If you see a logged-in user (e.g. PRO badge, user name) → go to Step 3

**Step 2 — Escalate for authentication:**

If the browser is not signed in, **stop and escalate to the board (PM)**:

- Comment on your current Paperclip task:
  ```
  @board — Gemini web UI needs authentication.
  Please sign in at https://gemini.google.com in the Cursor browser,
  then let me know so I can continue generating images.
  ```
- Wait for confirmation before proceeding.

**Step 3 — Generate the image:**

1. Make sure **Fast** mode is selected (not Thinking — Thinking mode takes 2+ minutes and may time out)
2. Click the prompt textbox
3. Type your image prompt
4. Click the **Send message** button (do NOT press Enter — it adds a newline)
5. Wait ~15-25 seconds for generation
6. Take a screenshot to verify the result
7. Click the image → "Download full size image" to save it
8. Move the downloaded file to the correct path in the repo

### Prompt Guidelines for Dubiland Assets

- **Mascot (דובי):** "A cute cartoon teddy bear, warm brown fur, big friendly smile, wearing a small blue backpack. Children's book illustration style, soft pastel colors, clean white background."
- **Game backgrounds:** "Colorful children's classroom background, soft watercolor style, warm lighting, no text, Hebrew learning theme."
- **Letter cards:** "Large Hebrew letter [א] in playful 3D style, bright colors, child-friendly, clean background, suitable for ages 3-7."
- **Always specify:** "children's book illustration style", "soft pastel colors", "clean white background" for consistency.
- **Avoid:** realistic human faces (Gemini may block), violent imagery, text-heavy prompts.

### Key Learnings

- **Fast mode** generates images in ~15-25 seconds. **Thinking mode** takes 2+ minutes — always use Fast.
- Click the **Send message button** to submit, not Enter (Enter adds a newline in the prompt box).
- Enterprise WIXPress accounts have full PRO access via the web UI.
- All generated images include a SynthID watermark (invisible, identifies AI-generated content).

## Remotion

See `skills/remotion/SKILL.md` for the full Remotion toolkit reference.

## TTS (Text-to-Speech)

Current: Edge TTS (`he-IL-HilaNeural`) via `scripts/generate-audio.py`.
See `docs/architecture/media-alternatives-research.md` for upgrade options (LightBlue, Google Chirp 3, ElevenLabs).
