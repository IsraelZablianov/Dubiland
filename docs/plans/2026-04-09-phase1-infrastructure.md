# Phase 1 — Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Dubiland monorepo, Supabase backend, auth, i18n, TTS pipeline, agent documentation, and Paperclip orchestration — so AI agents can take over from Phase 2 onward.

**Architecture:** Yarn workspace monorepo with 3 packages (web, remotion, shared). Supabase provides auth + Postgres + storage. Vite dev server for React. Edge TTS for Hebrew audio generation. Paperclip orchestrates 9 AI agents via heartbeats.

**Tech Stack:** React 19, TypeScript, Vite, Yarn workspaces, Supabase, i18next, Edge TTS, Paperclip

---

## File Structure

```
dubiland/
├── package.json                          # Yarn workspace root
├── tsconfig.base.json                    # Shared TS config
├── .gitignore
├── .env                                  # Local secrets (not committed)
├── .env.example                          # Template
├── AGENTS.md                             # Agent source of truth
├── CLAUDE.md                             # Points to AGENTS.md
├── .cursor/rules/dubiland.mdc            # Cursor rules
├── packages/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── lib/
│   │       │   └── supabase.ts
│   │       ├── hooks/
│   │       │   └── useAuth.ts
│   │       ├── pages/
│   │       │   └── Login.tsx
│   │       ├── styles/
│   │       │   └── global.css
│   │       ├── i18n/
│   │       │   ├── index.ts
│   │       │   ├── types.ts
│   │       │   └── locales/
│   │       │       └── he/
│   │       │           ├── common.json
│   │       │           └── onboarding.json
│   │       └── components/
│   │           └── ProtectedRoute.tsx
│   ├── remotion/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── Root.tsx
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           └── types/
│               ├── user.ts
│               ├── game.ts
│               └── progress.ts
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 00001_initial_schema.sql
├── scripts/
│   └── generate-audio.ts
├── docs/
│   ├── specs/
│   │   └── 2026-04-09-dubiland-design.md
│   ├── plans/
│   ├── games/
│   ├── architecture/
│   └── knowledge/
└── .superpowers/                          # gitignored
```

---

### Task 1: Initialize Yarn Workspace Monorepo

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/web/package.json`
- Create: `packages/shared/package.json`
- Create: `packages/remotion/package.json`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/israelz/Documents/dev/AI/Learning
git init
```

- [ ] **Step 2: Create root package.json with Yarn workspaces**

Create `package.json`:

```json
{
  "name": "dubiland",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "yarn workspace @dubiland/web dev",
    "build": "yarn workspace @dubiland/web build",
    "typecheck": "yarn workspaces foreach -A run typecheck",
    "generate-audio": "tsx scripts/generate-audio.ts"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
.superpowers/
.DS_Store
*.local
```

- [ ] **Step 5: Create .env.example**

