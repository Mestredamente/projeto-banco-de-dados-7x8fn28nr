import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { PatientLGPDModal } from './PatientLGPDModal'
import { Spinner } from '@/components/system/Spinner'

export function PatientPortalGuard() {
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'paciente') {
      pb.collection('patients')
        .getFirstListItem(`profile="${user.id}"`)
        .then(setPatient)
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // Only apply overlay logic to patients
  if (user?.role !== 'paciente') {
    return <Outlet />
  }

  const needsConsent =
    patient && (patient.primeiro_acesso_portal !== false || !patient.consent_clinical_at)

  return (
    <>
      {needsConsent && <PatientLGPDModal patient={patient} onComplete={setPatient} />}
      <div className={needsConsent ? 'pointer-events-none opacity-30 blur-sm' : ''}>
        <Outlet />
      </div>
    </>
  )
}
