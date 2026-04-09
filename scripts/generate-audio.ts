import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

/** Script directory (Node <21: import.meta.dirname is unavailable). */
const SCRIPT_DIR =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

const VOICE = 'he-IL-HilaNeural';
const OUTPUT_BASE = path.resolve(SCRIPT_DIR, '../packages/web/public/audio/he');

interface AudioEntry {
  key: string;
  text: string;
  outputPath: string;
}

async function generateAudio(entry: AudioEntry): Promise<void> {
  const dir = path.dirname(entry.outputPath);
  await mkdir(dir, { recursive: true });

  if (existsSync(entry.outputPath)) {
    console.log(`  Skipping (exists): ${entry.key}`);
    return;
  }

  try {
    await execAsync(
      `edge-tts --voice "${VOICE}" --text "${entry.text}" --write-media "${entry.outputPath}"`
    );
    console.log(`  Generated: ${entry.key}`);
  } catch (err) {
    console.error(`  Failed: ${entry.key}`, err);
  }
}

function getFeedbackEntries(): AudioEntry[] {
  return [
    { key: 'feedback.success', text: 'כל הכבוד!', outputPath: path.join(OUTPUT_BASE, 'feedback/success.mp3') },
    { key: 'feedback.tryAgain', text: 'נסה שוב!', outputPath: path.join(OUTPUT_BASE, 'feedback/try-again.mp3') },
    { key: 'feedback.almostThere', text: 'כמעט!', outputPath: path.join(OUTPUT_BASE, 'feedback/almost-there.mp3') },
  ];
}

function getDubiEntries(): AudioEntry[] {
  return [
    { key: 'dubi.welcome', text: 'שלום! אני דובי, ברוכים הבאים לדובילנד!', outputPath: path.join(OUTPUT_BASE, 'dubi/welcome.mp3') },
    { key: 'dubi.greatJob', text: 'עבודה מצוינת!', outputPath: path.join(OUTPUT_BASE, 'dubi/great-job.mp3') },
    { key: 'dubi.letsPlay', text: 'בואו נשחק!', outputPath: path.join(OUTPUT_BASE, 'dubi/lets-play.mp3') },
    { key: 'dubi.chooseTopic', text: 'מה נלמד היום?', outputPath: path.join(OUTPUT_BASE, 'dubi/choose-topic.mp3') },
  ];
}

function getNumberEntries(): AudioEntry[] {
  const hebrewNumbers: Record<number, string> = {
    1: 'אחת', 2: 'שתיים', 3: 'שלוש', 4: 'ארבע', 5: 'חמש',
    6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע', 10: 'עשר',
  };

  return Object.entries(hebrewNumbers).map(([num, text]) => ({
    key: `numbers.${num}`,
    text,
    outputPath: path.join(OUTPUT_BASE, `numbers/${num}.mp3`),
  }));
}

async function main() {
  console.log('Generating Hebrew audio files...\n');

  const entries = [
    ...getFeedbackEntries(),
    ...getDubiEntries(),
    ...getNumberEntries(),
  ];

  console.log(`${entries.length} audio files to process\n`);

  for (const entry of entries) {
    await generateAudio(entry);
  }

  const manifest: Record<string, string> = {};
  const publicRoot = path.resolve(SCRIPT_DIR, '../packages/web/public');
  for (const entry of entries) {
    manifest[entry.key] = entry.outputPath.replace(publicRoot, '');
  }

  const manifestPath = path.join(OUTPUT_BASE, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestPath}`);
  console.log('Done!');
}

main().catch(console.error);