```
# Dubiland Environment Variables

# Nano Banana (Gemini) API Key — used for AI image generation
NANO_BANANA_API_KEY=your_api_key_here

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 6: Create packages/shared/package.json**

```json
{
  "name": "@dubiland/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 7: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create packages/web/package.json**

```json
{
  "name": "@dubiland/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@supabase/supabase-js": "^2.49.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0",
    "@dubiland/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "vite": "^6.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 9: Create packages/remotion/package.json**

```json
{
  "name": "@dubiland/remotion",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "remotion": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@dubiland/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 10: Install dependencies**

```bash
yarn install
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: initialize yarn workspace monorepo with web, shared, and remotion packages"
```

---

### Task 2: Set Up Vite + React + TypeScript with RTL Hebrew

**Files:**
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/index.html`
- Create: `packages/web/src/main.tsx`
- Create: `packages/web/src/App.tsx`
- Create: `packages/web/src/styles/global.css`

- [ ] **Step 1: Create packages/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [
    { "path": "../shared" }
  ]
}
```

- [ ] **Step 2: Create packages/web/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
```

- [ ] **Step 3: Create packages/web/index.html**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>דובילנד</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create packages/web/src/styles/global.css**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  direction: rtl;
  font-family: 'Rubik', 'Heebo', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100vh;
  background: #FFF8E7;
  color: #5D3A1A;
}

button {
  cursor: pointer;
  font-family: inherit;
}

@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&family=Heebo:wght@400;500;700&display=swap');
```

- [ ] **Step 5: Create packages/web/src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 6: Create packages/web/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Home() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <span style={{ fontSize: '4rem' }}>🧸</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>דובילנד</h1>
      <p>{t('onboarding.welcome')}</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
```

- [ ] **Step 7: Run dev server to verify**

```bash
yarn dev
```

Expected: Vite dev server at `http://localhost:3000` showing דובילנד with the bear emoji, RTL layout, Hebrew font.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: set up vite + react + typescript with RTL hebrew support"
```

---

### Task 3: Set Up i18n with Hebrew Locale

**Files:**
- Create: `packages/web/src/i18n/index.ts`
- Create: `packages/web/src/i18n/types.ts`
- Create: `packages/web/src/i18n/locales/he/common.json`
- Create: `packages/web/src/i18n/locales/he/onboarding.json`

- [ ] **Step 1: Create packages/web/src/i18n/locales/he/common.json**

```json
{
  "feedback": {
    "success": "כל הכבוד!",
    "tryAgain": "נסה שוב!",
    "almostThere": "כמעט!"
  },
  "nav": {
    "back": "חזרה",
    "chooseTopic": "בחר נושא",
    "chooseGame": "בחר משחק",
    "home": "דף הבית"
  },
  "profile": {
    "whoPlaysToday": "מי משחק היום?",
    "addChild": "הוספה"
  },
  "topics": {
    "math": "מספרים",
    "letters": "אותיות",
    "reading": "קריאה"
  }
}
```

- [ ] **Step 2: Create packages/web/src/i18n/locales/he/onboarding.json**

```json
{
  "welcome": "ברוכים הבאים לדובילנד!",
  "loginWithGoogle": "התחברות עם גוגל",
  "loginWithEmail": "התחברות עם אימייל",
  "createAccount": "יצירת חשבון",
  "emailPlaceholder": "אימייל",
  "passwordPlaceholder": "סיסמה"
}
```

- [ ] **Step 3: Create packages/web/src/i18n/types.ts**

```typescript
import type common from './locales/he/common.json';
import type onboarding from './locales/he/onboarding.json';

export interface I18nResources {
  common: typeof common;
  onboarding: typeof onboarding;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: I18nResources;
  }
}
```

- [ ] **Step 4: Create packages/web/src/i18n/index.ts**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/he/common.json';
import onboarding from './locales/he/onboarding.json';

i18n.use(initReactI18next).init({
  resources: {
    he: {
      common,
      onboarding,
    },
  },
  lng: 'he',
  fallbackLng: 'he',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

- [ ] **Step 5: Verify i18n works in dev**

```bash
yarn dev
```

Expected: The page shows "!ברוכים הבאים לדובילנד" using the `t('onboarding.welcome')` key.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: set up i18next with typed hebrew locale files"
```

---

### Task 4: Set Up Supabase Project + Initial Schema

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/00001_initial_schema.sql`
- Create: `packages/web/src/lib/supabase.ts`
- Modify: `packages/web/package.json` (ensure @supabase/supabase-js is listed)

- [ ] **Step 1: Create Supabase project via dashboard**

Go to https://supabase.com/dashboard, create a new project called "dubiland". Copy the project URL and anon key to `.env`:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

- [ ] **Step 2: Create supabase/migrations/00001_initial_schema.sql**

```sql
-- Families (parent accounts) — linked to Supabase Auth
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Child profiles
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT 'bear',
  theme TEXT DEFAULT 'bear',
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_key TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- Age groups
CREATE TABLE age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_key TEXT NOT NULL,
  min_age INT NOT NULL,
  max_age INT NOT NULL
);

-- Games catalog
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  age_group_id UUID NOT NULL REFERENCES age_groups(id),
  slug TEXT UNIQUE NOT NULL,
  name_key TEXT NOT NULL,
  description_key TEXT,
  game_type TEXT NOT NULL,
  component_key TEXT NOT NULL,
  difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  sort_order INT DEFAULT 0,
  thumbnail_url TEXT,
  audio_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Game levels
CREATE TABLE game_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  level_number INT NOT NULL,
  config_json JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  UNIQUE(game_id, level_number)
);

-- Progress tracking
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id),
  level_id UUID REFERENCES game_levels(id),
  stars INT DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  score INT DEFAULT 0,
  attempts INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_played TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  age_group_id UUID NOT NULL REFERENCES age_groups(id),
  name_key TEXT NOT NULL,
  description_key TEXT,
  video_type TEXT NOT NULL CHECK (video_type IN ('explainer', 'song', 'interactive')),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_sec INT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Video watch progress
CREATE TABLE video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id),
  watched BOOLEAN DEFAULT false,
  watch_time_sec INT DEFAULT 0,
  last_watched TIMESTAMPTZ DEFAULT now()
);

