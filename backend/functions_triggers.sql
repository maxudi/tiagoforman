-- =====================================================
-- FUNCTIONS E TRIGGERS AVANÇADOS
-- Automações e validações
-- =====================================================

-- =====================================================
-- TRIGGER: Criar audit log automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  organization_id_value UUID;
BEGIN
  -- Pegar o user_id atual
  SELECT id, organization_id INTO current_user_id, organization_id_value
  FROM users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- Criar log de auditoria
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values
    ) VALUES (
      COALESCE(organization_id_value, OLD.organization_id),
      current_user_id,
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      COALESCE(organization_id_value, NEW.organization_id),
      current_user_id,
      'update',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      COALESCE(organization_id_value, NEW.organization_id),
      current_user_id,
      'create',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de audit em tabelas importantes
CREATE TRIGGER audit_appointments_changes 
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_payments_changes 
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_customers_changes 
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- TRIGGER: Atualizar estatísticas do cliente
-- =====================================================

CREATE OR REPLACE FUNCTION update_customer_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers SET
      total_appointments = (
        SELECT COUNT(*) 
        FROM appointments 
        WHERE customer_id = NEW.customer_id 
        AND status IN ('completed', 'confirmed', 'in_progress')
      ),
      last_appointment_at = (
        SELECT MAX(scheduled_date) 
        FROM appointments 
        WHERE customer_id = NEW.customer_id 
        AND status = 'completed'
      ),
      total_spent = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM payments 
        WHERE customer_id = NEW.customer_id 
        AND payment_status = 'paid'
      )
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_on_appointment
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_customer_statistics();

-- =====================================================
-- TRIGGER: Validar disponibilidade de horário
-- =====================================================

CREATE OR REPLACE FUNCTION validate_appointment_availability()
RETURNS TRIGGER AS $$
DECLARE
  conflicting_appointments INTEGER;
BEGIN
  -- Verificar se já existe outro agendamento no mesmo horário
  SELECT COUNT(*) INTO conflicting_appointments
  FROM appointments
  WHERE employee_id = NEW.employee_id
    AND scheduled_date = NEW.scheduled_date
    AND status NOT IN ('cancelled', 'no_show')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (
      (scheduled_time, scheduled_end_time) OVERLAPS 
      (NEW.scheduled_time, NEW.scheduled_end_time)
    );
  
  IF conflicting_appointments > 0 THEN
    RAISE EXCEPTION 'Horário já está ocupado para este profissional';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_before_insert_update
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION validate_appointment_availability();

-- =====================================================
-- TRIGGER: Calcular horário de término do agendamento
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_appointment_end_time()
RETURNS TRIGGER AS $$
DECLARE
  service_duration INTEGER;
  service_buffer INTEGER;
BEGIN
  -- Só calcular se scheduled_end_time for NULL ou se o service_id mudou
  IF TG_OP = 'INSERT' OR 
     NEW.scheduled_end_time IS NULL OR 
     (TG_OP = 'UPDATE' AND OLD.service_id IS DISTINCT FROM NEW.service_id) THEN
    
    -- Buscar duração e buffer do serviço
    SELECT duration_minutes, COALESCE(buffer_time_minutes, 0)
    INTO service_duration, service_buffer
    FROM services
    WHERE id = NEW.service_id;
    
    -- Calcular horário de término
    NEW.scheduled_end_time := NEW.scheduled_time + 
      ((service_duration + service_buffer) * INTERVAL '1 minute');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_end_time
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_appointment_end_time();

-- =====================================================
-- TRIGGER: Atualizar estoque quando produto é usado
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id AND track_inventory = true;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products 
    SET current_stock = current_stock + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id AND track_inventory = true;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET current_stock = current_stock + OLD.quantity
    WHERE id = OLD.product_id AND track_inventory = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_product_inventory
  AFTER INSERT OR UPDATE OR DELETE ON appointment_products
  FOR EACH ROW EXECUTE FUNCTION update_product_inventory();

-- =====================================================
-- TRIGGER: Criar notificação de lembrete
-- =====================================================

