# Deploy no Easypanel - Configuração Completa

## 📋 Passo a Passo

### 1. Variáveis de Ambiente

⚠️ **IMPORTANTE:** No Easypanel, adicione as seguintes variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

**Como adicionar no Easypanel:**
1. Acesse seu projeto no Easypanel
2. Vá em **Settings** → **Environment Variables** (ou **Environment**)
3. Adicione cada variável:
   - **Nome:** `VITE_SUPABASE_URL`
   - **Valor:** `https://ideal-supabase.yzqq8i.easypanel.host`
4. Adicione a segunda variável:
   - **Nome:** `VITE_SUPABASE_ANON_KEY`
   - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE`
5. **Salve** as alterações
6. **Redeploy** o projeto

### 2. Configuração do Build

O Dockerfile já está configurado. O Easypanel vai:

1. Fazer build do React com Vite
2. Servir conteúdo estático na porta 80
3. As variáveis de ambiente são injetadas no build time

### 3. Configuração do Supabase

No seu projeto Supabase, execute os scripts SQL na ordem:

```bash
1. backend/schema.sql          # Estrutura das tabelas
2. backend/rls_policies.sql    # Políticas de segurança
3. backend/functions_triggers.sql  # Automações
4. backend/seed_data.sql       # (Opcional) Dados de teste
```

### 4. Criar Usuário Admin

Após executar os scripts, crie um usuário admin:

#### Método 1: Via Supabase Dashboard

1. Vá em `Authentication` → `Users`
2. Clique em `Add user`
3. Preencha:
   - Email: `admin@tiagoforman.com`
   - Password: `senha-segura`
   - Auto Confirm User: ✅

4. Copie o `User UID` gerado

5. Vá em `SQL Editor` e execute:

```sql
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
  'cole-aqui-o-user-uid',
  (SELECT id FROM organizations WHERE slug = 'tiago-forman' LIMIT 1),
  'admin@tiagoforman.com',
  'Admin',
  'Sistema',
  'super_admin',
  '+5534888568529',
  true
);
```

#### Método 2: Via SQL direto

```sql
-- Primeiro cria na tabela auth.users (isso normalmente é feito via API)
-- Depois cria na tabela users com o ID correto

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
  'id-do-usuario-auth',  -- ID do usuário criado no Supabase Auth
  (SELECT id FROM organizations WHERE slug = 'tiago-forman' LIMIT 1),
  'admin@tiagoforman.com',
  'Admin',
  'Sistema',
  'super_admin',
  '+5534888568529',
  true
);
```

### 5. Testar Deploy

1. **Landing Page:** `https://seu-dominio.easypanel.host/`
2. **Login Admin:** `https://seu-dominio.easypanel.host/admin/login`
3. **Dashboard:** `https://seu-dominio.easypanel.host/admin/dashboard`

### 6. Verificar Funcionamento

- [ ] Landing page carrega corretamente
- [ ] Links de Instagram e WhatsApp funcionam
- [ ] Login aceita credenciais criadas
- [ ] Dashboard aparece após login
- [ ] Menu de navegação funciona
- [ ] Logout funciona

## 🔧 Troubleshooting

### Erro: "Failed to fetch"

Verifique se:
- As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas
- O projeto Supabase está ativo
- As políticas RLS foram executadas

### Erro: "Email ou senha inválidos"

Verifique se:
- O usuário foi criado no Supabase Auth
- O registro correspondente existe na tabela `users`
- O `auth_user_id` está correto

### Página em branco

Verifique se:
- O build foi bem-sucedido no Easypanel
- As variáveis de ambiente foram definidas ANTES do build
- O console do navegador tem erros

### Acesso negado após login

Verifique se:
- O role do usuário é `super_admin`, `owner` ou `manager`
- A tabela `users` tem o registro correto
- As RLS policies estão ativas

## 📝 Notas Importantes

- **Rebuild necessário:** Sempre que alterar variáveis de ambiente, faça rebuild no Easypanel
- **Cache:** Limpe cache do navegador se mudanças não aparecerem
- **HTTPS:** O Easypanel serve automaticamente via HTTPS
- **Domínio customizado:** Pode configurar domínio próprio no Easypanel

## 🔐 Segurança

- ✅ Nunca commite o arquivo `.env` no Git
- ✅ Use senhas fortes para usuários admin
- ✅ ANON Key é pública, mas RLS protege os dados
- ✅ SERVICE_ROLE_KEY deve ser mantida em segredo absoluto
- ✅ Configure CORS no Supabase se necessário
