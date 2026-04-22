# 🔐 Como Criar Usuário Administrador

## Passo a Passo Completo

### 1️⃣ Acesse o Supabase Dashboard

Vá para: https://supabase.com/dashboard

### 2️⃣ Selecione seu projeto

Clique no projeto que você criou para o Tiago Forman

### 3️⃣ Execute os scripts SQL (se ainda não executou)

No **SQL Editor**, execute na ordem:

1. ✅ `schema.sql` - Criar tabelas
2. ✅ `rls_policies.sql` - Políticas de segurança
3. ✅ `functions_triggers.sql` - Automações
4. ✅ `seed_data.sql` - Dados iniciais (opcional, mas recomendado)

### 4️⃣ Criar usuário no Authentication

1. No menu lateral, vá em **Authentication** → **Users**
2. Clique no botão **Add user** (canto superior direito)
3. Selecione **Create new user**
4. Preencha:
   - **Email**: `admin@tiagoforman.com`
   - **Password**: escolha uma senha forte (ex: `Admin@2026!Strong`)
   - ✅ Marque **Auto Confirm User** (importante!)
5. Clique em **Create user**
6. **Copie o User UID** (UUID que aparece na coluna UID) - você vai precisar!

### 5️⃣ Cadastrar na tabela users

1. Vá em **SQL Editor** → **New query**
2. Abra o arquivo `backend/create_admin_user.sql`
3. **IMPORTANTE**: Na linha que diz `'COLE-AQUI-O-USER-UID'`, substitua pelo UUID que você copiou
4. Clique em **Run** ou pressione `Ctrl+Enter`
5. Você deve ver uma mensagem de sucesso com os dados do usuário

### 6️⃣ Acessar o sistema

1. Inicie o servidor local:
   ```bash
   npm run dev
   ```

2. Acesse: `http://localhost:5174/admin/login`

3. Faça login com:
   - **Email**: `admin@tiagoforman.com`
   - **Password**: a senha que você definiu no passo 4

4. Você será redirecionado para o Dashboard! 🎉

## 🔍 Como Verificar se Funcionou

Execute este SQL no **SQL Editor**:

```sql
-- Ver todos os usuários
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.is_active,
  o.name as organization
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id;

-- Ver usuários do Auth que ainda não foram cadastrados na tabela users
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at,
  CASE WHEN u.id IS NULL THEN '❌ Não cadastrado na tabela users' ELSE '✅ Cadastrado' END as status
FROM auth.users au
LEFT JOIN users u ON u.auth_user_id = au.id;
```

## ⚠️ Problemas Comuns

### "Email ou senha inválidos"
- Verifique se você criou o usuário no **Authentication** primeiro
- Confirme que marcou **Auto Confirm User**
- Tente redefinir a senha no Authentication

### "Acesso Negado"
- Verifique se o `role` é `super_admin`, `owner` ou `manager`
- Execute:
  ```sql
  UPDATE users 
  SET role = 'super_admin' 
  WHERE email = 'admin@tiagoforman.com';
  ```

### "Failed to fetch" / Erro de conexão
- Verifique se o arquivo `.env` está configurado corretamente:
  ```
  VITE_SUPABASE_URL=https://seu-projeto.supabase.co
  VITE_SUPABASE_ANON_KEY=sua-chave-anon
  ```
- Reinicie o servidor: `Ctrl+C` e depois `npm run dev`

### auth_user_id não corresponde
- O UUID na tabela `users` TEM que ser EXATAMENTE o mesmo do Authentication
- Copie novamente o UID do usuário e atualize:
  ```sql
  UPDATE users 
  SET auth_user_id = 'cole-o-uid-correto-aqui' 
  WHERE email = 'admin@tiagoforman.com';
  ```

## 🎯 Múltiplos Usuários Admin

Para criar mais administradores, repita os passos 4-5 com emails diferentes:

```sql
-- Exemplo: criar segundo admin
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
  'uuid-do-segundo-usuario',
  (SELECT id FROM organizations WHERE slug = 'tiago-forman' LIMIT 1),
  'admin2@tiagoforman.com',
  'Segundo',
  'Admin',
  'super_admin',
  '+5534999999999',
  true
);
```

## 📝 Roles Disponíveis

- `super_admin` - Acesso total ao sistema
- `owner` - Dono do estabelecimento (acesso total)
- `manager` - Gerente (acesso ao painel admin)
- `staff` - Funcionário (sem acesso ao admin)
- `customer` - Cliente (app do cliente no futuro)

Apenas `super_admin`, `owner` e `manager` podem acessar `/admin`

## 🔐 Segurança

- ✅ Use senhas fortes (mínimo 8 caracteres, letras, números, símbolos)
- ✅ Não compartilhe credenciais
- ✅ Mude senhas periodicamente
- ✅ Para produção, use autenticação de 2 fatores
- ✅ Monitore a tabela `audit_logs` para ver atividades

## 📞 Precisa de Ajuda?

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Veja os logs do Supabase
3. Teste a conexão com o Supabase
4. Revise as políticas RLS
