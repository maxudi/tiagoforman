-- =====================================================
-- SCHEMA COMPLETO - SISTEMA MULTI-TENANT DE AGENDAMENTO
-- Database: PostgreSQL (Supabase)
-- Versão: 1.0.0
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS - Tipos de Dados
-- =====================================================

-- Tipo de negócio
CREATE TYPE business_type AS ENUM (
  'beauty_salon',      -- Salão de beleza
  'barber_shop',       -- Barbearia
  'spa',               -- Spa
  'clinic',            -- Clínica
  'gym',               -- Academia
  'studio',            -- Estúdio
  'other'              -- Outros
);

-- Status de agendamento
CREATE TYPE appointment_status AS ENUM (
  'pending',           -- Pendente
  'confirmed',         -- Confirmado
  'in_progress',       -- Em andamento
  'completed',         -- Concluído
  'cancelled',         -- Cancelado
  'no_show'            -- Não compareceu
);

-- Status de pagamento
CREATE TYPE payment_status AS ENUM (
  'pending',           -- Pendente
  'paid',              -- Pago
  'partially_paid',    -- Parcialmente pago
  'refunded',          -- Reembolsado
  'cancelled'          -- Cancelado
);

-- Método de pagamento
CREATE TYPE payment_method AS ENUM (
  'cash',              -- Dinheiro
  'credit_card',       -- Cartão de crédito
  'debit_card',        -- Cartão de débito
  'pix',               -- PIX
  'bank_transfer',     -- Transferência
  'other'              -- Outros
);

-- Status de notificação
CREATE TYPE notification_status AS ENUM (
  'pending',           -- Pendente
  'sent',              -- Enviada
  'delivered',         -- Entregue
  'read',              -- Lida
  'failed'             -- Falhou
);

-- Tipo de notificação
CREATE TYPE notification_type AS ENUM (
  'appointment_created',
  'appointment_confirmed',
  'appointment_reminder',
  'appointment_cancelled',
  'payment_received',
  'birthday',
  'promotional',
  'system'
);

-- Canal de notificação
CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms',
  'whatsapp',
  'push'
);

-- Tipo de usuário
CREATE TYPE user_role AS ENUM (
  'super_admin',       -- Admin do sistema
  'owner',             -- Dono do negócio
  'manager',           -- Gerente
  'employee',          -- Funcionário
  'receptionist'       -- Recepcionista
);

-- Dia da semana
CREATE TYPE day_of_week AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

-- =====================================================
-- TABELA: organizations (TENANT)
-- Tabela principal para multi-tenancy
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_type business_type NOT NULL DEFAULT 'beauty_salon',
  description TEXT,
  
  -- Informações de contato
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Endereço
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip_code VARCHAR(10),
  address_country VARCHAR(2) DEFAULT 'BR',
  
  -- Localização
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Configurações
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  currency VARCHAR(3) DEFAULT 'BRL',
  language VARCHAR(5) DEFAULT 'pt-BR',
  
  -- Integração WhatsApp (Evolution API)
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_instance_id VARCHAR(255),
  whatsapp_api_key TEXT,
  whatsapp_api_url TEXT,
  whatsapp_phone VARCHAR(20),
  
  -- Assinatura e plano
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Logo e imagens
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  settings JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_organizations_business_type ON organizations(business_type);

-- =====================================================
-- TABELA: users
-- Usuários do sistema (funcionários, gerentes, etc)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Autenticação (integra com Supabase Auth)
  auth_user_id UUID UNIQUE, -- ID do Supabase Auth
  
  -- Informações pessoais
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  date_of_birth DATE,
  gender VARCHAR(20),
  
  -- Avatar
  avatar_url TEXT,
  
  -- Papel e permissões
  role user_role NOT NULL DEFAULT 'employee',
  permissions JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE, -- Disponível para agendamentos
  
  -- Configurações profissionais
  specialties TEXT[], -- ['corte', 'barba', 'coloração']
  commission_rate DECIMAL(5, 2) DEFAULT 0, -- Percentual de comissão
  hourly_rate DECIMAL(10, 2), -- Valor por hora
  
  -- Preferências
  preferred_language VARCHAR(5) DEFAULT 'pt-BR',
  notification_preferences JSONB DEFAULT '{}'::JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(organization_id, email)
);

