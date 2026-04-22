# Diagrama Entidade-Relacionamento (ER)

## Estrutura Completa do Banco de Dados

```mermaid
erDiagram
    organizations ||--o{ users : "tem"
    organizations ||--o{ customers : "tem"
    organizations ||--o{ services : "oferece"
    organizations ||--o{ products : "vende"
    organizations ||--o{ schedules : "tem"
    organizations ||--o{ schedule_exceptions : "tem"
    organizations ||--o{ appointments : "gerencia"
    organizations ||--o{ payments : "recebe"
    organizations ||--o{ notifications : "envia"
    organizations ||--o{ audit_logs : "registra"
    organizations ||--o{ reviews : "recebe"
    
    users ||--o{ appointments : "atende"
    users ||--o{ schedules : "trabalha"
    users ||--o{ schedule_exceptions : "tem"
    users ||--o{ reviews : "recebe"
    
    customers ||--o{ appointments : "agenda"
    customers ||--o{ payments : "realiza"
    customers ||--o{ notifications : "recebe"
    customers ||--o{ reviews : "escreve"
    customers }o--|| users : "prefere"
    
    services ||--o{ appointments : "é_agendado"
    
    appointments ||--|{ appointment_products : "usa"
    appointments ||--o| payments : "gera"
    appointments ||--o{ notifications : "dispara"
    
    products ||--o{ appointment_products : "é_usado_em"
    
    organizations {
        UUID id PK
        VARCHAR name
        VARCHAR slug UK
        business_type business_type
        VARCHAR email
        VARCHAR phone
        BOOLEAN whatsapp_enabled
        VARCHAR subscription_plan
        JSONB settings
        TIMESTAMP created_at
    }
    
    users {
        UUID id PK
        UUID organization_id FK
        UUID auth_user_id UK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email
        user_role role
        BOOLEAN is_active
        BOOLEAN is_available
        TEXT[] specialties
        DECIMAL commission_rate
    }
    
    customers {
        UUID id PK
        UUID organization_id FK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email
        VARCHAR phone UK
        DATE date_of_birth
        UUID preferred_employee_id FK
        INTEGER total_appointments
        DECIMAL total_spent
        BOOLEAN is_vip
        TIMESTAMP created_at
    }
    
    services {
        UUID id PK
        UUID organization_id FK
        VARCHAR name
        VARCHAR category
        INTEGER duration_minutes
        DECIMAL price
        INTEGER buffer_time_minutes
        BOOLEAN is_active
        UUID[] available_for_employees
    }
    
    products {
        UUID id PK
        UUID organization_id FK
        VARCHAR name
        VARCHAR category
        VARCHAR sku
        DECIMAL cost_price
        DECIMAL sale_price
        BOOLEAN track_inventory
        INTEGER current_stock
    }
    
    schedules {
        UUID id PK
        UUID organization_id FK
        UUID employee_id FK
        day_of_week day_of_week
        TIME start_time
        TIME end_time
        TIME break_start_time
        TIME break_end_time
        BOOLEAN is_active
    }
    
    schedule_exceptions {
        UUID id PK
        UUID organization_id FK
        UUID employee_id FK
        DATE date
        BOOLEAN is_available
        VARCHAR reason
        TIME start_time
        TIME end_time
    }
    
    appointments {
        UUID id PK
        UUID organization_id FK
        UUID customer_id FK
        UUID employee_id FK
        UUID service_id FK
        DATE scheduled_date
        TIME scheduled_time
        TIME scheduled_end_time
        appointment_status status
        DECIMAL service_price
        DECIMAL total_amount
        TEXT customer_notes
        TIMESTAMP created_at
    }
    
    appointment_products {
        UUID id PK
        UUID appointment_id FK
        UUID product_id FK
        INTEGER quantity
        DECIMAL unit_price
        DECIMAL total_price
    }
    
    payments {
        UUID id PK
        UUID organization_id FK
        UUID appointment_id FK
        UUID customer_id FK
        DECIMAL amount
        payment_method payment_method
        payment_status payment_status
        TIMESTAMP paid_at
        VARCHAR transaction_id
    }
    
    notifications {
        UUID id PK
        UUID organization_id FK
        UUID customer_id FK
        notification_type notification_type
        notification_channel channel
        TEXT message
        notification_status status
        TIMESTAMP scheduled_for
        TIMESTAMP sent_at
    }
    
    audit_logs {
        UUID id PK
        UUID organization_id FK
        UUID user_id FK
        VARCHAR action
        VARCHAR entity_type
        UUID entity_id
        JSONB old_values
        JSONB new_values
        TIMESTAMP created_at
    }
    
    reviews {
        UUID id PK
        UUID organization_id FK
        UUID customer_id FK
        UUID employee_id FK
        UUID appointment_id FK
        INTEGER rating
        TEXT comment
        BOOLEAN is_visible
        TEXT response
        TIMESTAMP created_at
    }
```