-- Seed initial topics
INSERT INTO topics (slug, name_key, icon, sort_order) VALUES
  ('math', 'topics.math', '🔢', 1),
  ('letters', 'topics.letters', '🔤', 2),
  ('reading', 'topics.reading', '📖', 3);

-- Seed age groups
INSERT INTO age_groups (label_key, min_age, max_age) VALUES
  ('ageGroups.3to4', 3, 4),
  ('ageGroups.4to5', 4, 5),
  ('ageGroups.5to6', 5, 6),
  ('ageGroups.6to7', 6, 7);

-- RLS policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Families: users can only see their own family
CREATE POLICY "families_own" ON families
  FOR ALL USING (auth_user_id = auth.uid());

-- Children: users can only see their own family's children
CREATE POLICY "children_own" ON children
  FOR ALL USING (family_id IN (SELECT id FROM families WHERE auth_user_id = auth.uid()));

-- Progress: users can only see their children's progress
CREATE POLICY "progress_own" ON progress
  FOR ALL USING (child_id IN (
    SELECT c.id FROM children c
    JOIN families f ON c.family_id = f.id
    WHERE f.auth_user_id = auth.uid()
  ));

-- Video progress: same as progress
CREATE POLICY "video_progress_own" ON video_progress
  FOR ALL USING (child_id IN (
    SELECT c.id FROM children c
    JOIN families f ON c.family_id = f.id
    WHERE f.auth_user_id = auth.uid()
  ));

-- Public read for content tables
CREATE POLICY "topics_public_read" ON topics FOR SELECT USING (true);
CREATE POLICY "age_groups_public_read" ON age_groups FOR SELECT USING (true);
CREATE POLICY "games_public_read" ON games FOR SELECT USING (true);
CREATE POLICY "game_levels_public_read" ON game_levels FOR SELECT USING (true);
CREATE POLICY "videos_public_read" ON videos FOR SELECT USING (true);
```

- [ ] **Step 3: Run migration in Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste and run the migration. Alternatively use `supabase db push` if Supabase CLI is installed.

- [ ] **Step 4: Create packages/web/src/lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 5: Update .env and .env.example with VITE_ prefix**

The `.env` file needs `VITE_` prefix for Vite to expose them to the client:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
NANO_BANANA_API_KEY=your_key_here
```

- [ ] **Step 6: Commit**

```bash
git add supabase/ packages/web/src/lib/supabase.ts .env.example
git commit -m "feat: set up supabase with initial schema, RLS policies, and seed data"
```

---

### Task 5: Set Up Supabase Auth (Google + Email)

**Files:**
- Create: `packages/web/src/hooks/useAuth.ts`
- Create: `packages/web/src/components/ProtectedRoute.tsx`
- Create: `packages/web/src/pages/Login.tsx`
- Modify: `packages/web/src/App.tsx`

- [ ] **Step 1: Enable Google auth in Supabase dashboard**

Go to Supabase → Authentication → Providers → Enable Google. Follow the setup guide to configure OAuth credentials in Google Cloud Console.

Also enable Email auth (should be on by default).

- [ ] **Step 2: Create packages/web/src/hooks/useAuth.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { user, session, loading, signInWithGoogle, signInWithEmail, signUp, signOut };
}
```

- [ ] **Step 3: Create packages/web/src/components/ProtectedRoute.tsx**

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ fontSize: '3rem' }}>🧸</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Create packages/web/src/pages/Login.tsx**

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { t } = useTranslation('onboarding');
  const { user, signInWithGoogle, signInWithEmail, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '2rem', background: 'linear-gradient(180deg, #FFF8E7, #F5E6C8)',
    }}>
      <span style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🧸</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem', color: '#5D3A1A' }}>דובילנד</h1>

      <button
        onClick={signInWithGoogle}
        style={{
          width: '280px', padding: '0.8rem', borderRadius: '30px', border: 'none',
          background: '#FF6B6B', color: 'white', fontSize: '1.1rem', fontWeight: 600,
          boxShadow: '0 4px 0 #cc5555', marginBottom: '0.8rem', fontFamily: 'inherit',
        }}
      >
        {t('loginWithGoogle')}
      </button>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '280px' }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          style={{
            padding: '0.7rem', borderRadius: '12px', border: '2px solid #E8D5B0',
            fontSize: '1rem', fontFamily: 'inherit', textAlign: 'right',
          }}
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={{
            padding: '0.7rem', borderRadius: '12px', border: '2px solid #E8D5B0',
            fontSize: '1rem', fontFamily: 'inherit', textAlign: 'right',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.8rem', borderRadius: '30px', border: '2px solid #E8D5B0',
            background: '#fff', color: '#5D3A1A', fontSize: '1rem', fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          {isSignUp ? t('createAccount') : t('loginWithEmail')}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ background: 'none', border: 'none', color: '#8B7355', marginTop: '1rem', fontSize: '0.9rem', fontFamily: 'inherit' }}
      >
        {isSignUp ? t('loginWithEmail') : t('createAccount')}
      </button>

      {error && <p style={{ color: '#FF6B6B', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Update packages/web/src/App.tsx with routes**

```tsx
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from '@/pages/Login';

