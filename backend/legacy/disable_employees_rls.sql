-- Solução temporária: Desabilitar RLS para testar
-- Execute este script para permitir cadastro de funcionários

-- OPÇÃO 1: Desabilitar RLS completamente (use para testar)
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Se quiser reabilitar depois com políticas mais simples, execute:
/*
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver funcionários da sua organização" ON employees;
DROP POLICY IF EXISTS "Usuários podem criar funcionários na sua organização" ON employees;
DROP POLICY IF EXISTS "Usuários podem atualizar funcionários da sua organização" ON employees;
DROP POLICY IF EXISTS "Usuários podem deletar funcionários da sua organização" ON employees;

-- Política permissiva: qualquer usuário autenticado pode fazer tudo
CREATE POLICY "Permitir tudo para usuários autenticados"
  ON employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
*/
