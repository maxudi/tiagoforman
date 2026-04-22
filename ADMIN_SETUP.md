# Painel Administrativo - Tiago Forman

## 🔐 Configuração do Supabase

Para usar o painel administrativo, você precisa configurar suas credenciais do Supabase:

1. **Copie o arquivo de exemplo:**
   ```bash
   copy .env.example .env
   ```

2. **Configure suas credenciais:**
   Edite o arquivo `.env` e adicione as credenciais do seu projeto Supabase:
   ```
   VITE_SUPABASE_URL=coloquelanoenv
   VITE_SUPABASE_ANON_KEY=coloquelánoenv
   ```

3. **Encontre suas credenciais:**
   - Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione seu projeto
   - Vá em Settings > API
   - Copie a "Project URL" e "anon/public key"

## 📊 Estrutura do Backend

Execute os scripts SQL na seguinte ordem no seu Supabase:

1. `backend/schema.sql` - Cria todas as tabelas e estrutura
2. `backend/rls_policies.sql` - Configura as políticas de segurança
3. `backend/functions_triggers.sql` - Adiciona automações
4. `backend/seed_data.sql` - (Opcional) Dados de teste

## 🚀 Rotas Disponíveis

- `/` - Página inicial (Coming Soon)
- `/admin/login` - Login do administrador
- `/admin/dashboard` - Dashboard principal
- `/admin/agendamentos` - Gestão de agendamentos
- `/admin/clientes` - Gestão de clientes
- `/admin/servicos` - Gestão de serviços
- `/admin/produtos` - Gestão de produtos
- `/admin/funcionarios` - Gestão de funcionários
- `/admin/financeiro` - Controle financeiro
- `/admin/configuracoes` - Configurações do sistema

## 👥 Permissões de Acesso

Apenas usuários com os seguintes roles têm acesso ao painel:
- `super_admin`
- `owner`
- `manager`

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🐳 Deploy com Docker

O Dockerfile está configurado para servir o build de produção na porta 80.

```bash
# Build da imagem
docker build -t tiagoforman .

# Executar container
docker run -p 80:80 tiagoforman
```

## 📝 Notas Importantes

- O arquivo `.env` não deve ser commitado no Git (já está no .gitignore)
- Para produção, configure as variáveis de ambiente no Easypanel
- As credenciais do Supabase devem ser mantidas em segredo
- O sistema usa Row Level Security (RLS) para isolamento multi-tenant
