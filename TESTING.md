# Test do Painel Administrativo

## ✅ Checklist de Funcionalidades

### Rotas Públicas
- [ ] `/` - Landing page carrega corretamente
- [ ] Links Instagram e WhatsApp funcionam
- [ ] Logo aparece corretamente

### Autenticação
- [ ] `/admin/login` - Página de login carrega
- [ ] Formulário de login valida campos
- [ ] Login com credenciais válidas funciona
- [ ] Login com credenciais inválidas mostra erro
- [ ] Redirecionamento após login funciona

### Proteção de Rotas
- [ ] Acesso a `/admin` sem login redireciona para login
- [ ] Acesso a `/admin/dashboard` sem login redireciona para login
- [ ] Usuários sem permissão veem mensagem de acesso negado
- [ ] Apenas roles `super_admin`, `owner`, `manager` têm acesso

### Layout Admin
- [ ] Header com logo e nome aparece
- [ ] Menu lateral com todas opções aparece
- [ ] Item ativo do menu é destacado
- [ ] Nome e role do usuário aparecem no header
- [ ] Botão de logout funciona

### Dashboard
- [ ] Cards de estatísticas aparecem
- [ ] Ações rápidas estão visíveis
- [ ] Atividade recente é exibida
- [ ] Navegação entre páginas funciona

### Outras Páginas
- [ ] `/admin/agendamentos` - Placeholder aparece
- [ ] `/admin/clientes` - Placeholder aparece
- [ ] `/admin/servicos` - Placeholder aparece
- [ ] `/admin/produtos` - Placeholder aparece
- [ ] `/admin/funcionarios` - Placeholder aparece
- [ ] `/admin/financeiro` - Placeholder aparece
- [ ] `/admin/configuracoes` - Placeholder aparece

## 🔧 Como Testar

1. **Configurar Supabase:**
   ```bash
   # Copiar .env.example para .env
   copy .env.example .env
   
   # Editar .env com credenciais reais do Supabase
   ```

2. **Executar Scripts SQL no Supabase:**
   - Executar `backend/schema.sql`
   - Executar `backend/rls_policies.sql`
   - Executar `backend/functions_triggers.sql`
   - Executar `backend/seed_data.sql`

3. **Criar Usuário Admin no Supabase:**
   ```sql
   -- No SQL Editor do Supabase
   -- Primeiro, criar usuário no Supabase Auth
   -- Depois, criar registro na tabela users
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
     'auth-user-id-from-supabase-auth',
     (SELECT id FROM organizations WHERE slug = 'tiago-forman' LIMIT 1),
     'admin@tiagoforman.com',
     'Admin',
     'Sistema',
     'super_admin',
     '+5534888568529',
     true
   );
   ```

4. **Iniciar Servidor:**
   ```bash
   npm run dev
   ```

5. **Testar Fluxos:**
   - Acessar `http://localhost:5174`
   - Verificar landing page
   - Acessar `http://localhost:5174/admin`
   - Deve redirecionar para login
   - Fazer login com credenciais criadas
   - Navegar pelo dashboard
   - Testar logout

## 🐛 Problemas Conhecidos

- [ ] Nenhum ainda (aguardando testes)

## 📝 Notas

- Certifique-se de que o Supabase Auth está configurado com email/password
- Verifique se as RLS policies estão ativadas
- Teste com diferentes roles (super_admin, owner, manager, staff)
- Verifique console do navegador para erros
