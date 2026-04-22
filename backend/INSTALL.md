# Guia de Instalação e Configuração - Supabase

## 📋 Pré-requisitos

- Supabase auto-hospedado configurado
- PostgreSQL 13+
- Acesso ao painel do Supabase
- Cliente psql ou ferramenta de administração de banco de dados

## 🚀 Instalação do Schema

### Passo 1: Conectar ao Banco de Dados

```bash
# Via psql
psql -h seu-host -p 5432 -U postgres -d postgres

# Ou use o SQL Editor do Supabase Dashboard
```

### Passo 2: Executar os Scripts na Ordem

Execute os scripts SQL na seguinte ordem:

#### 1. Schema Principal
```bash
psql -h seu-host -U postgres -d postgres -f backend/schema.sql
```

Este script cria:
- ✅ Extensões necessárias
- ✅ ENUMs (tipos de dados)
- ✅ Todas as tabelas
- ✅ Índices
- ✅ Triggers básicos
- ✅ Views úteis

#### 2. Políticas de RLS (Row Level Security)
```bash
psql -h seu-host -U postgres -d postgres -f backend/rls_policies.sql
```

Este script configura:
- ✅ Habilitação de RLS em todas as tabelas
- ✅ Funções helper de autenticação
- ✅ Políticas de acesso multi-tenant
- ✅ Isolamento de dados por organização

#### 3. Functions e Triggers Avançados
```bash
psql -h seu-host -U postgres -d postgres -f backend/functions_triggers.sql
```

Este script adiciona:
- ✅ Audit logs automáticos
- ✅ Atualização de estatísticas
- ✅ Validações de disponibilidade
- ✅ Cálculos automáticos
- ✅ Funções de consulta
- ✅ Dashboard de métricas

#### 4. Dados de Exemplo (Opcional)
```bash
psql -h seu-host -U postgres -d postgres -f backend/seed_data.sql
```

Cria dados de exemplo:
- ✅ Organização "Tiago Forman"
- ✅ Usuários (Tiago, João, Maria)
- ✅ Serviços (Corte, Barba, etc)
- ✅ Produtos
- ✅ Horários de funcionamento
- ✅ Clientes
- ✅ Agendamentos
- ✅ Pagamentos
- ✅ Avaliações

## 🔐 Configuração de Autenticação

### Supabase Auth

No painel do Supabase, configure:

1. **Providers de Auth**:
   - Email/Password ✅
   - Magic Link (opcional)
   - OAuth (opcional)

2. **Email Templates**:
   - Customize os templates de confirmação
   - Configure recuperação de senha

3. **URL Redirect**:
   ```
   Site URL: https://seu-dominio.com
   Redirect URLs: https://seu-dominio.com/auth/callback
   ```

### Criar Primeiro Usuário (Super Admin)

```sql
-- 1. Criar usuário no Supabase Auth (via painel ou código)

-- 2. Inserir na tabela users
INSERT INTO users (
  organization_id,
  auth_user_id,
  first_name,
  last_name,
  email,
  role,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111'::UUID, -- ID da organização
  'auth-user-id-aqui'::UUID, -- ID do Supabase Auth
  'Admin',
  'Sistema',
  'admin@exemplo.com',
  'super_admin',
  true
);
```

## 📊 Verificação da Instalação

Execute estas queries para verificar se tudo está funcionando:

### 1. Verificar Tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. Verificar Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### 4. Testar Functions
```sql
-- Testar busca de horários disponíveis
SELECT * FROM get_available_time_slots(
  '11111111-1111-1111-1111-111111111111'::UUID, -- organization_id
  '22222222-2222-2222-2222-222222222222'::UUID, -- employee_id
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, -- service_id
  CURRENT_DATE + 1
);

-- Testar dashboard
SELECT get_dashboard_metrics(
  '11111111-1111-1111-1111-111111111111'::UUID
);
```

## 🔧 Configurações do Supabase

### 1. Storage (Para imagens)

Criar buckets:
```javascript
// No Supabase Dashboard > Storage
- avatars (público)
- logos (público)
- products (público)
- documents (privado)
```

### 2. Realtime (Para atualizações em tempo real)

```sql
-- Habilitar realtime em tabelas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 3. Edge Functions (Opcional)

Para integração com Evolution API e outras automações.

## 📱 API Gerada Automaticamente

O Supabase gera automaticamente:

### REST API
```
https://seu-projeto.supabase.co/rest/v1/
```

### GraphQL (Beta)
```
https://seu-projeto.supabase.co/graphql/v1
```

### Realtime
```
wss://seu-projeto.supabase.co/realtime/v1
```

## 🔑 Ambiente de Desenvolvimento

Crie um arquivo `.env`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-evolution

# Aplicação
APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🧪 Testes

### Teste de Conexão

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Testar conexão
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .limit(1)

console.log('Conexão:', error ? 'Erro' : 'Sucesso')
```

### Teste de RLS

```javascript
// Com usuário autenticado
const { data: appointments } = await supabase
  .from('appointments')
  .select('*')

// Deve retornar apenas agendamentos da organização do usuário
```

## 📚 Próximos Passos

1. ✅ Schema instalado
2. ⏳ Criar API routes no frontend
3. ⏳ Implementar integração Evolution API
4. ⏳ Criar interface administrativa
5. ⏳ Implementar sistema de notificações
6. ⏳ Adicionar relatórios e analytics

## 🆘 Troubleshooting

### Erro: "relation does not exist"
- Verifique se todos os scripts foram executados na ordem correta
- Confirme que está conectado ao banco correto

### Erro: "permission denied"
- Verifique as políticas RLS
- Confirme que o usuário está autenticado
- Verifique se o `organization_id` está correto

### Erro em Triggers
- Verifique os logs: `SELECT * FROM pg_stat_statements;`
- Teste as functions individualmente

## 📞 Suporte

Para dúvidas sobre o schema:
- Revise a documentação em `backend/README.md`
- Verifique os comentários nos arquivos SQL
- Consulte a documentação do Supabase: https://supabase.com/docs