CREATE OR REPLACE FUNCTION create_appointment_reminder_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação de lembrete para 24h antes
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO notifications (
      organization_id,
      customer_id,
      notification_type,
      channel,
      title,
      message,
      scheduled_for
    ) VALUES (
      NEW.organization_id,
      NEW.customer_id,
      'appointment_reminder',
      'whatsapp',
      'Lembrete de Agendamento',
      format('Olá! Lembramos que você tem um agendamento agendado para %s às %s.',
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

-- =====================================================
-- FUNCTION: Verificar disponibilidade de horários
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_organization_id UUID,
  p_employee_id UUID,
  p_service_id UUID,
  p_date DATE
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  service_duration INTEGER;
  day_name day_of_week;
  schedule_start TIME;
  schedule_end TIME;
  break_start TIME;
  break_end TIME;
  slot_interval INTEGER := 30; -- Intervalo de 30 minutos
  current_slot TIME;
BEGIN
  -- Buscar duração do serviço
  SELECT duration_minutes INTO service_duration
  FROM services WHERE id = p_service_id;
  
  -- Pegar o dia da semana
  day_name := CASE EXTRACT(DOW FROM p_date)
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END;
  
  -- Buscar horário de funcionamento
  SELECT s.start_time, s.end_time, s.break_start_time, s.break_end_time
  INTO schedule_start, schedule_end, break_start, break_end
  FROM schedules s
  WHERE s.organization_id = p_organization_id
    AND (s.employee_id = p_employee_id OR s.employee_id IS NULL)
    AND s.day_of_week = day_name
    AND s.is_active = true
  LIMIT 1;
  
  -- Verificar exceções
  IF EXISTS (
    SELECT 1 FROM schedule_exceptions
    WHERE organization_id = p_organization_id
      AND (employee_id = p_employee_id OR employee_id IS NULL)
      AND date = p_date
      AND is_available = false
  ) THEN
    RETURN; -- Dia não disponível
  END IF;
  
  -- Gerar slots de tempo
  current_slot := schedule_start;
  
  WHILE current_slot + (service_duration * INTERVAL '1 minute') <= schedule_end LOOP
    -- Verificar se não está no horário de intervalo
    IF break_start IS NULL OR 
       (current_slot < break_start OR current_slot >= break_end) THEN
      
      -- Verificar se não há conflito com agendamentos existentes
      RETURN QUERY
      SELECT 
        current_slot,
        current_slot + (service_duration * INTERVAL '1 minute'),
        NOT EXISTS (
          SELECT 1 FROM appointments
          WHERE employee_id = p_employee_id
            AND scheduled_date = p_date
            AND status NOT IN ('cancelled', 'no_show')
            AND (scheduled_time, scheduled_end_time) OVERLAPS 
                (current_slot, current_slot + (service_duration * INTERVAL '1 minute'))
        ) as is_available;
    END IF;
    
    current_slot := current_slot + (slot_interval * INTERVAL '1 minute');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Buscar próximos horários disponíveis
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_available_dates(
  p_organization_id UUID,
  p_employee_id UUID,
  p_service_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  available_slots INTEGER
) AS $$
DECLARE
  check_date DATE := CURRENT_DATE;
  final_date DATE := CURRENT_DATE + p_days_ahead;
BEGIN
  WHILE check_date <= final_date LOOP
    RETURN QUERY
    SELECT 
      check_date,
      COUNT(*)::INTEGER
    FROM get_available_time_slots(
      p_organization_id,
      p_employee_id,
      p_service_id,
      check_date
    )
    WHERE is_available = true
    GROUP BY check_date
    HAVING COUNT(*) > 0;
    
    check_date := check_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Dashboard de métricas
-- =====================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_organization_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE organization_id = p_organization_id
        AND scheduled_date BETWEEN p_start_date AND p_end_date
    ),
    'completed_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE organization_id = p_organization_id
        AND scheduled_date BETWEEN p_start_date AND p_end_date
        AND status = 'completed'
    ),
    'cancelled_appointments', (
      SELECT COUNT(*) 
      FROM appointments 
      WHERE organization_id = p_organization_id
        AND scheduled_date BETWEEN p_start_date AND p_end_date
        AND status = 'cancelled'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0)
      FROM payments
      WHERE organization_id = p_organization_id
        AND paid_at BETWEEN p_start_date AND p_end_date
        AND payment_status = 'paid'
    ),
    'new_customers', (
      SELECT COUNT(*)
      FROM customers
      WHERE organization_id = p_organization_id
        AND created_at::DATE BETWEEN p_start_date AND p_end_date
    ),
    'total_customers', (
      SELECT COUNT(*)
      FROM customers
      WHERE organization_id = p_organization_id
        AND is_active = true
    ),
    'average_rating', (
      SELECT ROUND(AVG(rating), 2)
      FROM reviews
      WHERE organization_id = p_organization_id
        AND created_at::DATE BETWEEN p_start_date AND p_end_date
    ),
    'top_services', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          s.name,
          COUNT(a.id) as bookings,
          SUM(a.total_amount) as revenue
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.organization_id = p_organization_id
          AND a.scheduled_date BETWEEN p_start_date AND p_end_date
          AND a.status = 'completed'
        GROUP BY s.id, s.name
        ORDER BY bookings DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIM DAS FUNCTIONS E TRIGGERS
-- =====================================================
