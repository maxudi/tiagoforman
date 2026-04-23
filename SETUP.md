# Configuração do Banco de Dados

## Resumo

| Arquivo | O que é | Quando executar |
|---|---|---|
| `database.sql` | Schema completo — tabelas, triggers, RLS, storage | **Sempre** (banco novo) |
| `seed_data.sql` | Dados de exemplo para testes | Opcional |

---

## Subindo um banco do zero

### Passo 1 — Abrir o SQL Editor

Acesse seu Supabase → **SQL Editor** → **New query**

### Passo 2 — Executar o schema

Abra o arquivo `database.sql`, selecione tudo (**Ctrl+A**) e cole no editor. Clique em **Run**.

✅ Em ~5 segundos todas as tabelas, funções, triggers, RLS e storage estarão prontos.

### Passo 3 — Criar a organização

No SQL Editor, execute:

```sql
INSERT INTO organizations (name, slug)
VALUES ('Tiago Forman', 'tiago-forman')
RETURNING id;
```

Copie o `id` retornado — você vai precisar no próximo passo.

### Passo 4 — Criar o usuário admin no Supabase Auth

1. Vá em **Authentication → Users → Add user**
2. Preencha email e senha
3. Marque **Auto Confirm User**
4. Copie o **User UID** exibido

### Passo 5 — Vincular o usuário ao banco

```sql
INSERT INTO users (auth_user_id, organization_id, first_name, last_name, email, role, is_active)
VALUES (
  '<USER_UID_DO_AUTH>',             -- cole o UUID do passo 4
  '<ID_DA_ORGANIZATION>',           -- cole o ID do passo 3
  'Tiago', 'Forman',
  'tiago@exemplo.com',
  'super_admin',
  true
);
```

### Passo 6 — (Opcional) Dados de exemplo

Se quiser popular o banco com dados de teste, execute `seed_data.sql` no SQL Editor.

---

## Variáveis de ambiente (.env)

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Encontre esses valores em **Project Settings → API**.

---

## O que o database.sql cria

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `organizations` | Tenants do sistema (multi-empresa) |
| `users` | Contas de login (admins, gerentes, recepcionistas) |
| `customers` | Clientes dos negócios |
| `services` | Serviços oferecidos |
| `products` | Produtos com controle de estoque |
| `barbers` | Profissionais que realizam os serviços |
| `barber_services` | Quais serviços cada barbeiro pode realizar |
| `schedules` | Horários de funcionamento regulares |
| `barber_schedules` | Horários disponíveis por barbeiro |
| `schedule_exceptions` | Folgas, feriados, horários especiais |
| `appointments` | Agendamentos realizados |
| `appointment_products` | Produtos usados em agendamentos |
| `payments` | Pagamentos |
| `notifications` | Notificações enviadas |
| `audit_logs` | Histórico de alterações |
| `reviews` | Avaliações de clientes |
| `employees` | Funcionários administrativos (sem login obrigatório) |
| `whatsapp_instances` | Instâncias Evolution API por organização |

### Automações (triggers)

- `updated_at` atualizado automaticamente em todas as tabelas
- Horário de término do agendamento calculado a partir da duração do serviço
- Estatísticas do cliente (total de agendamentos, gasto total) atualizadas após cada agendamento
- Estoque de produtos decrementado ao vincular produto a um agendamento
- Notificação de lembrete criada automaticamente ao confirmar agendamento
- Audit log gerado em INSERT/UPDATE/DELETE de agendamentos, pagamentos e clientes

### Segurança (RLS)

Todas as tabelas exigem autenticação via Supabase Auth. Usuários não autenticados não têm acesso a nenhum dado.

---

## Estrutura do `settings` JSONB (organizations)

A coluna `organizations.settings` armazena configurações do sistema em JSON. Os campos esperados pelo frontend são:

```json
{
  "primary_color":   "#9333ea",
  "secondary_color": "#ec4899",
  "accent_color":    "#8b5cf6",
  "business_type":   "barbearia",
  "menu_icons": {
    "dashboard":     "📊",
    "agendamentos":  "📅",
    "atendentes":    "💈"
  },
  "ai_settings": {
    "openai":    { "apiKey": "", "model": "gpt-4",    "baseUrl": "...", "active": false },
    "anthropic": { "apiKey": "", "model": "claude-3-5-sonnet-20241022", "baseUrl": "...", "active": false },
    "google":    { "apiKey": "", "model": "gemini-pro", "baseUrl": "...", "active": false },
    "groq":      { "apiKey": "", "model": "llama-3.1-70b-versatile", "baseUrl": "...", "active": false },
    "custom":    { "apiKey": "", "model": "", "baseUrl": "", "active": false }
  },
  "bank_settings": {
    "clientId":           "",
    "clientSecret":       "",
    "numeroConta":        "",
    "active":             false,
    "lastSync":           null
  }
}
```

---

## Arquivos descontinuados

Os arquivos abaixo existiam apenas para corrigir o schema incrementalmente. Com o `database.sql` tudo já está incorporado e eles **não precisam mais ser executados**:

- `backend/schema.sql`
- `backend/rls_policies.sql`
- `backend/functions_triggers.sql`
- `backend/barbers_table.sql`
- `backend/employees_table.sql`
- `backend/fix_payments_customer_id.sql`
- `backend/fix_employees_rls.sql`
- `backend/disable_employees_rls.sql`
- `backend/storage_setup.sql`
- `backend/create_admin_user.sql`
