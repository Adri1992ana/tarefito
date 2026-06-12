-- ============================================================
--  TAREFITO — Trial de 30 dias
--  Execute no Supabase SQL Editor
-- ============================================================

-- 1) Adiciona coluna trial_expires_at na tabela families
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- 2) Preenche trial para famílias já existentes (conta 30 dias a partir de hoje)
--    Útil para usuários de teste que já estão no banco
UPDATE families
  SET trial_expires_at = NOW() + INTERVAL '30 days'
  WHERE trial_expires_at IS NULL;

-- 3) Garante que novas famílias sempre terão o trial preenchido
--    (o JS também preenche, mas isso é uma camada extra de segurança)
ALTER TABLE families
  ALTER COLUMN trial_expires_at SET DEFAULT (NOW() + INTERVAL '30 days');

-- Verifica o resultado
SELECT id, name, created_at, trial_expires_at,
       CASE
         WHEN trial_expires_at > NOW() THEN 'ATIVO ✅'
         ELSE 'EXPIRADO ❌'
       END AS trial_status
FROM families
ORDER BY created_at DESC;
