import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { PatientProfileCompletionBanner } from './PatientProfileCompletionBanner'
import { PatientOnboardingSimple } from '@/components/patient/PatientOnboardingSimple'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export function PatientPortalGuard() {
  const { user } = useAuth()
  const { activeProfile } = useProfile()
  const [patient, setPatient] = useState<any>(null)

  useEffect(() => {
    if (user && activeProfile?.id === 'paciente') {
      pb.collection('patients')
        .getFirstListItem(`profile="${user.id}"`)
        .then(setPatient)
        .catch(console.error)
    }
  }, [user, activeProfile])

  if (!user || activeProfile?.id !== 'paciente') {
    return <Navigate to="/" replace />
  }

  const needsConsent = patient && (!patient.consent_clinical_at || patient.first_access === true)

  return (
    <>
      {needsConsent && (
        <PatientOnboardingSimple patient={patient} onComplete={(updated) => setPatient(updated)} />
      )}
      {patient && patient.cadastro_completo === false && !needsConsent && (
        <PatientProfileCompletionBanner
          patientId={patient.id}
          onComplete={() => setPatient({ ...patient, cadastro_completo: true })}
        />
      )}
      <Outlet />
    </>
  )
}