function Home() {
  const { t } = useTranslation();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: '1rem',
      background: 'linear-gradient(180deg, #FFF8E7, #F5E6C8)',
    }}>
      <span style={{ fontSize: '4rem' }}>🧸</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#5D3A1A' }}>דובילנד</h1>
      <p style={{ color: '#8B7355' }}>{t('onboarding.welcome')}</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    </Routes>
  );
}
```

- [ ] **Step 6: Verify auth flow**

```bash
yarn dev
```

Expected: Navigating to `http://localhost:3000` redirects to `/login`. Google sign-in button works. Email sign-up creates user in Supabase.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add supabase auth with google and email login"
```

---

### Task 6: Set Up Shared Types

**Files:**
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/game.ts`
- Create: `packages/shared/src/types/progress.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create packages/shared/src/types/user.ts**

```typescript
export interface Family {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  avatar: string;
  theme: string;
  birthDate: string | null;
  createdAt: string;
}
```

- [ ] **Step 2: Create packages/shared/src/types/game.ts**

```typescript
export interface Topic {
  id: string;
  slug: string;
  nameKey: string;
  icon: string;
  sortOrder: number;
}

export interface AgeGroup {
  id: string;
  labelKey: string;
  minAge: number;
  maxAge: number;
}

export interface Game {
  id: string;
  topicId: string;
  ageGroupId: string;
  slug: string;
  nameKey: string;
  descriptionKey: string | null;
  gameType: string;
  componentKey: string;
  difficulty: number;
  sortOrder: number;
  thumbnailUrl: string | null;
  audioUrl: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface GameLevel {
  id: string;
  gameId: string;
  levelNumber: number;
  configJson: Record<string, unknown>;
  sortOrder: number;
}

export interface Video {
  id: string;
  topicId: string;
  ageGroupId: string;
  nameKey: string;
  descriptionKey: string | null;
  videoType: 'explainer' | 'song' | 'interactive';
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}
```

- [ ] **Step 3: Create packages/shared/src/types/progress.ts**

```typescript
export interface GameProgress {
  id: string;
  childId: string;
  gameId: string;
  levelId: string | null;
  stars: number;
  score: number;
  attempts: number;
  completed: boolean;
  lastPlayed: string;
  createdAt: string;
}

export interface GameResult {
  stars: number;
  score: number;
  completed: boolean;
}

export interface VideoProgress {
  id: string;
  childId: string;
  videoId: string;
  watched: boolean;
  watchTimeSec: number;
  lastWatched: string;
}
```

- [ ] **Step 4: Create packages/shared/src/index.ts**

```typescript
export type { Family, Child } from './types/user';
export type { Topic, AgeGroup, Game, GameLevel, Video } from './types/game';
export type { GameProgress, GameResult, VideoProgress } from './types/progress';
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add shared typescript types for user, game, and progress entities"
```

---

### Task 7: Set Up Edge TTS Audio Generation Script

**Files:**
- Create: `scripts/generate-audio.ts`
- Modify: `package.json` (add edge-tts dependency)

- [ ] **Step 1: Install edge-tts package**

```bash
yarn add -D edge-tts -W
```

- [ ] **Step 2: Create scripts/generate-audio.ts**

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const VOICE = 'he-IL-HilaNeural';
const OUTPUT_BASE = path.resolve(__dirname, '../packages/web/public/audio/he');

interface AudioEntry {
  key: string;
  text: string;
  outputPath: string;
}

async function generateAudio(entry: AudioEntry): Promise<void> {
  const dir = path.dirname(entry.outputPath);
  await mkdir(dir, { recursive: true });

  if (existsSync(entry.outputPath)) {
    console.log(`  ⏭️  Skipping (exists): ${entry.key}`);
    return;
  }

  try {
    await execAsync(
      `edge-tts --voice "${VOICE}" --text "${entry.text}" --write-media "${entry.outputPath}"`
    );
    console.log(`  ✅ Generated: ${entry.key}`);
  } catch (err) {
    console.error(`  ❌ Failed: ${entry.key}`, err);
  }
}

async function generateFeedbackAudio(): Promise<AudioEntry[]> {
  return [
    { key: 'feedback.success', text: 'כל הכבוד!', outputPath: path.join(OUTPUT_BASE, 'feedback/success.mp3') },
    { key: 'feedback.tryAgain', text: 'נסה שוב!', outputPath: path.join(OUTPUT_BASE, 'feedback/try-again.mp3') },
    { key: 'feedback.almostThere', text: 'כמעט!', outputPath: path.join(OUTPUT_BASE, 'feedback/almost-there.mp3') },
  ];
}

async function generateDubiAudio(): Promise<AudioEntry[]> {
  return [
    { key: 'dubi.welcome', text: 'שלום! אני דובי, ברוכים הבאים לדובילנד!', outputPath: path.join(OUTPUT_BASE, 'dubi/welcome.mp3') },
    { key: 'dubi.greatJob', text: 'עבודה מצוינת!', outputPath: path.join(OUTPUT_BASE, 'dubi/great-job.mp3') },
    { key: 'dubi.letsPlay', text: 'בואו נשחק!', outputPath: path.join(OUTPUT_BASE, 'dubi/lets-play.mp3') },
    { key: 'dubi.chooseTopic', text: 'מה נלמד היום?', outputPath: path.join(OUTPUT_BASE, 'dubi/choose-topic.mp3') },
  ];
}

async function generateNumberAudio(): Promise<AudioEntry[]> {
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
  console.log('🎙️  Generating Hebrew audio files...\n');

  const entries = [
    ...await generateFeedbackAudio(),
    ...await generateDubiAudio(),
    ...await generateNumberAudio(),
  ];

  console.log(`📝 ${entries.length} audio files to process\n`);

  for (const entry of entries) {
    await generateAudio(entry);
  }

  const manifest: Record<string, string> = {};
  for (const entry of entries) {
    manifest[entry.key] = entry.outputPath.replace(path.resolve(__dirname, '../packages/web/public'), '');
  }

  const manifestPath = path.join(OUTPUT_BASE, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📋 Manifest written to ${manifestPath}`);
  console.log('✅ Done!');
}

