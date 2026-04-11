import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const thumbnailsRoot = path.join(projectRoot, 'public', 'images', 'games', 'thumbnails');
const contactSheetPath = path.join(thumbnailsRoot, 'contact-sheet-16x10.webp');

const TILE_WIDTH = 340;
const TILE_HEIGHT = 212;
const COLUMNS = 3;
const GAP = 10;
const PADDING_INLINE = 18;
const PADDING_BLOCK = 18;
const CONTACT_SHEET_QUALITY = 52;
const CANVAS_BACKGROUND = '#f6efe2';

const canonicalOrder = [
  'countingPicnic',
  'colorGarden',
  'letterSoundMatch',
  'letterTracingTrail',
  'pictureToWordBuilder',
  'interactiveHandbook',
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

async function collectThumbnailBySlug() {
  const entries = await fs.readdir(thumbnailsRoot, { withFileTypes: true });
  const thumbnailBySlug = new Map();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const thumbPath = path.join(thumbnailsRoot, entry.name, 'thumb-16x10.webp');
    try {
      await fs.access(thumbPath);
      thumbnailBySlug.set(entry.name, thumbPath);
    } catch {
      continue;
    }
  }

  return thumbnailBySlug;
}

function buildOrderedThumbnailPaths(thumbnailBySlug) {
  const orderedPaths = [];
  const seenSlugs = new Set();

  for (const slug of canonicalOrder) {
    const thumbPath = thumbnailBySlug.get(slug);
    if (!thumbPath) {
      continue;
    }
    orderedPaths.push(thumbPath);
    seenSlugs.add(slug);
  }

  const remaining = [...thumbnailBySlug.keys()]
    .filter((slug) => !seenSlugs.has(slug))
    .sort((a, b) => a.localeCompare(b));

  for (const slug of remaining) {
    const thumbPath = thumbnailBySlug.get(slug);
    if (thumbPath) {
      orderedPaths.push(thumbPath);
    }
  }

  return orderedPaths;
}

async function renderContactSheet(thumbnailPaths) {
  const rows = Math.max(1, Math.ceil(thumbnailPaths.length / COLUMNS));
  const width = PADDING_INLINE * 2 + COLUMNS * TILE_WIDTH + (COLUMNS - 1) * GAP;
  const height = PADDING_BLOCK * 2 + rows * TILE_HEIGHT + (rows - 1) * GAP;

  const composites = [];

  for (let index = 0; index < thumbnailPaths.length; index += 1) {
    const sourcePath = thumbnailPaths[index];
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const left = PADDING_INLINE + column * (TILE_WIDTH + GAP);
    const top = PADDING_BLOCK + row * (TILE_HEIGHT + GAP);

    const tileBuffer = await sharp(sourcePath, { limitInputPixels: false })
      .resize({
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        fit: 'cover',
        position: 'attention',
      })
      .toBuffer();

    composites.push({
      input: tileBuffer,
      left,
      top,
    });
  }

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: CANVAS_BACKGROUND,
    },
  })
    .composite(composites)
    .webp({
      quality: CONTACT_SHEET_QUALITY,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(contactSheetPath);
}

async function main() {
  const thumbnailBySlug = await collectThumbnailBySlug();
  const thumbnailPaths = buildOrderedThumbnailPaths(thumbnailBySlug);

  if (thumbnailPaths.length === 0) {
    throw new Error(`No thumbnail tiles found under ${thumbnailsRoot}`);
  }

  await renderContactSheet(thumbnailPaths);

  const relativeOutput = toPosixPath(path.relative(projectRoot, contactSheetPath));
  console.log(`Rebuilt ${relativeOutput} with ${thumbnailPaths.length} tiles.`);
  thumbnailPaths.forEach((thumbnailPath) => {
    const relativePath = toPosixPath(path.relative(projectRoot, thumbnailPath));
    console.log(` - ${relativePath}`);
  });
}

await main();
