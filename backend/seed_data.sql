-- =====================================================
-- SEED DATA - Dados de Exemplo
-- Para desenvolvimento e testes
-- =====================================================

-- =====================================================
-- 1. Criar Organização de Exemplo
-- =====================================================

INSERT INTO organizations (
  id,
  name,
  slug,
  business_type,
  description,
  email,
  phone,
  address_street,
  address_number,
  address_city,
  address_state,
  address_zip_code,
  whatsapp_enabled,
  whatsapp_phone,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Tiago Forman - Estética Masculina',
  'tiagoforman',
  'barber_shop',
  'Barbearia e estética masculina de qualidade',
  'contato@tiagoforman.com.br',
  '+5534888568529',
  'Rua Principal',
  '123',
  'Uberlândia',
  'MG',
  '38400-000',
  true,
  '+5534888568529',
  true
);

-- =====================================================
-- 2. Criar Usuários (Funcionários)
-- =====================================================

-- Owner/Gerente - Tiago
INSERT INTO users (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  role,
  is_active,
  is_available,
  specialties,
  commission_rate
) VALUES (
  '22222222-2222-2222-2222-222222222222'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Tiago',
  'Forman',
  'tiago@tiagoforman.com.br',
  '+5534888568529',
  'owner',
  true,
  true,
  ARRAY['Corte Masculino', 'Barba', 'Pigmentação'],
  30.00
);

-- Barbeiro 1
INSERT INTO users (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  role,
  is_active,
  is_available,
  specialties,
  commission_rate
) VALUES (
  '33333333-3333-3333-3333-333333333333'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'João',
  'Silva',
  'joao@tiagoforman.com.br',
  '+5534999999991',
  'employee',
  true,
  true,
  ARRAY['Corte Masculino', 'Barba'],
  25.00
);

-- Recepcionista
INSERT INTO users (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  role,
  is_active,
  is_available,
  specialties
) VALUES (
  '44444444-4444-4444-4444-444444444444'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Maria',
  'Santos',
  'maria@tiagoforman.com.br',
  '+5534999999992',
  'receptionist',
  true,
  false,
  ARRAY[]::TEXT[]
);

-- =====================================================
-- 3. Criar Serviços
-- =====================================================

INSERT INTO services (
  id,
  organization_id,
  name,
  description,
  category,
  duration_minutes,
  price,
  buffer_time_minutes,
  is_active,
  is_featured,
  available_for_employees
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Corte Masculino',
    'Corte de cabelo masculino tradicional',
    'Cortes',
    45,
    60.00,
    15,
    true,
    true,
    ARRAY[
      '22222222-2222-2222-2222-222222222222'::UUID,
      '33333333-3333-3333-3333-333333333333'::UUID
    ]
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Barba',
    'Barba feita com navalha e acabamento',
    'Barba',
    30,
    40.00,
    10,
    true,
    true,
    ARRAY[
      '22222222-2222-2222-2222-222222222222'::UUID,
      '33333333-3333-3333-3333-333333333333'::UUID
    ]
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Corte + Barba',
    'Combo completo: corte e barba',
    'Combos',
    75,
    85.00,
    15,
    true,
    true,
    ARRAY[
      '22222222-2222-2222-2222-222222222222'::UUID,
      '33333333-3333-3333-3333-333333333333'::UUID
    ]
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Pigmentação',
    'Pigmentação de barba e cabelo',
    'Cor',
    60,
    120.00,
    20,
    true,
    false,
    ARRAY['22222222-2222-2222-2222-222222222222'::UUID]
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Sobrancelha',
    'Design e modelagem de sobrancelha masculina',
    'Estética',
    20,
    25.00,
    5,
    true,
    false,
    ARRAY[
      '22222222-2222-2222-2222-222222222222'::UUID,
      '33333333-3333-3333-3333-333333333333'::UUID
    ]
  );

-- =====================================================
-- 4. Criar Produtos
-- =====================================================

INSERT INTO products (
  id,
  organization_id,
  name,
  description,
  category,
  brand,
  cost_price,
  sale_price,
  track_inventory,
  current_stock,
  min_stock_alert,
  is_active
) VALUES
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Pomada Modeladora',
    'Pomada para modelagem de cabelo',
    'Finalizadores',
    'American Crew',
    35.00,
    75.00,
    true,
    25,
    5,
    true
  ),
  (
    '11111111-ffff-ffff-ffff-ffffffffffff'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Óleo para Barba',
    'Óleo hidratante para barba',
    'Barba',
    'Beard Club',
    25.00,
    60.00,
    true,
    30,
    5,
    true
  ),
  (
    '22222222-ffff-ffff-ffff-ffffffffffff'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Shampoo Masculino',
    'Shampoo para cabelos masculinos',
    'Higiene',
    'Redken',
    40.00,
    90.00,
    true,
    20,
    5,
    true
  );

