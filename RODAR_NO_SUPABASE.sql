-- ============================================================
--  TAREFITO — SQL para rodar no Supabase SQL Editor
--  Execute ANTES de testar o cadastro
-- ============================================================

-- 1) Habilita confirmação de email desativada (necessário para signup funcionar sem email)
--    Vai em: Authentication → Settings → Email Confirmations → DESATIVE

-- 2) Garante que as colunas necessárias existem nas tabelas

-- Tabela families
ALTER TABLE families ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES auth.users(id);
ALTER TABLE families ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela members
ALTER TABLE members ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'child';
ALTER TABLE members ADD COLUMN IF NOT EXISTS stars INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS weekly_goal INT DEFAULT 50;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_stars_earned INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES members(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stars_reward INT DEFAULT 10;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_type TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS evidence_note TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela rewards
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS cost INT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock INT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Digital';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Comum';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela redemptions
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id);
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS reward_id UUID REFERENCES rewards(id);
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS star_cost INT;
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela feedbacks
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS from_id UUID;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS to_id UUID REFERENCES members(id);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Row Level Security — permite acesso via anon key
ALTER TABLE families    ENABLE ROW LEVEL SECURITY;
ALTER TABLE members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks   ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para MVP (ajustar em produção)
DO $$ BEGIN

  -- families
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='families_all' AND tablename='families') THEN
    CREATE POLICY families_all ON families FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='members_all' AND tablename='members') THEN
    CREATE POLICY members_all ON members FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- tasks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='tasks_all' AND tablename='tasks') THEN
    CREATE POLICY tasks_all ON tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- rewards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='rewards_all' AND tablename='rewards') THEN
    CREATE POLICY rewards_all ON rewards FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- redemptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='redemptions_all' AND tablename='redemptions') THEN
    CREATE POLICY redemptions_all ON redemptions FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- feedbacks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='feedbacks_all' AND tablename='feedbacks') THEN
    CREATE POLICY feedbacks_all ON feedbacks FOR ALL USING (true) WITH CHECK (true);
  END IF;

END $$;

-- 4) Remove trigger problemático se existir (causa o erro 500)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
