-- =====================================================
-- DATABASE COMPLETO - SISTEMA TIAGO FORMAN
-- =====================================================
-- Como usar:
--   1. Acesse o SQL Editor do Supabase
--   2. Cole e execute ESTE arquivo inteiro (CTRL+A → Execute)
--   3. Uma execução → banco 100% pronto
--
-- Depois (opcional):
--   • Execute seed_data.sql para dados de exemplo
--   • Crie o usuário admin conforme instruções no fim deste arquivo
-- =====================================================


-- =====================================================
-- 1. EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================
-- 2. TIPOS ENUMERADOS (ENUMs)
-- =====================================================

CREATE TYPE business_type AS ENUM (
  'beauty_salon',  -- Salão de beleza
  'barber_shop',   -- Barbearia
  'spa',           -- Spa
  'clinic',        -- Clínica
  'gym',           -- Academia
  'studio',        -- Estúdio
  'other'          -- Outros
);

CREATE TYPE appointment_status AS ENUM (
  'pending',       -- Pendente
  'confirmed',     -- Confirmado
  'in_progress',   -- Em andamento
  'completed',     -- Concluído
  'cancelled',     -- Cancelado
  'no_show'        -- Não compareceu
);

CREATE TYPE payment_status AS ENUM (
  'pending',       -- Pendente
  'paid',          -- Pago
  'partially_paid',-- Parcialmente pago
  'refunded',      -- Reembolsado
  'cancelled'      -- Cancelado
);

CREATE TYPE payment_method AS ENUM (
  'cash',          -- Dinheiro
  'credit_card',   -- Cartão de crédito
  'debit_card',    -- Cartão de débito
  'pix',           -- PIX
  'bank_transfer', -- Transferência
  'other'          -- Outros
);

CREATE TYPE notification_status AS ENUM (
  'pending',       -- Pendente
  'sent',          -- Enviada
  'delivered',     -- Entregue
  'read',          -- Lida
  'failed'         -- Falhou
);

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

CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms',
  'whatsapp',
  'push'
);

CREATE TYPE user_role AS ENUM (
  'super_admin',   -- Admin do sistema
  'owner',         -- Dono do negócio
  'manager',       -- Gerente
  'employee',      -- Funcionário
  'receptionist'   -- Recepcionista
);

CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday'
);

CREATE TYPE employee_role AS ENUM (
  'manager', 'receptionist', 'financial', 'marketing', 'employee'
);


-- =====================================================
-- 3. TABELAS PRINCIPAIS
-- (ordem respeitando dependências de chaves estrangeiras)
-- =====================================================

-- ---------------
-- organizations
-- ---------------
CREATE TABLE organizations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    VARCHAR(255) NOT NULL,
  slug                    VARCHAR(100) UNIQUE NOT NULL,
  business_type           business_type NOT NULL DEFAULT 'beauty_salon',
  description             TEXT,

  -- Contato
  email                   VARCHAR(255),
  phone                   VARCHAR(20),
  website                 VARCHAR(255),

  -- Endereço
  address_street          VARCHAR(255),
  address_number          VARCHAR(20),
  address_complement      VARCHAR(100),
  address_neighborhood    VARCHAR(100),
  address_city            VARCHAR(100),
  address_state           VARCHAR(2),
  address_zip_code        VARCHAR(10),
  address_country         VARCHAR(2) DEFAULT 'BR',

  -- Configurações
  timezone                VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  currency                VARCHAR(3) DEFAULT 'BRL',
  language                VARCHAR(5) DEFAULT 'pt-BR',

  -- Pausa de agendamentos
  appointments_paused     BOOLEAN NOT NULL DEFAULT false,

  -- WhatsApp (Evolution API) — configuração legada, use whatsapp_instances
  whatsapp_enabled        BOOLEAN DEFAULT FALSE,
  whatsapp_instance_id    VARCHAR(255),
  whatsapp_api_key        TEXT,
  whatsapp_api_url        TEXT,
  whatsapp_phone          VARCHAR(20),

  -- Plano
  subscription_plan       VARCHAR(50) DEFAULT 'free',
  subscription_status     VARCHAR(20) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at           TIMESTAMP WITH TIME ZONE,

  -- Imagens
  logo_url                TEXT,
  cover_image_url         TEXT,

  -- Status
  is_active               BOOLEAN DEFAULT TRUE,

  -- JSONB: guarda settings de personalização, IA, banco etc.
  settings                JSONB DEFAULT '{}'::JSONB,
  metadata                JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at              TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_organizations_slug          ON organizations(slug);