-- =====================================================
-- 5. Criar Horários de Funcionamento
-- =====================================================

-- Horário padrão da barbearia (Segunda a Sexta)
INSERT INTO schedules (
  organization_id,
  employee_id,
  day_of_week,
  start_time,
  end_time,
  break_start_time,
  break_end_time,
  is_active
) VALUES
  -- Tiago - Segunda a Sexta
  ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'monday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'tuesday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'wednesday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'thursday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'friday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'saturday', '09:00', '17:00', NULL, NULL, true),
  
  -- João - Segunda a Sábado
  ('11111111-1111-1111-1111-111111111111'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'monday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'tuesday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'wednesday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'thursday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'friday', '09:00', '19:00', '12:00', '13:00', true),
  ('11111111-1111-1111-1111-111111111111'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'saturday', '09:00', '17:00', NULL, NULL, true);

-- =====================================================
-- 6. Criar Clientes de Exemplo
-- =====================================================

INSERT INTO customers (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  gender,
  preferred_employee_id,
  accepts_marketing,
  is_active,
  whatsapp_number
) VALUES
  (
    '55555555-5555-5555-5555-555555555555'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Carlos',
    'Oliveira',
    'carlos@email.com',
    '+5534991111111',
    '1985-03-15',
    'Masculino',
    '22222222-2222-2222-2222-222222222222'::UUID,
    true,
    true,
    '+5534991111111'
  ),
  (
    '66666666-6666-6666-6666-666666666666'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Pedro',
    'Souza',
    'pedro@email.com',
    '+5534992222222',
    '1990-07-20',
    'Masculino',
    '33333333-3333-3333-3333-333333333333'::UUID,
    true,
    true,
    '+5534992222222'
  ),
  (
    '77777777-7777-7777-7777-777777777777'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    'Lucas',
    'Fernandes',
    'lucas@email.com',
    '+5534993333333',
    '1988-11-10',
    'Masculino',
    NULL,
    true,
    true,
    '+5534993333333'
  );

-- =====================================================
-- 7. Criar Agendamentos de Exemplo
-- =====================================================

-- Agendamento para amanhã
INSERT INTO appointments (
  id,
  organization_id,
  customer_id,
  employee_id,
  service_id,
  scheduled_date,
  scheduled_time,
  scheduled_end_time,
  status,
  service_price,
  total_amount,
  customer_notes
) VALUES
  (
    '88888888-8888-8888-8888-888888888888'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    '55555555-5555-5555-5555-555555555555'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    CURRENT_DATE + INTERVAL '1 day',
    '10:00',
    '11:00',
    'confirmed',
    60.00,
    60.00,
    'Cliente prefere corte social'
  ),
  (
    '99999999-9999-9999-9999-999999999999'::UUID,
    '11111111-1111-1111-1111-111111111111'::UUID,
    '66666666-6666-6666-6666-666666666666'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID,
    CURRENT_DATE + INTERVAL '1 day',
    '14:00',
    '15:30',
    'confirmed',
    85.00,
    85.00,
    NULL
  );

-- =====================================================
-- 8. Criar Pagamentos
-- =====================================================

INSERT INTO payments (
  organization_id,
  appointment_id,
  customer_id,
  amount,
  payment_method,
  payment_status,
  paid_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111'::UUID,
    '88888888-8888-8888-8888-888888888888'::UUID,
    '55555555-5555-5555-5555-555555555555'::UUID,
    60.00,
    'pix',
    'paid',
    CURRENT_TIMESTAMP
  );

-- =====================================================
-- 9. Criar Avaliações
-- =====================================================

INSERT INTO reviews (
  organization_id,
  customer_id,
  employee_id,
  rating,
  comment,
  is_visible
) VALUES
  (
    '11111111-1111-1111-1111-111111111111'::UUID,
    '55555555-5555-5555-5555-555555555555'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    5,
    'Excelente profissional! Muito atencioso e cortou exatamente como eu queria.',
    true
  ),
  (
    '11111111-1111-1111-1111-111111111111'::UUID,
    '66666666-6666-6666-6666-666666666666'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    5,
    'Melhor barbearia da cidade! Ambiente profissional e serviço de qualidade.',
    true
  );

-- =====================================================
-- FIM DOS DADOS DE EXEMPLO
-- =====================================================