## Relacionamentos Principais

### 1. Multi-Tenancy
- Todas as tabelas principais têm `organization_id`
- RLS garante isolamento de dados

### 2. Agendamento
```
customer → appointment ← employee
           ↓
         service
           ↓
      appointment_products ← product
```

### 3. Pagamento
```
appointment → payment ← customer
```

### 4. Notificações
```
appointment → notification → customer
```

### 5. Horários
```
organization → schedules ← employee
organization → schedule_exceptions ← employee
```

## ENUMs Utilizados

### business_type
- beauty_salon
- barber_shop
- spa
- clinic
- gym
- studio
- other

### appointment_status
- pending
- confirmed
- in_progress
- completed
- cancelled
- no_show

### payment_status
- pending
- paid
- partially_paid
- refunded
- cancelled

### payment_method
- cash
- credit_card
- debit_card
- pix
- bank_transfer
- other

### notification_type
- appointment_created
- appointment_confirmed
- appointment_reminder
- appointment_cancelled
- payment_received
- birthday
- promotional
- system

### notification_channel
- email
- sms
- whatsapp
- push

### user_role
- super_admin
- owner
- manager
- employee
- receptionist

### day_of_week
- monday
- tuesday
- wednesday
- thursday
- friday
- saturday
- sunday

## Índices Importantes

### Performance
- `idx_appointments_scheduled_datetime` - Buscar agendamentos por data/hora
- `idx_customers_phone` - Buscar clientes por telefone
- `idx_appointments_organization_id` - Filtrar por organização

### Multi-Tenancy
- Todos os `organization_id` têm índice
- RLS usa esses índices para performance

### Busca
- `idx_customers_tags` (GIN) - Busca por tags
- Índices em `email`, `phone`, `cpf`

## Views

### customer_statistics
Estatísticas agregadas por cliente:
- Total de agendamentos
- Agendamentos completos/cancelados
- Total gasto
- Avaliação média

### daily_appointments
Dashboard de agendamentos do dia:
- Informações completas
- Nome do cliente
- Nome do funcionário
- Serviço
- Status

## Triggers Ativos

1. **update_updated_at_column** - Atualiza `updated_at` automaticamente
2. **create_audit_log** - Cria logs de auditoria
3. **update_customer_statistics** - Atualiza estatísticas do cliente
4. **validate_appointment_availability** - Valida conflitos de horário
5. **calculate_appointment_end_time** - Calcula horário de término
6. **update_product_inventory** - Atualiza estoque automaticamente
7. **create_appointment_reminder_notification** - Cria lembretes automáticos

## Functions Úteis

### get_available_time_slots
Retorna horários disponíveis para agendamento.

**Parâmetros:**
- organization_id
- employee_id
- service_id
- date

**Retorna:** Lista de slots com disponibilidade

### get_next_available_dates
Busca próximas datas disponíveis.

**Parâmetros:**
- organization_id
- employee_id
- service_id
- days_ahead (padrão: 30)

**Retorna:** Datas com número de slots disponíveis

### get_dashboard_metrics
Retorna métricas do dashboard.

**Parâmetros:**
- organization_id
- start_date
- end_date

**Retorna:** JSON com métricas agregadas
