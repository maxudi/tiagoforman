-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Segurança e isolamento multi-tenant
-- =====================================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Função para pegar o organization_id do usuário atual
CREATE OR REPLACE FUNCTION auth.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se o usuário é super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se o usuário é owner ou manager
CREATE OR REPLACE FUNCTION auth.is_owner_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('super_admin', 'owner', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- POLICIES: organizations
-- =====================================================

-- Super admins podem ver todas as organizações
CREATE POLICY "Super admins can view all organizations"
  ON organizations FOR SELECT
  USING (auth.is_super_admin());

-- Usuários podem ver apenas sua organização
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = auth.get_user_organization_id());

-- Apenas super admins podem criar organizações
CREATE POLICY "Super admins can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.is_super_admin());

-- Owners e managers podem atualizar sua organização
CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (id = auth.get_user_organization_id() AND auth.is_owner_or_manager());

-- =====================================================
-- POLICIES: users
-- =====================================================

-- Usuários podem ver outros usuários da mesma organização
CREATE POLICY "Users can view users from same organization"
  ON users FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth_user_id = auth.uid());

-- Owners e managers podem criar usuários
CREATE POLICY "Owners can create users"
  ON users FOR INSERT
  WITH CHECK (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Owners e managers podem atualizar usuários da organização
CREATE POLICY "Owners can update users"
  ON users FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: customers
-- =====================================================

-- Usuários podem ver clientes da mesma organização
CREATE POLICY "Users can view customers from same organization"
  ON customers FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Usuários podem criar clientes
CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  WITH CHECK (organization_id = auth.get_user_organization_id());

-- Usuários podem atualizar clientes da mesma organização
CREATE POLICY "Users can update customers"
  ON customers FOR UPDATE
  USING (organization_id = auth.get_user_organization_id());

-- Apenas owners podem deletar clientes
CREATE POLICY "Owners can delete customers"
  ON customers FOR DELETE
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: services
-- =====================================================

-- Todos podem ver serviços ativos da organização
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (organization_id = auth.get_user_organization_id() AND is_active = true);

-- Owners e managers podem gerenciar serviços
CREATE POLICY "Owners can manage services"
  ON services FOR ALL
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: products
-- =====================================================

-- Usuários podem ver produtos da organização
CREATE POLICY "Users can view products from same organization"
  ON products FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Owners e managers podem gerenciar produtos
CREATE POLICY "Owners can manage products"
  ON products FOR ALL
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: schedules
-- =====================================================

-- Usuários podem ver horários da organização
CREATE POLICY "Users can view schedules from same organization"
  ON schedules FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Owners e managers podem gerenciar horários
CREATE POLICY "Owners can manage schedules"
  ON schedules FOR ALL
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: schedule_exceptions
-- =====================================================

-- Usuários podem ver exceções de horário
CREATE POLICY "Users can view schedule exceptions"
  ON schedule_exceptions FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Owners, managers e funcionários podem criar exceções
CREATE POLICY "Users can create schedule exceptions"
  ON schedule_exceptions FOR INSERT
  WITH CHECK (organization_id = auth.get_user_organization_id());

-- =====================================================
-- POLICIES: appointments
-- =====================================================

-- Usuários podem ver agendamentos da organização
CREATE POLICY "Users can view appointments from same organization"
  ON appointments FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Usuários podem criar agendamentos
CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (organization_id = auth.get_user_organization_id());

-- Usuários podem atualizar agendamentos
CREATE POLICY "Users can update appointments"
  ON appointments FOR UPDATE
  USING (organization_id = auth.get_user_organization_id());

-- Owners podem deletar agendamentos
CREATE POLICY "Owners can delete appointments"
  ON appointments FOR DELETE
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: appointment_products
-- =====================================================

-- Usuários podem ver produtos de agendamentos
CREATE POLICY "Users can view appointment products"
  ON appointment_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = appointment_products.appointment_id 
      AND appointments.organization_id = auth.get_user_organization_id()
    )
  );

-- Usuários podem gerenciar produtos de agendamentos
CREATE POLICY "Users can manage appointment products"
  ON appointment_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = appointment_products.appointment_id 
      AND appointments.organization_id = auth.get_user_organization_id()
    )
  );

-- =====================================================
-- POLICIES: payments
-- =====================================================

-- Usuários podem ver pagamentos da organização
CREATE POLICY "Users can view payments from same organization"
  ON payments FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Usuários podem criar pagamentos
CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  WITH CHECK (organization_id = auth.get_user_organization_id());

-- Owners e managers podem atualizar pagamentos
CREATE POLICY "Owners can update payments"
  ON payments FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- POLICIES: notifications
-- =====================================================

-- Usuários podem ver notificações da organização
CREATE POLICY "Users can view notifications from same organization"
  ON notifications FOR SELECT
  USING (organization_id = auth.get_user_organization_id());

-- Sistema pode criar notificações
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (organization_id = auth.get_user_organization_id());

-- Sistema pode atualizar notificações
CREATE POLICY "System can update notifications"
  ON notifications FOR UPDATE
  USING (organization_id = auth.get_user_organization_id());

-- =====================================================
-- POLICIES: audit_logs
-- =====================================================

-- Owners podem ver audit logs
CREATE POLICY "Owners can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- Sistema pode criar audit logs
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- POLICIES: reviews
-- =====================================================

-- Todos podem ver reviews visíveis
CREATE POLICY "Anyone can view visible reviews"
  ON reviews FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() 
    AND is_visible = true
  );

-- Owners podem ver todas as reviews
CREATE POLICY "Owners can view all reviews"
  ON reviews FOR SELECT
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- Sistema pode criar reviews
CREATE POLICY "System can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (organization_id = auth.get_user_organization_id());

-- Owners podem gerenciar reviews
CREATE POLICY "Owners can manage reviews"
  ON reviews FOR UPDATE
  USING (
    organization_id = auth.get_user_organization_id() 
    AND auth.is_owner_or_manager()
  );

-- =====================================================
-- FIM DAS POLICIES
-- =====================================================