main().catch(console.error);
```

- [ ] **Step 3: Verify script runs**

```bash
yarn generate-audio
```

Expected: Audio files generated in `packages/web/public/audio/he/` with a `manifest.json`.

- [ ] **Step 4: Commit**

```bash
git add scripts/ packages/web/public/audio/
git commit -m "feat: add edge TTS hebrew audio generation script with feedback, dubi, and number audio"
```

---

### Task 8: Create AGENTS.md and CLAUDE.md

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `.cursor/rules/dubiland.mdc`

- [ ] **Step 1: Create AGENTS.md**

```markdown
# AGENTS.md

Guidance for human and AI contributors working on דובילנד (Dubiland).

## 1. Purpose

Dubiland is a Hebrew learning platform for kids ages 3-7. A teddy bear mascot (דובי) guides children through math, letters, and reading via games, videos, and songs. Parent-guided, web-based, fully Hebrew-native.

## 2. Read This First

1. `docs/specs/2026-04-09-dubiland-design.md` — full design spec
2. `docs/architecture/` — technical decisions (Architect maintains)
3. `docs/games/` — game design documents (PM creates)
4. `docs/knowledge/` — shared learnings across agents

## 3. Repo Map

- `packages/web/` — React + TypeScript + Vite app
- `packages/shared/` — shared types and constants
- `packages/remotion/` — video generation (build-time)
- `supabase/` — migrations and config
- `scripts/` — build-time tools (TTS generation, seeding)
- `docs/` — specs, plans, game designs, architecture, knowledge

## 4. Core Rules

1. **All text in i18n** — never hardcode Hebrew strings. Use `t('key')` always. Locale files in `packages/web/src/i18n/locales/he/`.
2. **Audio for everything** — every user-facing text must have a corresponding audio file. Kids don't read.
3. **RTL Hebrew** — all layouts are right-to-left. Test in RTL.
4. **Game engine pattern** — new games implement `GameProps` interface. One component + one DB row = one game.
5. **Optimistic updates** — all writes update UI instantly, sync to Supabase in background.
6. **Mobile-friendly touch** — minimum 44px tap targets. Test on tablet viewport.
7. **Theme-aware** — components read theme from context. No hardcoded bear references in game logic.

