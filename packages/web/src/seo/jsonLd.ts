import type { RouteMetadataKey } from './routeMetadata';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

export interface JsonLdScript {
  id: string;
  payload: Record<string, unknown>;
}

interface BuildJsonLdOptions {
  routeKey: RouteMetadataKey;
  indexable: boolean;
  canonicalOrigin: string;
  canonicalPath: string | null;
  title: string;
  description: string;
  appName: string;
  breadcrumbItems: BreadcrumbItem[];
  faqItems: FaqItem[];
}

const SCHEMA_CONTEXT = 'https://schema.org';
const WEB_APPLICATION_ROUTE_KEYS: RouteMetadataKey[] = ['landing', 'letters', 'numbers', 'reading'];

function toAbsoluteUrl(path: string, canonicalOrigin: string): string {
  return new URL(path, canonicalOrigin).toString();
}

function buildOrganizationSchema(
  canonicalOrigin: string,
  appName: string,
  description: string,
): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Organization',
    name: appName,
    alternateName: 'Dubiland',
    url: toAbsoluteUrl('/', canonicalOrigin),
    logo: toAbsoluteUrl('/favicon.svg', canonicalOrigin),
    description,
    inLanguage: 'he-IL',
  };
}

function buildWebApplicationSchema(
  canonicalOrigin: string,
  canonicalPath: string,
  title: string,
  description: string,
): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebApplication',
    name: title,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description,
    url: toAbsoluteUrl(canonicalPath, canonicalOrigin),
    inLanguage: 'he-IL',
  };
}

function buildBreadcrumbListSchema(
  canonicalOrigin: string,
  breadcrumbItems: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path, canonicalOrigin),
    })),
  };
}

function buildFaqPageSchema(faqItems: FaqItem[]): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildJsonLdScripts(options: BuildJsonLdOptions): JsonLdScript[] {
  if (!options.indexable || !options.canonicalPath) {
    return [];
  }

  const scripts: JsonLdScript[] = [
    {
      id: 'organization',
      payload: buildOrganizationSchema(options.canonicalOrigin, options.appName, options.description),
    },
  ];

  if (WEB_APPLICATION_ROUTE_KEYS.includes(options.routeKey)) {
    scripts.push({
      id: 'web-application',
      payload: buildWebApplicationSchema(
        options.canonicalOrigin,
        options.canonicalPath,
        options.title,
        options.description,
      ),
    });
  }

  if (options.breadcrumbItems.length > 1) {
    scripts.push({
      id: 'breadcrumb-list',
      payload: buildBreadcrumbListSchema(options.canonicalOrigin, options.breadcrumbItems),
    });
  }

  if (options.routeKey === 'parentsFaq' && options.faqItems.length > 0) {
    scripts.push({
      id: 'faq-page',
      payload: buildFaqPageSchema(options.faqItems),
    });
  }

  return scripts;
}

function hasRequiredFields(payload: Record<string, unknown>, requiredFields: string[]): boolean {
  return requiredFields.every((field) => field in payload);
}

export function isValidJsonLdPayload(payload: Record<string, unknown>): boolean {
  if (payload['@context'] !== SCHEMA_CONTEXT || typeof payload['@type'] !== 'string') {
    return false;
  }

  const schemaType = payload['@type'];
  if (schemaType === 'Organization') {
    return hasRequiredFields(payload, ['name', 'url', 'logo', 'description', 'inLanguage']);
  }

  if (schemaType === 'WebApplication') {
    return hasRequiredFields(payload, [
      'name',
      'applicationCategory',
      'operatingSystem',
      'description',
      'url',
      'inLanguage',
    ]);
  }

  if (schemaType === 'BreadcrumbList') {
    return Array.isArray(payload.itemListElement) && payload.itemListElement.length > 0;
  }

  if (schemaType === 'FAQPage') {
    return Array.isArray(payload.mainEntity) && payload.mainEntity.length > 0;
  }

  return false;
}

let smokeChecksRan = false;

