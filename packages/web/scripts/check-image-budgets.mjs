import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const manifestPath = path.join(projectRoot, 'public', 'images-manifest.json');

const DEFAULT_MAX_BYTES = 120 * 1024;

const BUDGETS_BY_CLASS = {
  thumbnail: {
    webp: 70 * 1024,
    avif: 58 * 1024,
    png: 90 * 1024,
    jpg: 90 * 1024,
    jpeg: 90 * 1024,
  },
  background: {
    webp: 90 * 1024,
    avif: 75 * 1024,
    png: 120 * 1024,
    jpg: 120 * 1024,
    jpeg: 120 * 1024,
  },
  handbookCover: {
    webp: 24 * 1024,
    avif: 20 * 1024,
    png: 96 * 1024,
    jpg: 96 * 1024,
    jpeg: 96 * 1024,
  },
  handbookPage: {
    webp: 28 * 1024,
    avif: 24 * 1024,
    png: 96 * 1024,
    jpg: 96 * 1024,
    jpeg: 96 * 1024,
  },
  handbookPageCompact: {
    webp: 14 * 1024,
    avif: 12 * 1024,
    png: 20 * 1024,
    jpg: 20 * 1024,
    jpeg: 20 * 1024,
  },
  handbookMisc: {
    webp: 36 * 1024,
    avif: 30 * 1024,
    png: 54 * 1024,
    jpg: 54 * 1024,
    jpeg: 54 * 1024,
  },
  mascot: {
    webp: 35 * 1024,
    avif: 30 * 1024,
    png: 55 * 1024,
    svg: 24 * 1024,
  },
  topic: {
    webp: 30 * 1024,
    avif: 24 * 1024,
    png: 45 * 1024,
    svg: 20 * 1024,
  },
  general: {
    webp: 80 * 1024,
    avif: 65 * 1024,
    png: 120 * 1024,
    jpg: 120 * 1024,
    jpeg: 120 * 1024,
    svg: 40 * 1024,
  },
};

const HANDBOOK_PRELOAD_MAX_BYTES = 60 * 1024;

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function getPerAssetBudgetBytes(assetClass, format) {
  const classBudgets = BUDGETS_BY_CLASS[assetClass] ?? BUDGETS_BY_CLASS.general;
  return classBudgets[format] ?? DEFAULT_MAX_BYTES;
}

function toAssetClassSummary(assets) {
  const summaryMap = new Map();

  for (const asset of assets) {
    const key = `${asset.assetClass}:${asset.format}`;
    const existing = summaryMap.get(key) ?? {
      assetClass: asset.assetClass,
      format: asset.format,
      count: 0,
      bytes: 0,
      maxBytes: 0,
    };

    existing.count += 1;
    existing.bytes += asset.bytes;
    existing.maxBytes = Math.max(existing.maxBytes, asset.bytes);

    summaryMap.set(key, existing);
  }

  return Array.from(summaryMap.values()).sort((a, b) => {
    if (a.assetClass === b.assetClass) {
      return a.format.localeCompare(b.format);
    }

    return a.assetClass.localeCompare(b.assetClass);
  });
}

function resolveHandbookSlug(assetPath) {
  const match = assetPath.match(/^images\/handbooks\/([^/]+)\//i);
  return match ? match[1] : null;
}

function getFirstTwoCompactPages(assets) {
  return assets
    .map((asset) => {
      const match = asset.path.match(/\/page-(\d+)-960\.(webp|avif|png)$/i);
      if (!match) {
        return null;
      }

      return {
        ...asset,
        pageNumber: Number(match[1]),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .slice(0, 2);
}

function selectCoverAsset(assets) {
  const preferredFormats = ['webp', 'avif', 'png', 'jpg', 'jpeg'];

  for (const format of preferredFormats) {
    const candidate = assets.find((asset) =>
      asset.path.endsWith(`/cover.${format}`),
    );

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function checkHandbookPreloadBudgets(assets) {
  const grouped = new Map();

  for (const asset of assets) {
    const slug = resolveHandbookSlug(asset.path);
    if (!slug) {
      continue;
    }

    const bucket = grouped.get(slug) ?? [];
    bucket.push(asset);
    grouped.set(slug, bucket);
  }

  const checks = [];

  for (const [slug, handbookAssets] of grouped) {
    const coverAsset = selectCoverAsset(handbookAssets);
    const compactPageAssets = getFirstTwoCompactPages(handbookAssets);

    const selected = [
      ...(coverAsset ? [coverAsset] : []),
      ...compactPageAssets,
    ];

    if (selected.length === 0) {
      continue;
    }

    const totalBytes = selected.reduce((sum, asset) => sum + asset.bytes, 0);

    checks.push({
      slug,
      assets: selected,
      totalBytes,
      pass: totalBytes <= HANDBOOK_PRELOAD_MAX_BYTES,
    });
  }

  checks.sort((a, b) => a.slug.localeCompare(b.slug));
  return checks;
}

async function main() {
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  if (!Array.isArray(manifest.assets)) {
    throw new Error(`Invalid manifest shape in ${manifestPath}`);
  }

  const assets = manifest.assets;
  const violations = [];

  for (const asset of assets) {
    const limitBytes = getPerAssetBudgetBytes(asset.assetClass, asset.format);

    if (asset.bytes > limitBytes) {
      violations.push({
        type: 'asset-size',
        asset,
        limitBytes,
      });
    }
  }

  const handbookChecks = checkHandbookPreloadBudgets(assets);

  for (const handbookCheck of handbookChecks) {
    if (!handbookCheck.pass) {
      violations.push({
        type: 'handbook-preload',
        handbookCheck,
      });
    }
  }

  const lines = [];
  lines.push(`[images:budgets] evaluated ${assets.length} assets from ${path.relative(projectRoot, manifestPath)}`);

  const classSummary = toAssetClassSummary(assets);
  for (const item of classSummary) {
    lines.push(
      `[images:budgets] ${item.assetClass}/${item.format}: ${item.count} files, total ${formatKiB(item.bytes)}, max ${formatKiB(item.maxBytes)}`,
    );
  }

  for (const handbookCheck of handbookChecks) {
    lines.push(
      `[images:budgets] handbook preload ${handbookCheck.slug}: ${formatKiB(handbookCheck.totalBytes)} / ${formatKiB(HANDBOOK_PRELOAD_MAX_BYTES)}`,
    );
  }

  if (violations.length > 0) {
    lines.push(`[images:budgets] FAIL — ${violations.length} budget violation(s)`);

    for (const violation of violations) {
      if (violation.type === 'asset-size') {
        lines.push(
          `  - ${violation.asset.path} (${formatKiB(violation.asset.bytes)}) > limit ${formatKiB(violation.limitBytes)}`,
        );
        continue;
      }

      if (violation.type === 'handbook-preload') {
        lines.push(
          `  - handbook preload ${violation.handbookCheck.slug} (${formatKiB(violation.handbookCheck.totalBytes)}) exceeds ${formatKiB(HANDBOOK_PRELOAD_MAX_BYTES)}`,
        );
      }
    }

    process.stdout.write(`${lines.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  lines.push('[images:budgets] PASS — all image budgets within thresholds');
  process.stdout.write(`${lines.join('\n')}\n`);
}

main().catch((error) => {
  process.stderr.write(`[images:budgets] failed: ${error.message}\n`);
  process.exitCode = 1;
});
