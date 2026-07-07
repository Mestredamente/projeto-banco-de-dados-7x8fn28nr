import { useEffect, useState, useCallback } from 'react'
import { usePatient } from '@/hooks/use-patient'
import { useRealtime } from '@/hooks/use-realtime'
import { DollarSign } from 'lucide-react'
import { FinancialSummaryCards } from '@/components/patient/FinancialSummaryCards'
import { FinancialBillingTable } from '@/components/patient/FinancialBillingTable'
import { PaymentConfirmModal } from '@/components/patient/PaymentConfirmModal'
import { getPatientFinancialRecords, confirmPayment } from '@/services/financial-records'
import { calculateDebtBalance } from '@/lib/financial-utils'

export default function PatientFinancial() {
  const { patient, loading } = usePatient()
  const [records, setRecords] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const loadRecords = useCallback(async () => {
    if (!patient) return
    try {
      const data = await getPatientFinancialRecords(patient.id)
      setRecords(data)
    } catch (err) {
      console.error('Failed to load financial records', err)
    }
  }, [patient])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useRealtime('financial_records', () => {
    loadRecords()
  })

  const debtBalance = calculateDebtBalance(records)

  const handlePay = (record: any) => {
    setSelectedRecord(record)
    setModalOpen(true)
  }

  const handleConfirm = async (recordId: string, method: string) => {
    await confirmPayment(recordId, method)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-400">Carregando...</div>
  }

  const acceptedMethods = Array.isArray(patient?.accepted_payment_methods)
    ? patient.accepted_payment_methods
    : []
  const pixKey = patient?.pix_key || ''

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeira</h1>
          <p className="text-gray-500">Acompanhe seus pagamentos e confirme cobranças.</p>
        </div>
      </div>

      <FinancialSummaryCards records={records} />

      <FinancialBillingTable records={records} debtBalance={debtBalance} onPay={handlePay} />

      <PaymentConfirmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        record={selectedRecord}
        acceptedMethods={acceptedMethods}
        pixKey={pixKey}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