CREATE INDEX idx_organizations_is_active     ON organizations(is_active);
CREATE INDEX idx_organizations_business_type ON organizations(business_type);

-- ---------------
-- users
-- (contas de login no sistema — admin, gerente, recepcionista)
-- ---------------
CREATE TABLE users (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id                UUID UNIQUE,  -- ID do Supabase Auth

  -- Dados pessoais
  first_name                  VARCHAR(100) NOT NULL,
  last_name                   VARCHAR(100) NOT NULL,
  email                       VARCHAR(255) NOT NULL,
  phone                       VARCHAR(20),
  cpf                         VARCHAR(14) UNIQUE,
  date_of_birth               DATE,
  gender                      VARCHAR(20),
  avatar_url                  TEXT,

  -- Permissões
  role                        user_role NOT NULL DEFAULT 'employee',
  permissions                 JSONB DEFAULT '{}'::JSONB,

  -- Status
  is_active                   BOOLEAN DEFAULT TRUE,
  is_available                BOOLEAN DEFAULT TRUE,

  -- Profissional
  specialties                 TEXT[],
  commission_rate             DECIMAL(5,2) DEFAULT 0,
  hourly_rate                 DECIMAL(10,2),

  -- Preferências
  preferred_language          VARCHAR(5) DEFAULT 'pt-BR',
  notification_preferences    JSONB DEFAULT '{}'::JSONB,
  metadata                    JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at               TIMESTAMP WITH TIME ZONE,
  deleted_at                  TIMESTAMP WITH TIME ZONE,

  UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_auth_user_id    ON users(auth_user_id);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_is_active       ON users(is_active);

-- ---------------
-- customers
-- ---------------
CREATE TABLE customers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dados pessoais
  first_name              VARCHAR(100) NOT NULL,
  last_name               VARCHAR(100) NOT NULL,
  email                   VARCHAR(255),
  phone                   VARCHAR(20) NOT NULL,
  cpf                     VARCHAR(14),
  date_of_birth           DATE,
  gender                  VARCHAR(20),
  avatar_url              TEXT,

  -- Endereço
  address_street          VARCHAR(255),
  address_number          VARCHAR(20),
  address_complement      VARCHAR(100),
  address_neighborhood    VARCHAR(100),
  address_city            VARCHAR(100),
  address_state           VARCHAR(2),
  address_zip_code        VARCHAR(10),

  -- Preferências
  preferred_employee_id   UUID REFERENCES users(id),
  preferred_days          day_of_week[],
  preferred_time_of_day   VARCHAR(20),
  notes                   TEXT,

  -- Marketing
  accepts_marketing       BOOLEAN DEFAULT TRUE,
  tags                    TEXT[],

  -- Estatísticas (atualizadas por trigger)
  total_appointments      INTEGER DEFAULT 0,
  total_spent             DECIMAL(10,2) DEFAULT 0,
  last_appointment_at     TIMESTAMP WITH TIME ZONE,

  -- WhatsApp
  whatsapp_number         VARCHAR(20),
  whatsapp_name           VARCHAR(255),

  -- Status
  is_active               BOOLEAN DEFAULT TRUE,
  is_vip                  BOOLEAN DEFAULT FALSE,

  metadata                JSONB DEFAULT '{}'::JSONB,

  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at              TIMESTAMP WITH TIME ZONE,

  UNIQUE(organization_id, phone)
);

CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_customers_phone           ON customers(phone);
CREATE INDEX idx_customers_email           ON customers(email);
CREATE INDEX idx_customers_is_active       ON customers(is_active);
CREATE INDEX idx_customers_tags            ON customers USING GIN(tags);

