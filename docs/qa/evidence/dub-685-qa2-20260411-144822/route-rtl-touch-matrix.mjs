#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

function parseArgs(argv) {
  const args = {
    baseUrl: 'http://127.0.0.1:4173',
    routesPath: null,
    outPath: null,
    screenshotsDir: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--base-url') {
      args.baseUrl = argv[i + 1] ?? args.baseUrl;
      i += 1;
    } else if (token === '--routes') {
      args.routesPath = argv[i + 1] ?? args.routesPath;
      i += 1;
    } else if (token === '--out') {
      args.outPath = argv[i + 1] ?? args.outPath;
      i += 1;
    } else if (token === '--screenshots') {
      args.screenshotsDir = argv[i + 1] ?? args.screenshotsDir;
      i += 1;
    }
  }

  if (!args.routesPath || !args.outPath || !args.screenshotsDir) {
    throw new Error('Usage: node route-rtl-touch-matrix.mjs --routes <routes.json> --out <matrix.json> --screenshots <dir> [--base-url <url>]');
  }

  return args;
}

function routeToSlug(route) {
  if (route === '/') return 'root';
  return route
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '__')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'route';
}

function toElementDescriptor(element) {
  if (!element) return null;
  const id = element.id ? `#${element.id}` : '';
  const classes = element.classList && element.classList.length > 0
    ? `.${Array.from(element.classList).slice(0, 3).join('.')}`
    : '';
  const text = (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const label = element.getAttribute('aria-label') || '';
  return `${element.tagName.toLowerCase()}${id}${classes}${label ? ` [aria-label="${label}"]` : ''}${text ? ` :: ${text}` : ''}`;
}

async function collectRouteMetrics(page, routeType) {
  const domMetrics = await page.evaluate(() => {
    const selector = [
      'button',
      '[role="button"]',
      'a[href]',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const allInteractive = Array.from(document.querySelectorAll(selector));

    const visibleInteractive = allInteractive.filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.pointerEvents !== 'none'
      );
    });

    const touchViolations = visibleInteractive
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const label =
          node.getAttribute('aria-label') ||
          node.getAttribute('title') ||
          (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) ||
          `${node.tagName.toLowerCase()}`;

        return {
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
          label,
          tag: node.tagName.toLowerCase(),
          className: (node.className || '').toString().split(/\s+/).filter(Boolean).slice(0, 4).join(' '),
        };
      })
      .filter((node) => node.width < 44 || node.height < 44)
      .slice(0, 40);

    const iconButtonsMissingLabel = visibleInteractive
      .filter((node) => {
        if (node.tagName.toLowerCase() !== 'button' && node.getAttribute('role') !== 'button') {
          return false;
        }

        const text = (node.textContent || '').trim();
        const aria = (node.getAttribute('aria-label') || '').trim();
        const title = (node.getAttribute('title') || '').trim();
        const labelledby = (node.getAttribute('aria-labelledby') || '').trim();

        const hasInlineIcon = Boolean(node.querySelector('svg, img, [class*="icon"]'));

        return hasInlineIcon && text.length === 0 && !aria && !title && !labelledby;
      })
      .map((node) => ({
        tag: node.tagName.toLowerCase(),
        className: (node.className || '').toString().split(/\s+/).filter(Boolean).slice(0, 4).join(' '),
      }))
      .slice(0, 30);

    const html = document.documentElement;
    const body = document.body;
    const overflowPx = Math.max(
      0,
      Math.round(
        Math.max(html.scrollWidth, body ? body.scrollWidth : 0) - window.innerWidth,
      ),
    );

    const replayLikeControls = visibleInteractive.filter((node) => {
      const raw = [
        node.getAttribute('aria-label') || '',
        node.getAttribute('title') || '',
        node.textContent || '',
      ].join(' ').toLowerCase();

      return /▶|play|replay|audio|sound|speaker|נגן|השמע|הפעל/.test(raw);
    }).length;

    return {
      path: window.location.pathname,
      dir: html.getAttribute('dir') || '',
      lang: html.getAttribute('lang') || '',
      computedDirection: window.getComputedStyle(html).direction,
      overflowPx,
      hasHorizontalOverflow: overflowPx > 0,
      interactiveCount: visibleInteractive.length,
      touchViolationCount: touchViolations.length,
      touchViolations,
      iconButtonsMissingLabelCount: iconButtonsMissingLabel.length,
      iconButtonsMissingLabel,
      replayLikeControlCount: replayLikeControls,
    };
  });

  const focusTrail = [];
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;
      const id = active.id ? `#${active.id}` : '';
      const cls = active.classList && active.classList.length > 0
        ? `.${Array.from(active.classList).slice(0, 3).join('.')}`
        : '';
      const label = active.getAttribute('aria-label') || '';
      const text = (active.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      return `${active.tagName.toLowerCase()}${id}${cls}${label ? ` [aria-label="${label}"]` : ''}${text ? ` :: ${text}` : ''}`;
    });
    focusTrail.push(focused);
  }

  return {
    ...domMetrics,
    focusTrail,
    routeType,
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const routes = JSON.parse(await fs.readFile(args.routesPath, 'utf8'));
  const allRoutes = [
    ...(routes.public || []).map((route) => ({ route, routeType: 'public' })),
    ...(routes.protected || []).map((route) => ({ route, routeType: 'protected' })),
  ];

  await fs.mkdir(args.screenshotsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const matrix = [];

  try {
    for (const entry of allRoutes) {
      const { route, routeType } = entry;
      const slug = routeToSlug(route);
      const url = new URL(route, args.baseUrl).toString();

      const context = await browser.newContext({
        viewport: { width: 820, height: 1180 },
        locale: 'he-IL',
        colorScheme: 'light',
      });

      if (routeType === 'protected') {
        await context.addInitScript(() => {
          try {
            window.localStorage.setItem('dubiland:guest-mode', 'true');
            window.localStorage.setItem(
              'dubiland:active-child',
              JSON.stringify({ id: 'guest', name: 'אורח', emoji: '🧒' }),
            );
          } catch {
            // ignore
          }
        });
      }

      const page = await context.newPage();
      let navigationError = null;
      let metrics = null;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
        await page.waitForTimeout(900);
        metrics = await collectRouteMetrics(page, routeType);
      } catch (error) {
        navigationError = error instanceof Error ? error.message : String(error);
      }

      const screenshotPath = path.join(args.screenshotsDir, `${slug}.png`);
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch {
        // ignore screenshot failures and still report matrix entry
      }

      matrix.push({
        route,
        routeType,
        url,
        screenshot: screenshotPath,
        ...(metrics || {}),
        navigationError,
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    routeCount: matrix.length,
    failures: matrix.filter((item) => item.navigationError).length,
    rtlFailures: matrix.filter(
      (item) => !item.navigationError && (item.dir !== 'rtl' || item.computedDirection !== 'rtl'),
    ).map((item) => item.route),
    overflowFailures: matrix.filter(
      (item) => !item.navigationError && item.hasHorizontalOverflow,
    ).map((item) => ({ route: item.route, overflowPx: item.overflowPx })),
    touchFailures: matrix
      .filter((item) => !item.navigationError && item.touchViolationCount > 0)
      .map((item) => ({ route: item.route, touchViolationCount: item.touchViolationCount })),
    iconLabelFailures: matrix
      .filter((item) => !item.navigationError && item.iconButtonsMissingLabelCount > 0)
      .map((item) => ({ route: item.route, iconButtonsMissingLabelCount: item.iconButtonsMissingLabelCount })),
    entries: matrix,
  };

  await fs.writeFile(args.outPath, JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify({ outPath: args.outPath, routeCount: matrix.length })}\n`);
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
