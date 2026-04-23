-- Tornar customer_id opcional para permitir transações manuais sem cliente
ALTER TABLE payments 
ALTER COLUMN customer_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN payments.customer_id IS 'Cliente associado ao pagamento. NULL para transações administrativas/manuais sem cliente específico.';
