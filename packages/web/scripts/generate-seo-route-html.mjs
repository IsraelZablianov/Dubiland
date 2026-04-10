import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SEO_PUBLIC_ROUTES = [
  '/about',
  '/letters',
  '/numbers',
  '/reading',
  '/parents',
  '/parents/faq',
  '/terms',
  '/privacy',
];

function toHtmlFilePath(distDir, route) {
  const normalizedRoute = route.replace(/^\/+/, '');

  if (!normalizedRoute) {
    throw new Error(`Cannot generate file path for route "${route}"`);
  }

  return path.join(distDir, `${normalizedRoute}.html`);
}

async function generateSeoRouteHtml() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const sourceIndexPath = path.join(distDir, 'index.html');
  const sourceIndexHtml = await readFile(sourceIndexPath, 'utf8');

  await Promise.all(
    SEO_PUBLIC_ROUTES.map(async (route) => {
      const routeHtmlPath = toHtmlFilePath(distDir, route);
      await mkdir(path.dirname(routeHtmlPath), { recursive: true });
      await writeFile(routeHtmlPath, sourceIndexHtml, 'utf8');
      process.stdout.write(`Generated ${path.relative(distDir, routeHtmlPath)}\n`);
    }),
  );
}

generateSeoRouteHtml().catch((error) => {
  process.stderr.write(`Failed to generate SEO route HTML files: ${error.message}\n`);
  process.exitCode = 1;
});
