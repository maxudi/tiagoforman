-- Fix RLS policies for employees table
-- Execute este script para corrigir as políticas de segurança

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver funcionários da sua organização" ON employees;
DROP POLICY IF EXISTS "Usuários podem criar funcionários na sua organização" ON employees;
DROP POLICY IF EXISTS "Usuários podem atualizar funcionários da sua organização" ON employees;
DROP POLICY IF EXISTS "Usuários podem deletar funcionários da sua organização" ON employees;

-- Criar novas políticas corrigidas
CREATE POLICY "Usuários podem ver funcionários da sua organização"
  ON employees FOR SELECT
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Usuários podem criar funcionários na sua organização"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Usuários podem atualizar funcionários da sua organização"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Usuários podem deletar funcionários da sua organização"
  ON employees FOR DELETE
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Verificar se está funcionando
SELECT 'RLS policies atualizadas com sucesso!' as status;