-- ---------------
-- services
-- ---------------
CREATE TABLE services (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name                     VARCHAR(255) NOT NULL,
  description              TEXT,
  category                 VARCHAR(100),
  duration_minutes         INTEGER NOT NULL,
  price                    DECIMAL(10,2) NOT NULL,
  buffer_time_minutes      INTEGER DEFAULT 0,
  requires_deposit         BOOLEAN DEFAULT FALSE,
  deposit_amount           DECIMAL(10,2),
  is_active                BOOLEAN DEFAULT TRUE,
  is_featured              BOOLEAN DEFAULT FALSE,
  image_url                TEXT,
  available_for_employees  UUID[],
  metadata                 JSONB DEFAULT '{}'::JSONB,

  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at               TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_services_organization_id ON services(organization_id);
CREATE INDEX idx_services_category        ON services(category);
CREATE INDEX idx_services_is_active       ON services(is_active);

-- ---------------
-- products
-- ---------------
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  category         VARCHAR(100),
  brand            VARCHAR(100),
  sku              VARCHAR(100),
  barcode          VARCHAR(100),
  cost_price       DECIMAL(10,2),
  sale_price       DECIMAL(10,2) NOT NULL,
  track_inventory  BOOLEAN DEFAULT TRUE,
  current_stock    INTEGER DEFAULT 0,
  min_stock_alert  INTEGER DEFAULT 5,
  image_url        TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  is_featured      BOOLEAN DEFAULT FALSE,
  metadata         JSONB DEFAULT '{}'::JSONB,

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_category        ON products(category);
CREATE INDEX idx_products_sku             ON products(sku);
CREATE INDEX idx_products_is_active       ON products(is_active);

-- ---------------
-- barbers
-- (profissionais que realizam serviços — barbeiros, cabeleireiros etc.)
-- ---------------
CREATE TABLE barbers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  email            VARCHAR(255),
  phone            VARCHAR(20) NOT NULL,
  cpf              VARCHAR(14),
  date_of_birth    DATE,
  gender           VARCHAR(20),
  avatar_url       TEXT,

  commission_rate  DECIMAL(5,2) DEFAULT 0,
  hourly_rate      DECIMAL(10,2),

  is_active        BOOLEAN DEFAULT TRUE,
  is_available     BOOLEAN DEFAULT TRUE,

  notes            TEXT,
  metadata         JSONB DEFAULT '{}'::JSONB,

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at       TIMESTAMP WITH TIME ZONE,

  UNIQUE(organization_id, phone)
);

CREATE INDEX idx_barbers_organization_id ON barbers(organization_id);
CREATE INDEX idx_barbers_is_active       ON barbers(is_active);
CREATE INDEX idx_barbers_phone           ON barbers(phone);

-- ---------------
-- barber_services
-- (quais serviços cada barbeiro pode realizar)
-- ---------------
CREATE TABLE barber_services (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id                UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id               UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price             DECIMAL(10,2),
  custom_duration_minutes  INTEGER,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(barber_id, service_id)
);

CREATE INDEX idx_barber_services_barber_id  ON barber_services(barber_id);
CREATE INDEX idx_barber_services_service_id ON barber_services(service_id);

-- ---------------
-- schedules
-- (horários de funcionamento regulares)
-- ---------------
CREATE TABLE schedules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id      UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = horário geral da empresa

  day_of_week      day_of_week NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  break_start_time TIME,
  break_end_time   TIME,
  is_active        BOOLEAN DEFAULT TRUE,

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedules_organization_id ON schedules(organization_id);
CREATE INDEX idx_schedules_employee_id     ON schedules(employee_id);
CREATE INDEX idx_schedules_day_of_week     ON schedules(day_of_week);

-- ---------------
-- barber_schedules
-- (horários disponíveis de cada barbeiro)
-- ---------------
CREATE TABLE barber_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id   UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(barber_id, schedule_id)
);

CREATE INDEX idx_barber_schedules_barber_id   ON barber_schedules(barber_id);
CREATE INDEX idx_barber_schedules_schedule_id ON barber_schedules(schedule_id);

-- ---------------
-- schedule_exceptions
-- (folgas, feriados, horários especiais)
-- ---------------
CREATE TABLE schedule_exceptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id      UUID REFERENCES users(id)   ON DELETE CASCADE,
  barber_id        UUID REFERENCES barbers(id) ON DELETE CASCADE,  -- alternativo a employee_id

  date             DATE NOT NULL,
  is_available     BOOLEAN DEFAULT FALSE,
  reason           VARCHAR(255),
  start_time       TIME,
  end_time         TIME,

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedule_exceptions_organization_id ON schedule_exceptions(organization_id);
CREATE INDEX idx_schedule_exceptions_employee_id     ON schedule_exceptions(employee_id);
CREATE INDEX idx_schedule_exceptions_barber_id       ON schedule_exceptions(barber_id);
CREATE INDEX idx_schedule_exceptions_date            ON schedule_exceptions(date);

