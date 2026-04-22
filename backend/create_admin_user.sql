-- =====================================================
-- CRIAR USUÁRIO ADMINISTRADOR
-- Execute este script APÓS executar schema.sql e seed_data.sql
-- =====================================================

-- IMPORTANTE: Primeiro você precisa criar o usuário no Supabase Auth
-- 1. Vá em Authentication → Users → Add user
-- 2. Email: admin@tiagoforman.com
-- 3. Password: (escolha uma senha forte)
-- 4. Marque "Auto Confirm User"
-- 5. COPIE O USER UID que aparecer
-- 6. COLE o UUID na linha abaixo no lugar de 'COLE-AQUI-O-USER-UID'

-- Criar usuário admin usando a organização existente
INSERT INTO users (
  auth_user_id,
  organization_id,
  email,
  first_name,
  last_name,
  role,
  phone,
  is_active
) VALUES (
  'a7886335-d758-4f12-a27f-b7ae0965fef4',
  '11111111-1111-1111-1111-111111111111',
  'max@netminas.com',
  'Max',
  'Admin',
  'super_admin',
  '+5534888568529',
  true
)
ON CONFLICT (auth_user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- Confirmar criação
SELECT 
  '✅ Usuário criado com sucesso!' as status,
  u.email,
  u.first_name || ' ' || u.last_name as nome,
  u.role,
  o.name as organizacao
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'max@netminas.com';
