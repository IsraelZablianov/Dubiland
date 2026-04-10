import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceRoot = path.join(projectRoot, 'assets-src', 'images');
const outputRoot = path.join(projectRoot, 'public', 'images');
const manifestPath = path.join(projectRoot, 'public', 'images-manifest.json');

const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const INVENTORY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg']);

const WEBP_QUALITY = Number(process.env.DUB_IMAGE_WEBP_QUALITY ?? 74);
const AVIF_QUALITY = Number(process.env.DUB_IMAGE_AVIF_QUALITY ?? 54);
const COMPACT_WIDTH = Number(process.env.DUB_IMAGE_COMPACT_WIDTH ?? 960);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function classifyAsset(assetPath) {
  if (assetPath.includes('games/thumbnails/')) return 'thumbnail';
  if (assetPath.includes('backgrounds/')) return 'background';
  if (assetPath.includes('handbooks/')) {
    if (/\/cover\.(png|jpe?g|webp|avif)$/i.test(assetPath)) return 'handbookCover';
    if (/\/page-\d+-960\.(png|jpe?g|webp|avif)$/i.test(assetPath)) return 'handbookPageCompact';
    if (/\/page-\d+\.(png|jpe?g|webp|avif)$/i.test(assetPath)) return 'handbookPage';
    return 'handbookMisc';
  }
  if (assetPath.includes('mascot/')) return 'mascot';
  if (assetPath.includes('topics/')) return 'topic';
  return 'general';
}

function isRasterExtension(extension) {
  return extension !== '.svg';
}

function isHandbookPageSource(sourceRelativePath) {
  return /^handbooks\/[^/]+\/page-\d+\.(png|jpe?g)$/i.test(sourceRelativePath);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(root, allowedExtensions) {
  if (!(await pathExists(root))) {
    return [];
  }

  const results = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!allowedExtensions.has(extension)) {
        continue;
      }

      results.push(absolutePath);
    }
  }

  await walk(root);
  return results;
}

async function ensureParentDirectory(targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
}