## 5. Agent Roles & Heartbeat Schedule

| Agent | Interval | Responsibility |
|---|---|---|
| PM | 20min | Product roadmap, feature specs, game ideas. Writes to `docs/games/`. |
| Architect | 30min | System design, data models, schema changes. Writes to `docs/architecture/`. |
| FED Engineer | 20min | Builds UI, games, components. Implements specs. |
| UX Designer | 45min | Design system, child-friendly layouts, design tokens. |
| Gaming Expert | 45min | Game mechanics, difficulty, engagement for ages 3-7. |
| Content Writer | 30min | Hebrew text, audio scripts. Runs `yarn generate-audio`. |
| Media Expert | 60min | Remotion video compositions. |
| QA Engineer | 20min | Code review, testing, accessibility, RTL validation. |
| Performance Expert | 60min | Bundle size, animations, Lighthouse. |

## 6. Self-Improvement

After each task, write learnings to:
- Your personal memory: `docs/agents/{your-name}/learnings.md`
- Shared knowledge (if useful to others): `docs/knowledge/`

At heartbeat start, read your memory + `docs/knowledge/` for context.

## 7. Adding a New Game

1. PM writes spec → `docs/games/{game-name}.md`
2. Gaming Expert reviews mechanics
3. FED implements `packages/web/src/games/{topic}/{GameName}.tsx`
4. Content Writer adds i18n keys + generates audio
5. Add game row to DB (migration or seed)
6. QA reviews
7. Game appears in app

## 8. Tech Stack

React 19, TypeScript, Vite, Yarn workspaces, Supabase, i18next, Edge TTS, Remotion, Paperclip

## 9. Verification

Before claiming done:

```bash
yarn typecheck
yarn dev  # verify it runs
```
```

- [ ] **Step 2: Create CLAUDE.md**

```markdown
# CLAUDE.md

See `AGENTS.md` for all project guidance, coding conventions, and agent instructions.
```

- [ ] **Step 3: Create .cursor/rules/dubiland.mdc**

```markdown
---
description: Dubiland project conventions
globs: "**/*.{ts,tsx}"
---

# Dubiland Cursor Rules

- All user-facing text must use i18n: `t('key')` from react-i18next. Never hardcode Hebrew.
- All layouts are RTL Hebrew. Use `dir="rtl"` and test in RTL.
- Game components implement the `GameProps` interface from `games/engine/types.ts`.
- Audio files are pre-generated. Reference via manifest keys, not raw paths.
- Optimistic updates for all Supabase writes.
- Minimum 44px touch targets for child interactions.
- Components read the current theme from context — no hardcoded theme references in game logic.
- See `AGENTS.md` for full project conventions.
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md CLAUDE.md .cursor/
git commit -m "feat: add AGENTS.md, CLAUDE.md, and cursor rules for project conventions"
```

---

### Task 9: Set Up Remotion Package

**Files:**
- Create: `packages/remotion/tsconfig.json`
- Create: `packages/remotion/src/Root.tsx`

- [ ] **Step 1: Create packages/remotion/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../shared" }
  ]
}
```

- [ ] **Step 2: Create packages/remotion/src/Root.tsx**

```tsx
import { Composition } from 'remotion';

const Placeholder: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%', background: '#FFF8E7', fontFamily: 'Rubik',
    direction: 'rtl',
  }}>
    <h1 style={{ fontSize: 80, color: '#5D3A1A' }}>🧸 דובילנד</h1>
  </div>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Placeholder"
      component={Placeholder}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
```

- [ ] **Step 3: Commit**

```bash
git add packages/remotion/
git commit -m "feat: initialize remotion package with placeholder composition"
```

---

### Task 10: Create Docs Structure and Knowledge Base

**Files:**
- Create: `docs/architecture/.gitkeep`
- Create: `docs/games/.gitkeep`
- Create: `docs/knowledge/patterns.md`
- Create: `docs/knowledge/conventions.md`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p docs/architecture docs/games docs/knowledge docs/agents
```

- [ ] **Step 2: Create docs/knowledge/patterns.md**

```markdown
# Shared Patterns

Reusable patterns discovered by agents during development. All agents read this at heartbeat start.

---

(Agents append entries below as they learn)
```

- [ ] **Step 3: Create docs/knowledge/conventions.md**

```markdown
# Project Conventions

Conventions that emerged during development. Updated by agents as the project evolves.

## i18n
- All Hebrew text uses i18n keys via `t('namespace.key')`
- Locale files: `packages/web/src/i18n/locales/he/*.json`
- Audio manifest mirrors i18n keys

