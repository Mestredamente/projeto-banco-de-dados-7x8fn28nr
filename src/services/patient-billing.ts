import { z } from 'zod'
import pb from '@/lib/pocketbase/client'

export const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Débito', 'Crédito'] as const
export const NOTIFICATION_CHANNELS = ['Email', 'SMS', 'Push'] as const

export const billingPreferencesSchema = z
  .object({
    session_value: z.number().min(0).optional(),
    accepted_payment_methods: z.array(z.string()).optional(),
    pix_key: z.string().optional(),
    absence_policy: z.enum(['cobra_falta', 'nao_cobra_falta']).optional(),
    billing_notifications: z.array(z.string()).optional(),
    auto_billing_enabled: z.boolean().optional(),
    billing_frequency: z.enum(['avulsa', 'semanal', 'quinzenal', 'mensal']).optional(),
    billing_day: z.number().min(1).max(31).optional(),
    sessions_per_period: z.number().min(1).max(5).optional(),
    billing_start_date: z.string().optional(),
    cancellation_policy: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.auto_billing_enabled) {
        return !!data.billing_frequency && data.billing_day != null
      }
      return true
    },
    {
      message:
        'Frequência e dia de cobrança são obrigatórios quando o faturamento automático está ativado',
      path: ['billing_frequency'],
    },
  )

export type BillingPreferences = z.infer<typeof billingPreferencesSchema>

export const getPatientBillingPreferences = async (
  patientId: string,
): Promise<Partial<BillingPreferences>> => {
  const patient = await pb.collection('patients').getOne(patientId)
  return {
    session_value: patient.session_value,
    accepted_payment_methods: patient.accepted_payment_methods,
    pix_key: patient.pix_key,
    absence_policy: patient.absence_policy,
    billing_notifications: patient.billing_notifications,
    auto_billing_enabled: patient.auto_billing_enabled,
    billing_frequency: patient.billing_frequency,
    billing_day: patient.billing_day,
    sessions_per_period: patient.sessions_per_period,
    billing_start_date: patient.billing_start_date,
    cancellation_policy: patient.cancellation_policy,
  }
}

export const updatePatientBillingPreferences = async (
  patientId: string,
  data: Partial<BillingPreferences>,
) => {
  return await pb.collection('patients').update(patientId, data)
}

export const generateBillingSchedule = async (patientId: string) => {
  return pb.send('/backend/v1/billing/generate-schedule', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId }),
    headers: { 'Content-Type': 'application/json' },
  })
}
