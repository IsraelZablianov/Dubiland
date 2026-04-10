#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'packages', 'web', 'public');
const manifestPath = path.join(publicRoot, 'audio', 'he', 'manifest.json');

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Manifest must be a JSON object mapping i18n keys to paths');
  }

  return parsed;
}

function main() {
  let manifest;
  try {
    manifest = loadManifest();
  } catch (error) {
    console.error(`[audio-manifest] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
    return;
  }

  const entries = Object.entries(manifest);
  const missingFiles = [];
  const invalidPaths = [];
  const traversalPaths = [];
  const pathToKeys = new Map();

  const publicRootResolved = path.resolve(publicRoot);

  for (const [key, value] of entries) {
    if (typeof value !== 'string' || value.length === 0) {
      invalidPaths.push(`${key}: non-string path`);
      continue;
    }

    if (!value.startsWith('/audio/he/')) {
      invalidPaths.push(`${key}: ${value}`);
      continue;
    }

    const relative = value.replace(/^\//, '');
    const resolvedPath = path.resolve(publicRoot, relative);
    const inPublicRoot =
      resolvedPath === publicRootResolved || resolvedPath.startsWith(`${publicRootResolved}${path.sep}`);

    if (!inPublicRoot) {
      traversalPaths.push(`${key}: ${value}`);
      continue;
    }

    if (!fs.existsSync(resolvedPath)) {
      missingFiles.push(`${key}: ${value}`);
    }

    const keys = pathToKeys.get(value) ?? [];
    keys.push(key);
    pathToKeys.set(value, keys);
  }

  const duplicatePathGroups = [...pathToKeys.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([audioPath, keys]) => `${audioPath}: ${keys.join(', ')}`);

  console.log(`[audio-manifest] entries: ${entries.length}`);
  console.log(`[audio-manifest] missing files: ${missingFiles.length}`);
  console.log(`[audio-manifest] invalid paths: ${invalidPaths.length}`);
  console.log(`[audio-manifest] traversal violations: ${traversalPaths.length}`);
  console.log(`[audio-manifest] duplicate target paths: ${duplicatePathGroups.length}`);

  const printPreview = (label, items) => {
    if (items.length === 0) return;
    console.log(`\n${label}`);
    for (const item of items.slice(0, 25)) {
      console.log(`- ${item}`);
    }
  };

  printPreview('Missing files (first 25):', missingFiles);
  printPreview('Invalid paths (first 25):', invalidPaths);
  printPreview('Traversal violations (first 25):', traversalPaths);
  printPreview('Duplicate target paths (first 25):', duplicatePathGroups);

  if (missingFiles.length > 0 || invalidPaths.length > 0 || traversalPaths.length > 0) {
    process.exit(1);
    return;
  }

  console.log('\n[audio-manifest] OK');
}

main();
