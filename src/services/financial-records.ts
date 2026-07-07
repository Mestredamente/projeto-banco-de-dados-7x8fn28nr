import pb from '@/lib/pocketbase/client'

export const getPatientFinancialRecords = (patientId: string) =>
  pb.collection('financial_records').getFullList({
    filter: `patient="${patientId}"`,
    sort: '-due_date',
  })

export const confirmPayment = (recordId: string, paymentMethod: string) =>
  pb.collection('financial_records').update(recordId, {
    status: 'aguardando_confirmacao',
    payment_method: paymentMethod,
  })
