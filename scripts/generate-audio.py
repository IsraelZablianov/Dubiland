#!/usr/bin/env python3
"""
Generate Hebrew audio files from i18n locale JSON using gTTS (Google Translate TTS).

Reads all locale files, flattens keys, generates .mp3 for each string,
and writes a manifest mapping i18n keys to audio paths.

Usage:
    python3 scripts/generate-audio.py [--force]

    --force   Regenerate all files, even if they already exist
"""

import json
import os
import re
import sys
from pathlib import Path

from gtts import gTTS

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_BASE = PROJECT_ROOT / "packages" / "web" / "public" / "audio" / "he"
PUBLIC_ROOT = PROJECT_ROOT / "packages" / "web" / "public"
LOCALE_DIR = PROJECT_ROOT / "packages" / "web" / "src" / "i18n" / "locales" / "he"

AUDIO_OVERRIDES_PATH = LOCALE_DIR / "audio-overrides.json"
LOCALE_FILES = [
    {"namespace": path.stem, "path": path}
    for path in sorted(LOCALE_DIR.glob("*.json"))
    if path.name != AUDIO_OVERRIDES_PATH.name
]

LANG = "iw"  # gTTS uses 'iw' for Hebrew

RANGE_PATTERN = re.compile(r"\b(\d{1,2})\s*[–—-]\s*(\d{1,2})\b")
STANDALONE_NUMBER_PATTERN = re.compile(r"\b(10|[0-9])\b")
PUNCTUATION_PATTERN = re.compile(r"[!?,.:;…\"'׳״`“”„()\[\]{}<>\\|]")
MULTI_DASH_PATTERN = re.compile(r"[–—-]+")

SYMBOL_REPLACEMENTS = {
    "&": " ו ",
    "+": " ועוד ",
    "=": " שווה ",
    "%": " אחוז ",
    "/": " או ",
    "@": " ב ",
}

HEBREW_NUMBERS = {
    "0": "אפס",
    "1": "אחת",
    "2": "שתיים",
    "3": "שלוש",
    "4": "ארבע",
    "5": "חמש",
    "6": "שש",
    "7": "שבע",
    "8": "שמונה",
    "9": "תשע",
    "10": "עשר",
}


def load_audio_overrides() -> dict:
    """Load audio text overrides — keys where spoken text differs from display text."""
    if not AUDIO_OVERRIDES_PATH.exists():
        return {}
    with open(AUDIO_OVERRIDES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    data.pop("_comment", None)
    return data


def to_kebab_case(value: str) -> str:
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value)
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s)
    return s.strip("-").lower()


def key_to_relative_path(key: str) -> str:
    segments = key.split(".")
    namespace = segments[0]
    key_segments = segments[1:] if namespace == "common" else segments
    dir_parts = [to_kebab_case(s) for s in key_segments[:-1]]
    file_part = f"{to_kebab_case(key_segments[-1])}.mp3"
    return os.path.join(*dir_parts, file_part) if dir_parts else file_part


def flatten_strings(value, prefix=""):
    if isinstance(value, str):
        return [{"key": prefix, "text": value}]
    if not isinstance(value, dict):
        return []
    results = []
    for k, v in value.items():
        next_prefix = f"{prefix}.{k}" if prefix else k
        results.extend(flatten_strings(v, next_prefix))
    return results


def strip_template_vars(text: str) -> str:
    """Remove {{var}} placeholders — they'd be read aloud as literal text."""
    return re.sub(r"\{\{.*?\}\}", "", text).strip()


def to_hebrew_number(token: str) -> str:
    return HEBREW_NUMBERS.get(token, token)


def normalize_audio_text(text: str) -> str:
    """Normalize symbols and punctuation that hurt Hebrew TTS clarity."""
    normalized = text
    normalized = RANGE_PATTERN.sub(
        lambda m: f"{to_hebrew_number(m.group(1))} עד {to_hebrew_number(m.group(2))}",
        normalized,
    )

    for symbol, replacement in SYMBOL_REPLACEMENTS.items():
        normalized = normalized.replace(symbol, replacement)

    normalized = STANDALONE_NUMBER_PATTERN.sub(lambda m: to_hebrew_number(m.group(1)), normalized)
    normalized = PUNCTUATION_PATTERN.sub(" ", normalized)
    normalized = MULTI_DASH_PATTERN.sub(" ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def load_locale_entries():
    overrides = load_audio_overrides()
    entries = []
    for locale in LOCALE_FILES:
        with open(locale["path"], "r", encoding="utf-8") as f:
            data = json.load(f)
        flattened = flatten_strings(data, locale["namespace"])
        for item in flattened:
            key = item["key"]
            if key in overrides:
                source_text = overrides[key]
            else:
                source_text = strip_template_vars(item["text"])
            audio_text = normalize_audio_text(source_text)
            if not audio_text:
                continue
            entries.append({
                "key": key,
                "text": audio_text,
                "output_path": str(OUTPUT_BASE / key_to_relative_path(key)),
            })
    return sorted(entries, key=lambda e: e["key"])


def generate_audio(entry: dict, force: bool = False) -> bool:
    output = entry["output_path"]
    os.makedirs(os.path.dirname(output), exist_ok=True)

    if os.path.exists(output) and not force:
        print(f"  Skipping (exists): {entry['key']}")
        return True

    try:
        tts = gTTS(text=entry["text"], lang=LANG)
        tts.save(output)
        print(f"  Generated: {entry['key']}")
        return True
    except Exception as e:
        print(f"  Failed: {entry['key']} — {e}")
        return False


def main():
    force = "--force" in sys.argv

    print("Generating Hebrew audio files (gTTS)...\n")

    overrides = load_audio_overrides()
    if overrides:
        print(f"{len(overrides)} audio overrides loaded (spoken text differs from display)\n")

    entries = load_locale_entries()
    print(f"{len(entries)} audio files to process\n")

    success = 0
    for entry in entries:
        if generate_audio(entry, force=force):
            success += 1

    manifest = {}
    for entry in entries:
        rel = os.path.relpath(entry["output_path"], str(PUBLIC_ROOT))
        rel_posix = "/" + rel.replace(os.sep, "/")
        manifest[entry["key"]] = rel_posix

    manifest_path = str(OUTPUT_BASE / "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nManifest written to {manifest_path}")
    print(f"Done! {success}/{len(entries)} generated.")


if __name__ == "__main__":
    main()