interface SmokeCheckScenario {
  name: string;
  expectedSchemaIds: string[];
  options: BuildJsonLdOptions;
}

function assertExpectedSchemaIds(scripts: JsonLdScript[], expectedSchemaIds: string[], scenarioName: string): void {
  const actualSchemaIds = scripts.map((script) => script.id);
  if (
    actualSchemaIds.length !== expectedSchemaIds.length ||
    actualSchemaIds.some((schemaId, index) => schemaId !== expectedSchemaIds[index])
  ) {
    throw new Error(
      `Unexpected JSON-LD schema set for "${scenarioName}". expected=[${expectedSchemaIds.join(', ')}] actual=[${actualSchemaIds.join(', ')}]`,
    );
  }
}

export function runJsonLdSmokeChecks(): void {
  if (smokeChecksRan) {
    return;
  }
  smokeChecksRan = true;

  const scenarios: SmokeCheckScenario[] = [
    {
      name: 'landing route',
      expectedSchemaIds: ['organization', 'web-application'],
      options: {
        routeKey: 'landing',
        indexable: true,
        canonicalOrigin: 'https://www.dubiland.example',
        canonicalPath: '/',
        title: 'Dubiland',
        description: 'Hebrew learning platform for children',
        appName: 'Dubiland',
        breadcrumbItems: [{ name: 'Dubiland', path: '/' }],
        faqItems: [],
      },
    },
    {
      name: 'about route',
      expectedSchemaIds: ['organization'],
      options: {
        routeKey: 'about',
        indexable: true,
        canonicalOrigin: 'https://www.dubiland.example',
        canonicalPath: '/about',
        title: 'About Dubiland',
        description: 'About the platform',
        appName: 'Dubiland',
        breadcrumbItems: [{ name: 'Dubiland', path: '/' }],
        faqItems: [],
      },
    },
    {
      name: 'letters route',
      expectedSchemaIds: ['organization', 'web-application', 'breadcrumb-list'],
      options: {
        routeKey: 'letters',
        indexable: true,
        canonicalOrigin: 'https://www.dubiland.example',
        canonicalPath: '/letters',
        title: 'Letters',
        description: 'Letters topic',
        appName: 'Dubiland',
        breadcrumbItems: [
          { name: 'Dubiland', path: '/' },
          { name: 'Letters', path: '/letters' },
        ],
        faqItems: [],
      },
    },
    {
      name: 'parents faq route',
      expectedSchemaIds: ['organization', 'breadcrumb-list', 'faq-page'],
      options: {
        routeKey: 'parentsFaq',
        indexable: true,
        canonicalOrigin: 'https://www.dubiland.example',
        canonicalPath: '/parents/faq',
        title: 'Frequently Asked Questions',
        description: 'FAQ for parents',
        appName: 'Dubiland',
        breadcrumbItems: [
          { name: 'Dubiland', path: '/' },
          { name: 'For Parents', path: '/parents' },
          { name: 'FAQ', path: '/parents/faq' },
        ],
        faqItems: [
          {
            question: 'What ages is Dubiland for?',
            answer: 'For ages 3-7.',
          },
        ],
      },
    },
    {
      name: 'non-indexable login route',
      expectedSchemaIds: [],
      options: {
        routeKey: 'login',
        indexable: false,
        canonicalOrigin: 'https://www.dubiland.example',
        canonicalPath: '/login',
        title: 'Login',
        description: 'App login',
        appName: 'Dubiland',
        breadcrumbItems: [{ name: 'Dubiland', path: '/' }],
        faqItems: [],
      },
    },
  ];

  scenarios.forEach((scenario) => {
    const scripts = buildJsonLdScripts(scenario.options);
    assertExpectedSchemaIds(scripts, scenario.expectedSchemaIds, scenario.name);

    scripts.forEach((script) => {
      if (!isValidJsonLdPayload(script.payload)) {
        throw new Error(
          `Invalid JSON-LD payload in smoke checks for "${scenario.name}" schema: ${script.id}`,
        );
      }
      JSON.parse(JSON.stringify(script.payload));
    });
  });
}
