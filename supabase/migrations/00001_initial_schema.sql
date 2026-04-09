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
CREATE POLICY "games_public_read" ON games FOR SELECT USING (is_published = true);
CREATE POLICY "game_levels_public_read" ON game_levels FOR SELECT
  USING (EXISTS (SELECT 1 FROM games WHERE games.id = game_levels.game_id AND games.is_published = true));
CREATE POLICY "videos_public_read" ON videos FOR SELECT USING (is_published = true);