-- Índices
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =====================================================
-- TABELA: customers
-- Clientes do negócio
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Informações pessoais
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  cpf VARCHAR(14),
  date_of_birth DATE,
  gender VARCHAR(20),
  
  -- Avatar
  avatar_url TEXT,
  
  -- Endereço
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip_code VARCHAR(10),
  
  -- Preferências
  preferred_employee_id UUID REFERENCES users(id),
  preferred_days day_of_week[],
  preferred_time_of_day VARCHAR(20), -- 'morning', 'afternoon', 'evening'
  notes TEXT,
  
  -- Marketing
  accepts_marketing BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  
  -- Estatísticas
  total_appointments INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_appointment_at TIMESTAMP WITH TIME ZONE,
  
  -- Integração WhatsApp
  whatsapp_number VARCHAR(20),
  whatsapp_name VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_vip BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(organization_id, phone)
);

-- Índices
CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);

-- =====================================================
-- TABELA: services
-- Serviços oferecidos pelo negócio
-- =====================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Informações do serviço
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Duração e preço
  duration_minutes INTEGER NOT NULL, -- Duração em minutos
  price DECIMAL(10, 2) NOT NULL,
  
  -- Configurações
  buffer_time_minutes INTEGER DEFAULT 0, -- Tempo de folga após o serviço
  requires_deposit BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10, 2),
  
  -- Disponibilidade
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Imagem
  image_url TEXT,
  
  -- Profissionais que realizam este serviço
  available_for_employees UUID[], -- Array de IDs de funcionários
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_services_organization_id ON services(organization_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);

-- =====================================================
-- TABELA: products
-- Produtos vendidos (opcional)
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Informações do produto
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  
  -- Preços
  cost_price DECIMAL(10, 2), -- Preço de custo
  sale_price DECIMAL(10, 2) NOT NULL, -- Preço de venda
  
  -- Estoque
  track_inventory BOOLEAN DEFAULT TRUE,
  current_stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  
  -- Imagem
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);

-- =====================================================
-- TABELA: schedules
-- Horários de funcionamento e disponibilidade
-- =====================================================
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dia da semana
  day_of_week day_of_week NOT NULL,
  
  -- Horários
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Intervalo (almoço, etc)
  break_start_time TIME,
  break_end_time TIME,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_schedules_organization_id ON schedules(organization_id);
CREATE INDEX idx_schedules_employee_id ON schedules(employee_id);
CREATE INDEX idx_schedules_day_of_week ON schedules(day_of_week);

-- =====================================================
-- TABELA: schedule_exceptions
-- Exceções de horário (feriados, folgas, etc)
-- =====================================================
CREATE TABLE schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Data
  date DATE NOT NULL,
  
  -- Tipo
  is_available BOOLEAN DEFAULT FALSE, -- FALSE = fechado/indisponível
  reason VARCHAR(255),
  
  -- Horário customizado (se is_available = TRUE)
  start_time TIME,
  end_time TIME,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_schedule_exceptions_organization_id ON schedule_exceptions(organization_id);
CREATE INDEX idx_schedule_exceptions_employee_id ON schedule_exceptions(employee_id);
CREATE INDEX idx_schedule_exceptions_date ON schedule_exceptions(date);

-- =====================================================
-- TABELA: appointments
-- Agendamentos
-- =====================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Relacionamentos
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  
  -- Data e hora
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_end_time TIME NOT NULL,
  
  -- Status
  status appointment_status DEFAULT 'pending',
  
  -- Valores
  service_price DECIMAL(10, 2) NOT NULL,
  additional_charges DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Notas
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Confirmação
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES users(id),
  
  -- Cancelamento
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  -- Lembretes enviados
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_datetime ON appointments(scheduled_date, scheduled_time);

