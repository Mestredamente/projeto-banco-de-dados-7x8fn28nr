import pb from '@/lib/pocketbase/client'

export interface ConfirmPaymentResult {
  success: boolean
  notification_sent: boolean
}

export const confirmPaymentByPsychologist = async (
  recordId: string,
): Promise<ConfirmPaymentResult> => {
  return pb.send('/backend/v1/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ record_id: recordId }),
    headers: { 'Content-Type': 'application/json' },
  })
}
