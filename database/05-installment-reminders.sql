-- Installments: gateway refs + reminder tracking
ALTER TABLE public.installment_payments
  ADD COLUMN IF NOT EXISTS gateway_order_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_txn_id TEXT,
  ADD COLUMN IF NOT EXISTS due_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overdue_notice_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_installment_payments_status_due_date
  ON public.installment_payments (status, due_date);

CREATE INDEX IF NOT EXISTS idx_installment_payments_order_status
  ON public.installment_payments (order_id, status);
