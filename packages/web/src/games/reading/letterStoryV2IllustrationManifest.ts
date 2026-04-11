export type LetterStoryV2ChapterId = 'one' | 'two' | 'three';

export type LetterStoryV2LetterId =
  | 'alef'
  | 'bet'
  | 'gimel'
  | 'dalet'
  | 'he'
  | 'vav'
  | 'zayin'
  | 'het'
  | 'tet'
  | 'yod'
  | 'kaf'
  | 'lamed'
  | 'mem'
  | 'nun'
  | 'samekh'
  | 'ayin'
  | 'pe'
  | 'tsadi'
  | 'qof'
  | 'resh'
  | 'shin'
  | 'tav';

export interface LetterStoryV2IllustrationScene {
  order: number;
  letterId: LetterStoryV2LetterId;
  chapter: LetterStoryV2ChapterId;
  slug: string;
  sourcePath: string;
  runtimeBasePath: string;
}

export const LETTER_STORY_V2_ILLUSTRATION_SCENES: readonly LetterStoryV2IllustrationScene[] = [
  {
    order: 1,
    letterId: 'alef',
    chapter: 'one',
    slug: 'alef',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-01-alef.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-01-alef',
  },
  {
    order: 2,
    letterId: 'bet',
    chapter: 'one',
    slug: 'bet',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-02-bet.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-02-bet',
  },
  {
    order: 3,
    letterId: 'gimel',
    chapter: 'one',
    slug: 'gimel',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-03-gimel.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-03-gimel',
  },
  {
    order: 4,
    letterId: 'dalet',
    chapter: 'one',
    slug: 'dalet',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-04-dalet.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-04-dalet',
  },
  {
    order: 5,
    letterId: 'he',
    chapter: 'one',
    slug: 'he',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-05-he.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-05-he',
  },
  {
    order: 6,
    letterId: 'vav',
    chapter: 'one',
    slug: 'vav',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-06-vav.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-06-vav',
  },
  {
    order: 7,
    letterId: 'zayin',
    chapter: 'one',
    slug: 'zayin',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-07-zayin.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-07-zayin',
  },
  {
    order: 8,
    letterId: 'het',
    chapter: 'one',
    slug: 'het',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-08-het.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-08-het',
  },
  {
    order: 9,
    letterId: 'tet',
    chapter: 'two',
    slug: 'tet',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-09-tet.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-09-tet',
  },
  {
    order: 10,
    letterId: 'yod',
    chapter: 'two',
    slug: 'yod',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-10-yod.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-10-yod',
  },
  {
    order: 11,
    letterId: 'kaf',
    chapter: 'two',
    slug: 'kaf',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-11-kaf.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-11-kaf',
  },
  {
    order: 12,
    letterId: 'lamed',
    chapter: 'two',
    slug: 'lamed',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-12-lamed.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-12-lamed',
  },
  {
    order: 13,
    letterId: 'mem',
    chapter: 'two',
    slug: 'mem',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-13-mem.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-13-mem',
  },
  {
    order: 14,
    letterId: 'nun',
    chapter: 'two',
    slug: 'nun',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-14-nun.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-14-nun',
  },
  {
    order: 15,
    letterId: 'samekh',
    chapter: 'two',
    slug: 'samekh',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-15-samekh.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-15-samekh',
  },
  {
    order: 16,
    letterId: 'ayin',
    chapter: 'three',
    slug: 'ayin',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-16-ayin.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-16-ayin',
  },
  {
    order: 17,
    letterId: 'pe',
    chapter: 'three',
    slug: 'pe',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-17-pe.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-17-pe',
  },
  {
    order: 18,
    letterId: 'tsadi',
    chapter: 'three',
    slug: 'tsadi',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-18-tsadi.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-18-tsadi',
  },
  {
    order: 19,
    letterId: 'qof',
    chapter: 'three',
    slug: 'qof',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-19-qof.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-19-qof',
  },
  {
    order: 20,
    letterId: 'resh',
    chapter: 'three',
    slug: 'resh',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-20-resh.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-20-resh',
  },
  {
    order: 21,
    letterId: 'shin',
    chapter: 'three',
    slug: 'shin',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-21-shin.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-21-shin',
  },
  {
    order: 22,
    letterId: 'tav',
    chapter: 'three',
    slug: 'tav',
    sourcePath: 'packages/web/assets-src/images/storybooks/letter-story-v2/scene-22-tav.jpg',
    runtimeBasePath: '/images/storybooks/letter-story-v2/scene-22-tav',
  },
] as const;

