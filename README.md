# Tiago Forman - Barbearia & Estética Masculina

Site de apresentação e sistema administrativo completo para o salão Tiago Forman.

## 🚀 Como executar

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

### Preview da build
```bash
npm run preview
```

## 🔐 Painel Administrativo

O sistema inclui um painel administrativo completo em `/admin` com:

- 🔒 **Autenticação**: Login seguro com Supabase
- 👥 **Gestão de Clientes**: Cadastro e histórico
- 📅 **Agendamentos**: Sistema completo de agendamento
- ✂️ **Serviços**: Catálogo de serviços
- 🛍️ **Produtos**: Controle de estoque e vendas
- 👨‍💼 **Funcionários**: Gestão da equipe
- 💰 **Financeiro**: Controle de receitas e despesas
- 📊 **Dashboard**: Métricas e relatórios

### Configuração do Admin

1. **Configure o Supabase:**
   ```bash
   copy .env.example .env
   ```
   Edite `.env` com suas credenciais do Supabase

2. **Execute os scripts SQL:**
   - `backend/schema.sql`
   - `backend/rls_policies.sql`
   - `backend/functions_triggers.sql`
   - `backend/seed_data.sql` (opcional)

3. **Acesse:** `/admin/login`

Para mais detalhes, veja [ADMIN_SETUP.md](ADMIN_SETUP.md)

## 🛠️ Tecnologias

### Frontend
- React 18.3.1
- Vite 6.0.11
- Tailwind CSS 3.4.17
- React Router DOM 7.2.1

### Backend
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Multi-tenant architecture
- Real-time subscriptions

## 📱 Recursos

### Site Público
- Design moderno e responsivo
- Animações suaves
- Link para Instagram (@thiagoforman)
- Link para WhatsApp (+55 34 8856-8529)
- Logo personalizada
- Otimizado para performance

### Painel Admin
- Sistema multi-tenant
- Autenticação e autorização
- Dashboard com métricas em tempo real
- CRUD completo para todas entidades
- Histórico de auditoria
- Notificações automáticas
- Integração WhatsApp (Evolution API ready)

## 🐳 Deploy

### Easypanel com Docker

1. **Dockerfile já configurado** ✅
2. **Variáveis de ambiente no Easypanel:**
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

3. **Auto-deploy:** Conectado ao GitHub (main branch)

## 📂 Estrutura do Projeto

```
tiagoforman/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── AdminLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/         # Contextos React
│   │   └── AuthContext.jsx
│   ├── lib/              # Bibliotecas e configurações
│   │   └── supabase.js
│   ├── pages/            # Páginas da aplicação
│   │   ├── Home.jsx      # Landing page
│   │   ├── Login.jsx     # Login do admin
│   │   └── Dashboard.jsx # Dashboard admin
│   ├── App.jsx           # Rotas principais
│   ├── main.jsx          # Entry point
│   └── index.css         # Estilos globais
├── backend/              # Scripts SQL do banco
│   ├── schema.sql
│   ├── rls_policies.sql
│   ├── functions_triggers.sql
│   └── seed_data.sql
├── public/
│   └── logo.jpeg
├── Dockerfile
└── README.md
```

## 📄 Licença

© 2025 Tiago Forman. Todos os direitos reservados.