-- ---------------
-- appointments
-- ---------------
CREATE TABLE appointments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  employee_id          UUID REFERENCES users(id)   ON DELETE RESTRICT,  -- nullable: usa barber_id em vez
  barber_id            UUID REFERENCES barbers(id) ON DELETE RESTRICT,  -- nullable: usa employee_id em vez
  service_id           UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

  scheduled_date       DATE NOT NULL,
  scheduled_time       TIME NOT NULL,
  scheduled_end_time   TIME NOT NULL,
  status               appointment_status DEFAULT 'pending',

  service_price        DECIMAL(10,2) NOT NULL,
  additional_charges   DECIMAL(10,2) DEFAULT 0,
  discount             DECIMAL(10,2) DEFAULT 0,
  total_amount         DECIMAL(10,2) NOT NULL,

  customer_notes       TEXT,
  internal_notes       TEXT,

  confirmed_at         TIMESTAMP WITH TIME ZONE,
  confirmed_by         UUID REFERENCES users(id),
  cancelled_at         TIMESTAMP WITH TIME ZONE,
  cancelled_by         UUID REFERENCES users(id),
  cancellation_reason  TEXT,
  reminder_sent_at     TIMESTAMP WITH TIME ZONE,

  metadata             JSONB DEFAULT '{}'::JSONB,

  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at           TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_appointments_organization_id     ON appointments(organization_id);
CREATE INDEX idx_appointments_customer_id         ON appointments(customer_id);
CREATE INDEX idx_appointments_employee_id         ON appointments(employee_id);
CREATE INDEX idx_appointments_barber_id           ON appointments(barber_id);
CREATE INDEX idx_appointments_service_id          ON appointments(service_id);
CREATE INDEX idx_appointments_scheduled_date      ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status              ON appointments(status);
CREATE INDEX idx_appointments_scheduled_datetime  ON appointments(scheduled_date, scheduled_time);

-- ---------------
-- appointment_products
-- ---------------
CREATE TABLE appointment_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id)     ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointment_products_appointment_id ON appointment_products(appointment_id);
CREATE INDEX idx_appointment_products_product_id     ON appointment_products(product_id);

-- ---------------
-- payments
-- ---------------
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id      UUID REFERENCES customers(id)    ON DELETE RESTRICT,  -- nullable: transações manuais sem cliente

  amount           DECIMAL(10,2) NOT NULL,
  payment_method   payment_method NOT NULL,
  payment_status   payment_status DEFAULT 'pending',

  paid_at          TIMESTAMP WITH TIME ZONE,
  due_date         DATE,
  transaction_id   VARCHAR(255),
  notes            TEXT,
  metadata         JSONB DEFAULT '{}'::JSONB,

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_appointment_id  ON payments(appointment_id);
CREATE INDEX idx_payments_customer_id     ON payments(customer_id);
CREATE INDEX idx_payments_payment_status  ON payments(payment_status);
CREATE INDEX idx_payments_paid_at         ON payments(paid_at);

