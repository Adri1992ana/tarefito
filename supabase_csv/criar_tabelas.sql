-- ============================================================
--  TAREFITO — Script completo de criação de tabelas
-- ============================================================

-- Remove tabelas existentes (ordem inversa de dependência)
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS rewards     CASCADE;
DROP TABLE IF EXISTS tasks       CASCADE;
DROP TABLE IF EXISTS members     CASCADE;
DROP TABLE IF EXISTS families    CASCADE;

-- ── Famílias (perfil do responsável) ────────────────────────
CREATE TABLE families (
    id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id       uuid,
    responsible_id uuid,
    name           text,
    code           text,
    created_at     timestamptz DEFAULT now()
);

-- ── Membros / Crianças ────────────────────────────────────────
CREATE TABLE members (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id   uuid,
    name        text        NOT NULL,
    pin         text,
    stars       integer     DEFAULT 0,
    weekly_goal integer     DEFAULT 50,
    created_at  timestamptz DEFAULT now()
);

-- ── Tarefas / Missões ────────────────────────────────────────
CREATE TABLE tasks (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id   uuid,
    child_id    uuid,
    name        text        NOT NULL,
    stars       integer     DEFAULT 15,
    recorrente  boolean     DEFAULT false,
    done        boolean     DEFAULT false,
    created_at  timestamptz DEFAULT now()
);

-- ── Prêmios ──────────────────────────────────────────────────
CREATE TABLE rewards (
    id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id  uuid,
    name       text        NOT NULL,
    cost       integer     NOT NULL,
    stock      integer,
    type       text        DEFAULT 'Digital',
    rarity     text        DEFAULT 'Comum',
    created_at timestamptz DEFAULT now()
);

-- ── Resgates ─────────────────────────────────────────────────
CREATE TABLE redemptions (
    id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id   uuid,
    reward_id  uuid,
    star_cost  integer,
    status     text        DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- ── Desativa RLS (MVP) ───────────────────────────────────────
ALTER TABLE families    DISABLE ROW LEVEL SECURITY;
ALTER TABLE members     DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards     DISABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;

-- ── Permissões ───────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;

GRANT ALL ON families    TO anon, authenticated, authenticator;
GRANT ALL ON members     TO anon, authenticated, authenticator;
GRANT ALL ON tasks       TO anon, authenticated, authenticator;
GRANT ALL ON rewards     TO anon, authenticated, authenticator;
GRANT ALL ON redemptions TO anon, authenticated, authenticator;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated, authenticator;

-- ── Reload do cache PostgREST ────────────────────────────────
SELECT pg_notify('pgrst', 'reload schema');