-- =====================================================
-- TABELA: appointment_products
-- Produtos usados/vendidos no agendamento
-- =====================================================
CREATE TABLE appointment_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Quantidade e valores
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_appointment_products_appointment_id ON appointment_products(appointment_id);
CREATE INDEX idx_appointment_products_product_id ON appointment_products(product_id);

-- =====================================================
-- TABELA: payments
-- Pagamentos
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Pagamento
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  
  -- Datas
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  
  -- Informações adicionais
  transaction_id VARCHAR(255),
  notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- =====================================================
-- TABELA: notifications
-- Sistema de notificações
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Destinatário
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo e canal
  notification_type notification_type NOT NULL,
  channel notification_channel NOT NULL,
  
  -- Conteúdo
  title VARCHAR(255),
  message TEXT NOT NULL,
  
  -- Status
  status notification_status DEFAULT 'pending',
  
  -- Envio
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Erro
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- =====================================================
-- TABELA: audit_logs
-- Logs de auditoria
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Quem fez a ação
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Detalhes da ação
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete'
  entity_type VARCHAR(100) NOT NULL, -- 'appointment', 'customer', etc
  entity_id UUID,
  
  -- Dados
  old_values JSONB,
  new_values JSONB,
  
  -- Informações adicionais
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TABELA: reviews
-- Avaliações de clientes
-- =====================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Relacionamentos
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Status
  is_visible BOOLEAN DEFAULT TRUE,
  
  -- Resposta
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_reviews_organization_id ON reviews(organization_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_employee_id ON reviews(employee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Estatísticas de clientes
CREATE OR REPLACE VIEW customer_statistics AS
SELECT 
  c.id,
  c.organization_id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  COUNT(DISTINCT a.id) as total_appointments,
  SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
  SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_appointments,
  SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) as no_show_appointments,
  COALESCE(SUM(p.amount), 0) as total_spent,
  MAX(a.scheduled_date) as last_appointment_date,
  AVG(r.rating) as average_rating
FROM customers c
LEFT JOIN appointments a ON c.id = a.customer_id
LEFT JOIN payments p ON c.id = p.customer_id AND p.payment_status = 'paid'
LEFT JOIN reviews r ON c.id = r.customer_id
GROUP BY c.id;

-- View: Dashboard de agendamentos do dia
CREATE OR REPLACE VIEW daily_appointments AS
SELECT 
  a.id,
  a.organization_id,
  a.scheduled_date,
  a.scheduled_time,
  a.scheduled_end_time,
  a.status,
  c.first_name || ' ' || c.last_name as customer_name,
  c.phone as customer_phone,
  u.first_name || ' ' || u.last_name as employee_name,
  s.name as service_name,
  s.duration_minutes,
  a.total_amount
FROM appointments a
JOIN customers c ON a.customer_id = c.id
JOIN users u ON a.employee_id = u.id
JOIN services s ON a.service_id = s.id
WHERE a.deleted_at IS NULL
ORDER BY a.scheduled_date, a.scheduled_time;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE organizations IS 'Organizações/Tenants do sistema multi-tenant';
COMMENT ON TABLE users IS 'Usuários do sistema (funcionários, gerentes, etc)';
COMMENT ON TABLE customers IS 'Clientes dos negócios';
COMMENT ON TABLE services IS 'Serviços oferecidos';
COMMENT ON TABLE products IS 'Produtos vendidos';
COMMENT ON TABLE schedules IS 'Horários de funcionamento regulares';
COMMENT ON TABLE schedule_exceptions IS 'Exceções de horário (feriados, folgas)';
COMMENT ON TABLE appointments IS 'Agendamentos realizados';
COMMENT ON TABLE appointment_products IS 'Produtos vinculados a agendamentos';
COMMENT ON TABLE payments IS 'Pagamentos realizados';
COMMENT ON TABLE notifications IS 'Notificações enviadas';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria do sistema';
COMMENT ON TABLE reviews IS 'Avaliações de clientes';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