## File Naming
- Game components: PascalCase (e.g. `CountingAnimals.tsx`)
- i18n keys: camelCase (e.g. `games.countingAnimals.name`)
- Audio files: kebab-case (e.g. `counting-animals/instruction.mp3`)

---

(Agents append entries below as conventions emerge)
```

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "feat: create docs structure with knowledge base for agent self-improvement"
```

---

### Task 11: Set Up Paperclip — Company, Mission, Goals, Agents, Kickoff

**Files:** None (Paperclip configuration is external to the repo)

- [ ] **Step 1: Install and start Paperclip**

```bash
npx paperclipai onboard --yes
```

Follow the interactive setup. This creates the Paperclip server with embedded Postgres.

- [ ] **Step 2: Start Paperclip server**

```bash
pnpm paperclipai run
```

Verify: `curl http://localhost:3100/api/health` returns `{"status":"ok"}`

- [ ] **Step 3: Create Dubiland company with mission**

Open `http://localhost:3100` in the browser. Create a new company:

- **Name:** דובילנד (Dubiland)
- **Mission:** "Build the best Hebrew learning platform for kids ages 3-7. Make learning fun through games, videos, and songs — all fully in Hebrew. The bear mascot דובי guides kids through math, letters, and reading. Parent-guided, web-based, with progress tracking. See docs/specs/2026-04-09-dubiland-design.md for the full design spec."

Then set CLI context:

```bash
pnpm paperclipai context set --api-base http://localhost:3100 --company-id <company-id>
```

- [ ] **Step 4: Create project goals**

In the Paperclip UI, create a project under the company:

- **Project name:** Dubiland Platform
- **Goal:** "Ship a working Hebrew learning platform with math games, letter games, reading exercises, videos, and songs for kids ages 3-7. Phase by phase: shell → game engine → math module → letters module → media."
- **Workspace path:** Set to the repo root (`/Users/israelz/Documents/dev/AI/Learning`)

- [ ] **Step 5: Create agents in Paperclip**

Create each agent via the UI. For each agent, set:
- The **role/title** and **system prompt** describing their responsibility (from AGENTS.md Section 5)
- The **adapter** (claude_code for all)
- The **heartbeat interval**
- The **reporting line** (who they report to)
- The **monthly budget** (start with reasonable limits)

| Name | Title | Reports to | Adapter | Heartbeat | System Prompt Summary |
|---|---|---|---|---|---|
| PM | CEO | Board (you) | claude_code | 20min | Product owner. Reads design spec. Creates game specs, feature requirements, and tasks. Prioritizes work. Continuously invents new games and learning methods. Writes to docs/games/. |
| Architect | CTO | PM | claude_code | 30min | System design owner. Owns data models, game engine API, Supabase schema. Reviews technical decisions. Writes to docs/architecture/. |
| FED Engineer | Engineer | Architect | claude_code | 20min | Primary builder. Implements UI, games, components, pages. Follows GameProps interface for games. Uses i18n for all text. |
| UX Designer | Designer | PM | claude_code | 45min | Design system owner. Creates storybook theme, child-friendly layouts, RTL Hebrew design, design tokens, accessibility for ages 3-7. |
| Gaming Expert | Specialist | PM | claude_code | 45min | Game design reviewer. Reviews game mechanics, difficulty balancing, engagement patterns. Ensures games are fun for ages 3-7. |
| Content Writer | Writer | PM | claude_code | 30min | All Hebrew text content. Writes i18n JSON entries, game instructions, story scripts, song lyrics. Runs yarn generate-audio for TTS. |
| Media Expert | Specialist | PM | claude_code | 60min | Remotion video compositions. Creates animated explainers, Hebrew songs, interactive video segments. |
| QA Engineer | QA | Architect | claude_code | 20min | Code review, testing, accessibility, Hebrew RTL validation, game play-testing. Files bugs as tickets. |
| Performance Expert | Specialist | Architect | claude_code | 60min | Bundle size, load times, animation perf, Lighthouse scores. Audits and files issues. |

- [ ] **Step 6: Set up agent local CLI for each agent**

```bash
pnpm paperclipai agent local-cli pm --company-id <company-id>
pnpm paperclipai agent local-cli architect --company-id <company-id>
pnpm paperclipai agent local-cli fed-engineer --company-id <company-id>
pnpm paperclipai agent local-cli ux-designer --company-id <company-id>
pnpm paperclipai agent local-cli gaming-expert --company-id <company-id>
pnpm paperclipai agent local-cli content-writer --company-id <company-id>
pnpm paperclipai agent local-cli media-expert --company-id <company-id>
pnpm paperclipai agent local-cli qa-engineer --company-id <company-id>
pnpm paperclipai agent local-cli performance-expert --company-id <company-id>
```

