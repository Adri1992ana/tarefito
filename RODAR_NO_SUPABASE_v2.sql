-- ============================================================
--  TAREFITO — SQL CORRIGIDO
--  Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Colunas das tabelas (sem foreign keys problemáticas)

ALTER TABLE families ADD COLUMN IF NOT EXISTS responsible_id UUID;
ALTER TABLE families ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE members ADD COLUMN IF NOT EXISTS family_id BIGINT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'child';
ALTER TABLE members ADD COLUMN IF NOT EXISTS stars INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS weekly_goal INT DEFAULT 50;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_stars_earned INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS family_id BIGINT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to BIGINT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stars_reward INT DEFAULT 10;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS evidence_note TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS family_id BIGINT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS cost INT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock INT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Digital';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Comum';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS member_id BIGINT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS reward_id BIGINT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS star_cost INT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS task_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS from_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS to_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Row Level Security
ALTER TABLE families    ENABLE ROW LEVEL SECURITY;
ALTER TABLE members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks   ENABLE ROW LEVEL SECURITY;

-- 3) Políticas permissivas para MVP
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='families_all' AND tablename='families') THEN
    CREATE POLICY families_all ON families FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='members_all' AND tablename='members') THEN
    CREATE POLICY members_all ON members FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='tasks_all' AND tablename='tasks') THEN
    CREATE POLICY tasks_all ON tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='rewards_all' AND tablename='rewards') THEN
    CREATE POLICY rewards_all ON rewards FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='redemptions_all' AND tablename='redemptions') THEN
    CREATE POLICY redemptions_all ON redemptions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='feedbacks_all' AND tablename='feedbacks') THEN
    CREATE POLICY feedbacks_all ON feedbacks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4) Remove trigger problemático (causa o erro 500 no cadastro)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
