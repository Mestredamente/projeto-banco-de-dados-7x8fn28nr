import pb from '@/lib/pocketbase/client'

export interface FinancialFilterOptions {
  professionalId: string
  clinicId: string
  isAdminRole?: boolean
}

export const buildFinancialFilter = (opts: FinancialFilterOptions): string => {
  const { professionalId, clinicId, isAdminRole } = opts
  if (isAdminRole) {
    if (!clinicId) return 'id = ""'
    return `clinic="${clinicId}"`
  }
  if (!professionalId || !clinicId) return 'id = ""'
  return `professional="${professionalId}" && clinic="${clinicId}"`
}

export const getFinancialRecords = (opts: FinancialFilterOptions) => {
  const filter = buildFinancialFilter(opts)
  return pb.collection('financial_records').getFullList({
    filter,
    sort: '-created',
    expand: 'patient',
  })
}

export const getPatientFinancialRecords = (patientId: string, opts?: FinancialFilterOptions) => {
  const filters = [`patient="${patientId}"`]
  if (opts) {
    const f = buildFinancialFilter(opts)
    if (f && f !== 'id = ""') filters.push(f)
  }
  return pb.collection('financial_records').getFullList({
    filter: filters.join(' && '),
    sort: '-due_date',
  })
}

export const confirmPayment = (recordId: string, paymentMethod: string) =>
  pb.collection('financial_records').update(recordId, {
    status: 'aguardando_confirmacao',
    payment_method: paymentMethod,
  })

export const confirmPaymentByPsychologist = (recordId: string) =>
  pb.send('/backend/v1/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ record_id: recordId }),
    headers: { 'Content-Type': 'application/json' },
  })