This installs Paperclip skills globally (`~/.claude/skills/`) and prints env vars for each agent.

- [ ] **Step 7: Copy Paperclip skills into the project**

```bash
cp -r ~/.claude/skills/paperclip skills/paperclip
cp -r ~/.claude/skills/para-memory-files skills/para-memory-files
git add skills/
git commit -m "feat: add paperclip and para-memory-files skills to project"
```

This makes the skills version-controlled and available to anyone who clones the repo.

- [ ] **Step 8: Create Phase 2 kickoff tasks**

These tasks cascade work to the entire team. The PM picks them up and breaks them down further.

```bash
# Master Phase 2 task for PM
pnpm paperclipai issue create \
  --title "[Phase 2] Build Platform Shell" \
  --description "You are the PM for דובילנד. Read the full design spec at docs/specs/2026-04-09-dubiland-design.md (especially Sections 4, 12, 13). Your job:

1. Break Phase 2 into sub-tasks and assign them to the right agents:
   - UX Designer: Create the storybook design system (warm illustrated theme, colors, typography, base components)
   - FED Engineer: Build login screen, child profile picker, home screen with topic cards, parent dashboard
   - Content Writer: Write all Hebrew UI strings for i18n JSON files + generate audio
   - QA Engineer: Review all screens for accessibility, RTL, and child-friendliness

2. Write 3 initial math game specs in docs/games/ (for Phase 3 prep). Each spec should define: game name (Hebrew), mechanic, target age group, difficulty levels, Hebrew content needed, audio requirements.

3. Review agent output as it comes in. Ensure everything follows AGENTS.md conventions.

The company mission and design spec are your north star. You drive the product." \
  --priority high

# Design system task for UX Designer
pnpm paperclipai issue create \
  --title "Create Dubiland storybook design system" \
  --description "Read docs/specs/2026-04-09-dubiland-design.md Section 4 (Visual Style & Themes). Create the base design system:
- Color palette (warm storybook: parchment backgrounds, brown text, colorful accents)
- Typography (Rubik + Heebo fonts, RTL Hebrew)
- Base components: Button, Card, TopicCard, GameCard, Avatar, StarRating
- Theme context provider with 'bear' as default theme
- Design tokens as CSS variables
- All components must have minimum 44px touch targets
Put the design system in packages/web/src/components/." \
  --priority high

# Initial content task for Content Writer
pnpm paperclipai issue create \
  --title "Write initial Hebrew UI strings and generate audio" \
  --description "Read the existing i18n files at packages/web/src/i18n/locales/he/. Expand them with all UI strings needed for:
- Child profile picker screen
- Home screen (דובי greetings, topic descriptions)
- Game list screen
- Parent dashboard
- Common feedback phrases

Then run 'yarn generate-audio' to create Hebrew audio files for all new strings. Update the audio manifest." \
  --priority medium
```

- [ ] **Step 9: Verify the system is alive**

```bash
# Check dashboard
pnpm paperclipai dashboard get

# Trigger PM's first heartbeat
pnpm paperclipai heartbeat run --agent-id <pm-agent-id>

# Watch activity
pnpm paperclipai activity list
```

Expected: PM wakes up, reads AGENTS.md, reads the design spec, picks up the Phase 2 task, and starts breaking it down into sub-tasks for other agents. The cascade begins.

---

## Summary

After completing all 11 tasks:

- ✅ Yarn monorepo with `web`, `shared`, `remotion` packages
- ✅ Vite + React + TypeScript with RTL Hebrew
- ✅ i18n with typed Hebrew locale files
- ✅ Supabase project with full schema, RLS, and seed data
- ✅ Auth (Google + Email) with protected routes
- ✅ Shared TypeScript types
- ✅ Edge TTS audio generation script with initial audio files
- ✅ AGENTS.md, CLAUDE.md, Cursor rules
- ✅ Remotion package initialized
- ✅ Docs structure with agent knowledge base
- ✅ Paperclip running with company mission, project goals, 9 agents onboarded, and Phase 2 kickoff tasks created

**The system is now self-driving.** The PM reads the mission + design spec, picks up the Phase 2 tasks, breaks them into sub-tasks, and assigns them to the team. You are the board — approve, override, or add ideas via the Paperclip dashboard.
