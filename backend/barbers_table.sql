-- =====================================================
-- TABELA: barbers
-- Barbeiros/Profissionais que realizam serviços
-- Separado de users (que são para autenticação no sistema)
-- =====================================================
CREATE TABLE barbers (
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
  
  -- Configurações profissionais
  commission_rate DECIMAL(5, 2) DEFAULT 0, -- Percentual de comissão (ex: 40.00 = 40%)
  hourly_rate DECIMAL(10, 2), -- Valor por hora (opcional)
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE, -- Disponível para agendamentos
  
  -- Notas administrativas
  notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(organization_id, email),
  UNIQUE(organization_id, phone)
);

-- Índices
CREATE INDEX idx_barbers_organization_id ON barbers(organization_id);
CREATE INDEX idx_barbers_is_active ON barbers(is_active);
CREATE INDEX idx_barbers_phone ON barbers(phone);

-- =====================================================
-- TABELA: barber_services
-- Relacionamento muitos-para-muitos entre barbers e services
-- Define quais serviços cada barbeiro pode realizar
-- =====================================================
CREATE TABLE barber_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- Pode ter preço customizado por barbeiro (opcional)
  custom_price DECIMAL(10, 2),
  custom_duration_minutes INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que não haja duplicatas
  UNIQUE(barber_id, service_id)
);

-- Índices
CREATE INDEX idx_barber_services_barber_id ON barber_services(barber_id);
CREATE INDEX idx_barber_services_service_id ON barber_services(service_id);

-- =====================================================
-- TABELA: barber_schedules
-- Relacionamento muitos-para-muitos entre barbers e schedules
-- Define os horários disponíveis de cada barbeiro
-- =====================================================
CREATE TABLE barber_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que não haja duplicatas
  UNIQUE(barber_id, schedule_id)
);

-- Índices
CREATE INDEX idx_barber_schedules_barber_id ON barber_schedules(barber_id);
CREATE INDEX idx_barber_schedules_schedule_id ON barber_schedules(schedule_id);

-- =====================================================
-- Atualizar tabela schedule_exceptions
-- Adicionar suporte para barbers além de employees
-- =====================================================
ALTER TABLE schedule_exceptions 
  ADD COLUMN barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE;

-- Adicionar índice
CREATE INDEX idx_schedule_exceptions_barber_id ON schedule_exceptions(barber_id);

-- Adicionar constraint para garantir que ou employee_id ou barber_id seja preenchido
ALTER TABLE schedule_exceptions 
  ADD CONSTRAINT check_either_employee_or_barber 
  CHECK (
    (employee_id IS NOT NULL AND barber_id IS NULL) OR 
    (employee_id IS NULL AND barber_id IS NOT NULL)
  );

-- =====================================================
-- Atualizar tabela appointments
-- Permitir que um agendamento seja com barber ou employee
-- =====================================================
ALTER TABLE appointments 
  ADD COLUMN barber_id UUID REFERENCES barbers(id) ON DELETE RESTRICT;

-- Modificar constraint para permitir employee_id nulo se barber_id estiver preenchido
ALTER TABLE appointments 
  ALTER COLUMN employee_id DROP NOT NULL;

-- Adicionar índice
CREATE INDEX idx_appointments_barber_id ON appointments(barber_id);

-- Adicionar constraint para garantir que ou employee_id ou barber_id seja preenchido
ALTER TABLE appointments 
  ADD CONSTRAINT check_either_employee_or_barber_appointment 
  CHECK (
    (employee_id IS NOT NULL AND barber_id IS NULL) OR 
    (employee_id IS NULL AND barber_id IS NOT NULL)
  );

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_barbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_barbers_updated_at
  BEFORE UPDATE ON barbers
  FOR EACH ROW
  EXECUTE FUNCTION update_barbers_updated_at();

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS para barbers
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver barbeiros da própria organização
CREATE POLICY "Users can view barbers from their organization" ON barbers
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem inserir barbeiros na própria organização
CREATE POLICY "Users can insert barbers in their organization" ON barbers
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar barbeiros da própria organização
CREATE POLICY "Users can update barbers from their organization" ON barbers
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem deletar barbeiros da própria organização
CREATE POLICY "Users can delete barbers from their organization" ON barbers
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Habilitar RLS para barber_services
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;

-- Policy: Acesso através da organização do barbeiro
CREATE POLICY "Access barber_services through organization" ON barber_services
  FOR ALL
  USING (
    barber_id IN (
      SELECT id FROM barbers 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Habilitar RLS para barber_schedules
ALTER TABLE barber_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Acesso através da organização do barbeiro
CREATE POLICY "Access barber_schedules through organization" ON barber_schedules
  FOR ALL
  USING (
    barber_id IN (
      SELECT id FROM barbers 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE barbers IS 'Barbeiros/Profissionais que realizam serviços (separado de users que são para autenticação)';
COMMENT ON TABLE barber_services IS 'Relacionamento entre barbeiros e serviços que eles podem realizar';
COMMENT ON TABLE barber_schedules IS 'Relacionamento entre barbeiros e os horários que eles trabalham';

COMMENT ON COLUMN barbers.commission_rate IS 'Percentual de comissão do barbeiro (ex: 40.00 = 40%)';
COMMENT ON COLUMN barbers.is_available IS 'Se o barbeiro está disponível para novos agendamentos';
COMMENT ON COLUMN barber_services.custom_price IS 'Preço personalizado para este barbeiro realizar este serviço (sobrescreve o preço padrão)';
COMMENT ON COLUMN barber_services.custom_duration_minutes IS 'Duração personalizada para este barbeiro realizar este serviço';