async function writeRendition(inputPath, outputPath, format, resizeWidth) {
  await ensureParentDirectory(outputPath);

  let pipeline = sharp(inputPath, {
    failOn: 'warning',
    limitInputPixels: false,
  }).rotate();

  if (typeof resizeWidth === 'number') {
    pipeline = pipeline.resize({
      width: resizeWidth,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (format === 'png') {
    await pipeline
      .png({
        compressionLevel: 9,
        effort: 10,
        quality: 80,
        palette: true,
      })
      .toFile(outputPath);
    return;
  }

  if (format === 'webp') {
    await pipeline
      .webp({
        quality: WEBP_QUALITY,
        alphaQuality: 82,
        effort: 6,
      })
      .toFile(outputPath);
    return;
  }

  if (format === 'avif') {
    await pipeline
      .avif({
        quality: AVIF_QUALITY,
        effort: 6,
        chromaSubsampling: '4:4:4',
      })
      .toFile(outputPath);
    return;
  }

  throw new Error(`Unsupported output format: ${format}`);
}

async function hashFile(absolutePath) {
  const bytes = await fs.readFile(absolutePath);
  return createHash('sha256').update(bytes).digest('hex');
}

async function readRasterMetadata(absolutePath) {
  try {
    const metadata = await sharp(absolutePath, { failOn: 'none', limitInputPixels: false }).metadata();
    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    };
  } catch {
    return {
      width: null,
      height: null,
    };
  }
}

async function optimizeSourceAssets() {
  const sourceFiles = await collectFiles(sourceRoot, SOURCE_EXTENSIONS);
  const generatedBy = new Map();

  for (const sourcePath of sourceFiles) {
    const sourceRelativePath = toPosixPath(path.relative(sourceRoot, sourcePath));
    const extension = path.extname(sourceRelativePath).toLowerCase();
    const sourceWithoutExtension = sourceRelativePath.slice(0, -extension.length);
    const outputBasePath = path.join(outputRoot, sourceWithoutExtension);

    const defaultOutputs = [
      `${outputBasePath}.png`,
      `${outputBasePath}.webp`,
      `${outputBasePath}.avif`,
    ];

    const pngOutputPath = `${outputBasePath}.png`;
    if (extension === '.png') {
      await ensureParentDirectory(pngOutputPath);
      await fs.copyFile(sourcePath, pngOutputPath);
    } else {
      await writeRendition(sourcePath, pngOutputPath, 'png');
    }
    await writeRendition(sourcePath, `${outputBasePath}.webp`, 'webp');
    await writeRendition(sourcePath, `${outputBasePath}.avif`, 'avif');

    for (const outputPath of defaultOutputs) {
      generatedBy.set(toPosixPath(path.relative(outputRoot, outputPath)), sourceRelativePath);
    }

    if (isHandbookPageSource(sourceRelativePath)) {
      const compactWebpPath = `${outputBasePath}-${COMPACT_WIDTH}.webp`;
      const compactAvifPath = `${outputBasePath}-${COMPACT_WIDTH}.avif`;

      await writeRendition(sourcePath, compactWebpPath, 'webp', COMPACT_WIDTH);
      await writeRendition(sourcePath, compactAvifPath, 'avif', COMPACT_WIDTH);

      generatedBy.set(
        toPosixPath(path.relative(outputRoot, compactWebpPath)),
        sourceRelativePath,
      );
      generatedBy.set(
        toPosixPath(path.relative(outputRoot, compactAvifPath)),
        sourceRelativePath,
      );
    }
  }

  return {
    sourceFiles,
    generatedBy,
  };
}

async function buildManifest(generatedBy) {
  const inventoryFiles = await collectFiles(outputRoot, INVENTORY_EXTENSIONS);
  const assets = [];

  for (const filePath of inventoryFiles) {
    const relativePath = toPosixPath(path.relative(outputRoot, filePath));
    const extension = path.extname(relativePath).toLowerCase();
    const stat = await fs.stat(filePath);
    const hash = await hashFile(filePath);

    const baseAsset = {
      path: `images/${relativePath}`,
      sourcePath: generatedBy.get(relativePath) ?? null,
      generated: generatedBy.has(relativePath),
      assetClass: classifyAsset(relativePath),
      format: extension.slice(1),
      bytes: stat.size,
      sha256: hash,
      width: null,
      height: null,
    };

    if (isRasterExtension(extension)) {
      const { width, height } = await readRasterMetadata(filePath);
      baseAsset.width = width;
      baseAsset.height = height;
    }

    assets.push(baseAsset);
  }

  assets.sort((a, b) => a.path.localeCompare(b.path));

  const summary = {
    totalAssets: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    byFormat: {},
    byClass: {},
  };

  for (const asset of assets) {
    summary.byFormat[asset.format] = (summary.byFormat[asset.format] ?? 0) + asset.bytes;
    summary.byClass[asset.assetClass] = (summary.byClass[asset.assetClass] ?? 0) + asset.bytes;
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceRoot: toPosixPath(path.relative(projectRoot, sourceRoot)),
    outputRoot: toPosixPath(path.relative(projectRoot, outputRoot)),
    settings: {
      webpQuality: WEBP_QUALITY,
      avifQuality: AVIF_QUALITY,
      compactWidth: COMPACT_WIDTH,
    },
    summary,
    assets,
  };
}

async function writeManifestFile(manifest) {
  await ensureParentDirectory(manifestPath);
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });

  const { sourceFiles, generatedBy } = await optimizeSourceAssets();
  const manifest = await buildManifest(generatedBy);
  await writeManifestFile(manifest);

  const totalKiB = (manifest.summary.totalBytes / 1024).toFixed(1);
  const generatedCount = Array.from(generatedBy.keys()).length;

  process.stdout.write(
    [
      `[images:optimize] source files processed: ${sourceFiles.length}`,
      `[images:optimize] renditions generated this run: ${generatedCount}`,
      `[images:optimize] manifest assets: ${manifest.summary.totalAssets} (${totalKiB} KiB)`,
      `[images:optimize] wrote ${toPosixPath(path.relative(projectRoot, manifestPath))}`,
      '',
    ].join('\n'),
  );
}

main().catch((error) => {
  process.stderr.write(`[images:optimize] failed: ${error.message}\n`);
  process.exitCode = 1;
});