-- ---------------
-- notifications
-- ---------------
CREATE TABLE notifications (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id        UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES users(id)     ON DELETE CASCADE,

  notification_type  notification_type NOT NULL,
  channel            notification_channel NOT NULL,
  title              VARCHAR(255),
  message            TEXT NOT NULL,
  status             notification_status DEFAULT 'pending',

  scheduled_for      TIMESTAMP WITH TIME ZONE,
  sent_at            TIMESTAMP WITH TIME ZONE,
  delivered_at       TIMESTAMP WITH TIME ZONE,
  read_at            TIMESTAMP WITH TIME ZONE,
  error_message      TEXT,
  retry_count        INTEGER DEFAULT 0,
  metadata           JSONB DEFAULT '{}'::JSONB,

  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_customer_id     ON notifications(customer_id);
CREATE INDEX idx_notifications_status          ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for   ON notifications(scheduled_for);

-- ---------------
-- audit_logs
-- ---------------
CREATE TABLE audit_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,

  action           VARCHAR(100) NOT NULL,   -- 'create', 'update', 'delete'
  entity_type      VARCHAR(100) NOT NULL,   -- 'appointment', 'customer', etc.
  entity_id        UUID,
  old_values       JSONB,
  new_values       JSONB,
  ip_address       INET,
  user_agent       TEXT,

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id         ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type     ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at      ON audit_logs(created_at);

-- ---------------
-- reviews
-- ---------------
CREATE TABLE reviews (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id      UUID REFERENCES customers(id)  ON DELETE SET NULL,
  appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
  employee_id      UUID REFERENCES users(id)   ON DELETE SET NULL,
  barber_id        UUID REFERENCES barbers(id) ON DELETE SET NULL,  -- barbeiro avaliado

  rating           INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment          TEXT,
  source           TEXT DEFAULT 'bot',   -- 'bot' | 'manual' | 'link'
  is_visible       BOOLEAN DEFAULT TRUE,

  response         TEXT,
  responded_at     TIMESTAMP WITH TIME ZONE,
  responded_by     UUID REFERENCES users(id),

  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_organization_id ON reviews(organization_id);
CREATE INDEX idx_reviews_customer_id     ON reviews(customer_id);
CREATE INDEX idx_reviews_barber_id       ON reviews(barber_id);
CREATE INDEX idx_reviews_rating          ON reviews(rating);


-- =====================================================
-- 4. TABELAS AUXILIARES
-- =====================================================

-- ---------------
-- employees
-- (funcionários administrativos que podem NÃO ter login no sistema)
-- ---------------
CREATE TABLE employees (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL se não tem login

  first_name              VARCHAR(100) NOT NULL,
  last_name               VARCHAR(100) NOT NULL,
  email                   VARCHAR(255),
  phone                   VARCHAR(20),
  date_of_birth           DATE,
  cpf                     VARCHAR(14),

  role                    employee_role NOT NULL DEFAULT 'employee',
  department              VARCHAR(100),

  -- Endereço
  address_street          TEXT,
  address_number          VARCHAR(20),
  address_complement      VARCHAR(100),
  address_neighborhood    VARCHAR(100),
  address_city            VARCHAR(100),
  address_state           VARCHAR(2),
  address_zip             VARCHAR(10),

  hire_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date        DATE,
  salary                  DECIMAL(10,2),
  commission_percentage   DECIMAL(5,2) DEFAULT 0,

  is_active               BOOLEAN DEFAULT TRUE,
  avatar_url              TEXT,
  notes                   TEXT,
  metadata                JSONB DEFAULT '{}'::JSONB,

  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_user         ON employees(user_id);
CREATE INDEX idx_employees_active       ON employees(is_active);
CREATE INDEX idx_employees_email        ON employees(email);

-- ---------------
-- whatsapp_instances
-- (instâncias Evolution API por organização)
-- ---------------
CREATE TABLE whatsapp_instances (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name             TEXT NOT NULL,           -- Nome amigável (ex: "WhatsApp Principal")
  instance_name    TEXT NOT NULL,           -- Instance name no Evolution (ex: "empresa_main")
  token            TEXT NOT NULL,           -- API token da instância
  api_url          TEXT NOT NULL DEFAULT 'https://api.evolution.com.br',

  status           TEXT NOT NULL DEFAULT 'disconnected',  -- 'connected' | 'disconnected'
  phone            TEXT,                    -- Número vinculado após conexão

  is_active        BOOLEAN NOT NULL DEFAULT TRUE,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_instances_organization_id ON whatsapp_instances(organization_id);


-- =====================================================
-- 5. FUNÇÕES E TRIGGERS
-- =====================================================

-- ---------------
-- Atualizar updated_at em todas as tabelas
-- ---------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at        BEFORE UPDATE ON organizations        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at                BEFORE UPDATE ON users                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at            BEFORE UPDATE ON customers            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at             BEFORE UPDATE ON services             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at             BEFORE UPDATE ON products             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbers_updated_at              BEFORE UPDATE ON barbers              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at            BEFORE UPDATE ON schedules            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_exceptions_updated_at  BEFORE UPDATE ON schedule_exceptions  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at         BEFORE UPDATE ON appointments         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at             BEFORE UPDATE ON payments             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at        BEFORE UPDATE ON notifications        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at              BEFORE UPDATE ON reviews              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at            BEFORE UPDATE ON employees            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at   BEFORE UPDATE ON whatsapp_instances   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------
-- Calcular horário de término do agendamento automaticamente
-- ---------------
CREATE OR REPLACE FUNCTION calculate_appointment_end_time()
RETURNS TRIGGER AS $$
DECLARE
  service_duration INTEGER;
  service_buffer   INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR
     NEW.scheduled_end_time IS NULL OR
     (TG_OP = 'UPDATE' AND OLD.service_id IS DISTINCT FROM NEW.service_id)
  THEN
    SELECT duration_minutes, COALESCE(buffer_time_minutes, 0)
    INTO service_duration, service_buffer
    FROM services WHERE id = NEW.service_id;

    NEW.scheduled_end_time := NEW.scheduled_time +
      ((service_duration + service_buffer) * INTERVAL '1 minute');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_end_time
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION calculate_appointment_end_time();

-- ---------------
-- Atualizar estatísticas do cliente após agendamento
-- ---------------
CREATE OR REPLACE FUNCTION update_customer_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers SET
      total_appointments = (
        SELECT COUNT(*) FROM appointments
        WHERE customer_id = NEW.customer_id
          AND status IN ('completed', 'confirmed', 'in_progress')
      ),
      last_appointment_at = (
        SELECT MAX(scheduled_date) FROM appointments
        WHERE customer_id = NEW.customer_id AND status = 'completed'
      ),
      total_spent = (
        SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE customer_id = NEW.customer_id AND payment_status = 'paid'
      )
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_on_appointment
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_customer_statistics();

-- ---------------
-- Atualizar estoque ao usar produto num agendamento
-- ---------------
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id AND track_inventory = true;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products SET current_stock = current_stock + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id AND track_inventory = true;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET current_stock = current_stock + OLD.quantity
    WHERE id = OLD.product_id AND track_inventory = true;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_product_inventory
  AFTER INSERT OR UPDATE OR DELETE ON appointment_products
  FOR EACH ROW EXECUTE FUNCTION update_product_inventory();

-- ---------------
-- Criar notificação de lembrete quando agendamento é confirmado
-- ---------------
CREATE OR REPLACE FUNCTION create_appointment_reminder_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO notifications (organization_id, customer_id, notification_type, channel, title, message, scheduled_for)
    VALUES (
      NEW.organization_id,
      NEW.customer_id,
      'appointment_reminder',
      'whatsapp',
      'Lembrete de Agendamento',
      format('Olá! Você tem um agendamento em %s às %s.',
        TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY'),
        TO_CHAR(NEW.scheduled_time, 'HH24:MI')
      ),
      (NEW.scheduled_date - INTERVAL '1 day') + NEW.scheduled_time - INTERVAL '1 hour'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_reminder_on_confirmation
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION create_appointment_reminder_notification();

-- ---------------
-- Audit log automático
-- ---------------
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id       UUID;
  organization_id_value UUID;
BEGIN
  SELECT id, organization_id INTO current_user_id, organization_id_value
  FROM users WHERE auth_user_id = auth.uid() LIMIT 1;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values)
    VALUES (COALESCE(organization_id_value, OLD.organization_id), current_user_id, 'delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (COALESCE(organization_id_value, NEW.organization_id), current_user_id, 'update', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_values)
    VALUES (COALESCE(organization_id_value, NEW.organization_id), current_user_id, 'create', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_appointments_changes AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_payments_changes     AFTER INSERT OR UPDATE OR DELETE ON payments     FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_customers_changes    AFTER INSERT OR UPDATE OR DELETE ON customers    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ---------------
-- Funções utilitárias (chamadas pelo frontend/backend)
-- ---------------

-- Buscar horários disponíveis de um profissional em um dia
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_organization_id UUID,
  p_employee_id     UUID,
  p_service_id      UUID,
  p_date            DATE
)
RETURNS TABLE (start_time TIME, end_time TIME, is_available BOOLEAN) AS $$
DECLARE
  service_duration  INTEGER;
  day_name          day_of_week;
  schedule_start    TIME;
  schedule_end      TIME;
  break_start       TIME;
  break_end         TIME;
  slot_interval     INTEGER := 30;
  current_slot      TIME;
BEGIN
  SELECT duration_minutes INTO service_duration FROM services WHERE id = p_service_id;

  day_name := CASE EXTRACT(DOW FROM p_date)
    WHEN 0 THEN 'sunday' WHEN 1 THEN 'monday' WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday' WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'   WHEN 6 THEN 'saturday'
  END;

  SELECT s.start_time, s.end_time, s.break_start_time, s.break_end_time
  INTO schedule_start, schedule_end, break_start, break_end
  FROM schedules s
  WHERE s.organization_id = p_organization_id
    AND (s.employee_id = p_employee_id OR s.employee_id IS NULL)
    AND s.day_of_week = day_name AND s.is_active = true
  LIMIT 1;

  IF EXISTS (
    SELECT 1 FROM schedule_exceptions
    WHERE organization_id = p_organization_id
      AND (employee_id = p_employee_id OR employee_id IS NULL)
      AND date = p_date AND is_available = false
  ) THEN RETURN; END IF;

  current_slot := schedule_start;
  WHILE current_slot + (service_duration * INTERVAL '1 minute') <= schedule_end LOOP
    IF break_start IS NULL OR (current_slot < break_start OR current_slot >= break_end) THEN
      RETURN QUERY SELECT
        current_slot,
        current_slot + (service_duration * INTERVAL '1 minute'),
        NOT EXISTS (
          SELECT 1 FROM appointments
          WHERE employee_id = p_employee_id AND scheduled_date = p_date
            AND status NOT IN ('cancelled', 'no_show')
            AND (scheduled_time, scheduled_end_time) OVERLAPS
                (current_slot, current_slot + (service_duration * INTERVAL '1 minute'))
        ) as is_available;
    END IF;
    current_slot := current_slot + (slot_interval * INTERVAL '1 minute');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Métricas do dashboard por período
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_organization_id UUID,
  p_start_date      DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date        DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments',     (SELECT COUNT(*)                    FROM appointments WHERE organization_id = p_organization_id AND scheduled_date BETWEEN p_start_date AND p_end_date),
    'completed_appointments', (SELECT COUNT(*)                    FROM appointments WHERE organization_id = p_organization_id AND scheduled_date BETWEEN p_start_date AND p_end_date AND status = 'completed'),
    'cancelled_appointments', (SELECT COUNT(*)                    FROM appointments WHERE organization_id = p_organization_id AND scheduled_date BETWEEN p_start_date AND p_end_date AND status = 'cancelled'),
    'total_revenue',          (SELECT COALESCE(SUM(amount), 0)   FROM payments      WHERE organization_id = p_organization_id AND paid_at BETWEEN p_start_date AND p_end_date AND payment_status = 'paid'),
    'new_customers',          (SELECT COUNT(*)                    FROM customers     WHERE organization_id = p_organization_id AND created_at::DATE BETWEEN p_start_date AND p_end_date),
    'total_customers',        (SELECT COUNT(*)                    FROM customers     WHERE organization_id = p_organization_id AND is_active = true),
    'average_rating',         (SELECT ROUND(AVG(rating), 2)      FROM reviews       WHERE organization_id = p_organization_id AND created_at::DATE BETWEEN p_start_date AND p_end_date)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 6. VIEWS
-- =====================================================

CREATE OR REPLACE VIEW daily_appointments AS
SELECT
  a.id, a.organization_id,
  a.scheduled_date, a.scheduled_time, a.scheduled_end_time,
  a.status, a.total_amount,
  c.first_name || ' ' || c.last_name AS customer_name,
  c.phone                             AS customer_phone,
  COALESCE(u.first_name || ' ' || u.last_name, b.first_name || ' ' || b.last_name) AS professional_name,
  s.name                              AS service_name,
  s.duration_minutes
FROM appointments a
JOIN customers c ON a.customer_id = c.id
JOIN services  s ON a.service_id  = s.id
LEFT JOIN users   u ON a.employee_id = u.id
LEFT JOIN barbers b ON a.barber_id   = b.id
WHERE a.deleted_at IS NULL
ORDER BY a.scheduled_date, a.scheduled_time;

CREATE OR REPLACE VIEW customer_statistics AS
SELECT
  c.id, c.organization_id,
  c.first_name, c.last_name, c.email, c.phone,
  COUNT(DISTINCT a.id)                                               AS total_appointments,
  SUM(CASE WHEN a.status = 'completed'  THEN 1 ELSE 0 END)          AS completed_appointments,
  SUM(CASE WHEN a.status = 'cancelled'  THEN 1 ELSE 0 END)          AS cancelled_appointments,
  SUM(CASE WHEN a.status = 'no_show'    THEN 1 ELSE 0 END)          AS no_show_appointments,
  COALESCE(SUM(p.amount), 0)                                         AS total_spent,
  MAX(a.scheduled_date)                                              AS last_appointment_date,
  AVG(r.rating)                                                      AS average_rating
FROM customers c
LEFT JOIN appointments a ON c.id = a.customer_id
LEFT JOIN payments     p ON c.id = p.customer_id AND p.payment_status = 'paid'
LEFT JOIN reviews      r ON c.id = r.customer_id
GROUP BY c.id;


-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances  ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares de autenticação
CREATE OR REPLACE FUNCTION auth.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_owner_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'owner', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas por tabela
-- (padrão: usuários autenticados têm acesso total — isolamento por org feito no app)

CREATE POLICY "Authenticated full access on organizations"    ON organizations       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on users"            ON users               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on customers"        ON customers           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on services"         ON services            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on products"         ON products            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on barbers"          ON barbers             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on barber_services"  ON barber_services     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on schedules"        ON schedules           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on barber_schedules" ON barber_schedules    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on sch_exceptions"   ON schedule_exceptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on appointments"     ON appointments        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on appt_products"    ON appointment_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on payments"         ON payments            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on notifications"    ON notifications       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on audit_logs"       ON audit_logs          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on reviews"          ON reviews             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on employees"        ON employees           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access on whatsapp_inst"    ON whatsapp_instances  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- =====================================================
-- 8. STORAGE (bucket de imagens)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Upload de imagens por autenticados"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Imagens publicas para leitura"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'images');

CREATE POLICY "Atualizar imagens por autenticados"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');

CREATE POLICY "Deletar imagens por autenticados"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'images');


-- =====================================================
-- 9. COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE organizations       IS 'Organizações/Tenants do sistema';
COMMENT ON TABLE users               IS 'Contas de login (admins, gerentes, recepcionistas)';
COMMENT ON TABLE customers           IS 'Clientes dos negócios';
COMMENT ON TABLE services            IS 'Serviços oferecidos';
COMMENT ON TABLE products            IS 'Produtos vendidos';
COMMENT ON TABLE barbers             IS 'Profissionais que realizam serviços (barbeiros, cabeleireiros etc.)';
COMMENT ON TABLE barber_services     IS 'Quais serviços cada barbeiro pode realizar';
COMMENT ON TABLE schedules           IS 'Horários de funcionamento regulares';
COMMENT ON TABLE barber_schedules    IS 'Vínculo entre barbeiros e horários disponíveis';
COMMENT ON TABLE schedule_exceptions IS 'Exceções: folgas, feriados, horários especiais';
COMMENT ON TABLE appointments        IS 'Agendamentos realizados';
COMMENT ON TABLE appointment_products IS 'Produtos utilizados em agendamentos';
COMMENT ON TABLE payments            IS 'Pagamentos realizados';
COMMENT ON TABLE notifications       IS 'Notificações enviadas aos clientes';
COMMENT ON TABLE audit_logs          IS 'Logs de auditoria de alterações';
COMMENT ON TABLE reviews             IS 'Avaliações de clientes';
COMMENT ON TABLE employees           IS 'Funcionários administrativos (podem não ter login)';
COMMENT ON TABLE whatsapp_instances  IS 'Instâncias Evolution API por organização';

COMMENT ON COLUMN payments.customer_id          IS 'NULL para transações manuais sem cliente específico';
COMMENT ON COLUMN appointments.employee_id      IS 'NULL quando barber_id estiver preenchido';
COMMENT ON COLUMN appointments.barber_id        IS 'NULL quando employee_id estiver preenchido';
COMMENT ON COLUMN reviews.source                IS '''bot'' = gerada automaticamente | ''manual'' = criada pelo admin | ''link'' = link externo';
COMMENT ON COLUMN organizations.settings        IS 'JSONB: primary_color, secondary_color, accent_color, business_type, menu_icons, ai_settings, bank_settings, etc.';
COMMENT ON COLUMN whatsapp_instances.instance_name IS 'Nome da instância no servidor Evolution API';


-- =====================================================
-- PRÓXIMOS PASSOS APÓS EXECUTAR ESTE ARQUIVO
-- =====================================================

-- 1. (Opcional) Execute seed_data.sql para dados de exemplo
--
-- 2. Crie a organização:
--    INSERT INTO organizations (name, slug)
--    VALUES ('Minha Barbearia', 'minha-barbearia');
--
-- 3. Crie o usuário admin no Supabase:
--    Authentication → Users → Add user
--    Copie o UUID gerado (User UID)
--
-- 4. Vincule o usuário ao banco:
--    INSERT INTO users (auth_user_id, organization_id, first_name, last_name, email, role, is_active)
--    VALUES (
--      '<UUID_DO_AUTH>',
--      (SELECT id FROM organizations WHERE slug = 'minha-barbearia'),
--      'Seu', 'Nome', 'seu@email.com', 'super_admin', true
--    );

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
