-- ============================================================
--  TAREFITO — SQL v3 — Rode no Supabase SQL Editor
--  Corrige o erro 400 ao criar família
-- ============================================================

-- Verifica e adiciona colunas que faltam na tabela families
ALTER TABLE families ADD COLUMN IF NOT EXISTS responsible_id UUID;
ALTER TABLE families ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Garante que members tem as colunas certas
ALTER TABLE members ADD COLUMN IF NOT EXISTS family_id BIGINT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'child';
ALTER TABLE members ADD COLUMN IF NOT EXISTS stars INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS weekly_goal INT DEFAULT 50;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_stars_earned INT DEFAULT 0;

-- tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS family_id BIGINT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to BIGINT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stars_reward INT DEFAULT 10;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS evidence_note TEXT;

-- rewards
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS family_id BIGINT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS cost INT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock INT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Digital';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Comum';

-- redemptions
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS member_id BIGINT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS reward_id BIGINT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS star_cost INT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- feedbacks
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS task_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS from_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS to_id BIGINT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS message TEXT;

-- RLS permissivo para MVP
ALTER TABLE families    ENABLE ROW LEVEL SECURITY;
ALTER TABLE members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS families_all    ON families;
DROP POLICY IF EXISTS members_all     ON members;
DROP POLICY IF EXISTS tasks_all       ON tasks;
DROP POLICY IF EXISTS rewards_all     ON rewards;
DROP POLICY IF EXISTS redemptions_all ON redemptions;
DROP POLICY IF EXISTS feedbacks_all   ON feedbacks;

CREATE POLICY families_all    ON families    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY members_all     ON members     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY tasks_all       ON tasks       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY rewards_all     ON rewards     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY redemptions_all ON redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY feedbacks_all   ON feedbacks   FOR ALL USING (true) WITH CHECK (true);

-- Remove trigger problemático se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
