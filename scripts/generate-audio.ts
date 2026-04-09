import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

/** Script directory (Node <21: import.meta.dirname is unavailable). */
const SCRIPT_DIR =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

const VOICE = 'he-IL-HilaNeural';
const OUTPUT_BASE = path.resolve(SCRIPT_DIR, '../packages/web/public/audio/he');
const PUBLIC_ROOT = path.resolve(SCRIPT_DIR, '../packages/web/public');
const LOCALE_FILES = [
  { namespace: 'common', filePath: path.resolve(SCRIPT_DIR, '../packages/web/src/i18n/locales/he/common.json') },
  { namespace: 'onboarding', filePath: path.resolve(SCRIPT_DIR, '../packages/web/src/i18n/locales/he/onboarding.json') },
] as const;

interface AudioEntry {
  key: string;
  text: string;
  outputPath: string;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function keyToRelativePath(key: string): string {
  const segments = key.split('.');
  const namespace = segments[0];
  const keySegments = namespace === 'common' ? segments.slice(1) : segments;
  const dirParts = keySegments.slice(0, -1).map(toKebabCase);
  const filePart = `${toKebabCase(keySegments[keySegments.length - 1] ?? key)}.mp3`;
  return path.join(...dirParts, filePart);
}

function flattenStrings(value: unknown, prefix = ''): Array<{ key: string; text: string }> {
  if (typeof value === 'string') {
    return [{ key: prefix, text: value }];
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([nestedKey, nestedValue]) => {
    const nextPrefix = prefix ? `${prefix}.${nestedKey}` : nestedKey;
    return flattenStrings(nestedValue, nextPrefix);
  });
}

async function loadLocaleEntries(): Promise<AudioEntry[]> {
  const entries: AudioEntry[] = [];

  for (const locale of LOCALE_FILES) {
    const jsonRaw = await readFile(locale.filePath, 'utf8');
    const flattened = flattenStrings(JSON.parse(jsonRaw), locale.namespace);

    for (const item of flattened) {
      entries.push({
        key: item.key,
        text: item.text,
        outputPath: path.join(OUTPUT_BASE, keyToRelativePath(item.key)),
      });
    }
  }

  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

async function generateAudio(entry: AudioEntry): Promise<void> {
  const dir = path.dirname(entry.outputPath);
  await mkdir(dir, { recursive: true });

  if (existsSync(entry.outputPath)) {
    console.log(`  Skipping (exists): ${entry.key}`);
    return;
  }

  try {
    await execFileAsync('edge-tts', ['--voice', VOICE, '--text', entry.text, '--write-media', entry.outputPath]);
    console.log(`  Generated: ${entry.key}`);
  } catch (err) {
    console.error(`  Failed: ${entry.key}`, err);
  }
}

async function main() {
  console.log('Generating Hebrew audio files...\n');

  const entries = await loadLocaleEntries();

  console.log(`${entries.length} audio files to process\n`);

  for (const entry of entries) {
    await generateAudio(entry);
  }

  const manifest: Record<string, string> = {};
  for (const entry of entries) {
    const relativePath = entry.outputPath.replace(PUBLIC_ROOT, '').split(path.sep).join('/');
    manifest[entry.key] = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }

  const manifestPath = path.join(OUTPUT_BASE, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestPath}`);
  console.log('Done!');
}

main().catch(console.error);
