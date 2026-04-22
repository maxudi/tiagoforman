-- Enum para tipos de cargo (criar primeiro)
DO $$ BEGIN
  CREATE TYPE employee_role AS ENUM ('manager', 'receptionist', 'financial', 'marketing', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de Funcionários Administrativos
-- Separada de users para permitir funcionários sem acesso ao sistema
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Opcional: apenas se tiver login no sistema
  
  -- Dados Pessoais
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  cpf VARCHAR(14),
  
  -- Cargo e Função
  role employee_role NOT NULL DEFAULT 'employee',
  department VARCHAR(100),
  
  -- Endereço
  address_street TEXT,
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Informações Profissionais
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  salary DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Avatar
  avatar_url TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_email ON employees(email);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - DESABILITADO por padrão
-- Para habilitar no futuro com políticas simples, execute:
/*
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo para usuários autenticados"
  ON employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
*/

-- Comentários
COMMENT ON TABLE employees IS 'Funcionários administrativos da barbearia (separados de contas de usuário)';
COMMENT ON COLUMN employees.user_id IS 'Referência para conta de usuário (opcional). NULL se funcionário não tem acesso ao sistema';
COMMENT ON COLUMN employees.role IS 'Cargo do funcionário: manager, receptionist, financial, marketing, employee';
COMMENT ON COLUMN employees.commission_percentage IS 'Percentual de comissão sobre vendas (se aplicável)';
