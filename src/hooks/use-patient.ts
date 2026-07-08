import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from './use-auth'
import { useRealtime } from './use-realtime'

export function usePatient() {
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadPatient = useCallback(async () => {
    if (user?.role === 'paciente') {
      try {
        const record = await pb.collection('patients').getFirstListItem(`profile="${user.id}"`)
        setPatient(record)
      } catch (err) {
        console.error('Failed to load patient profile', err)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadPatient()
  }, [loadPatient])

  useRealtime(
    'patients',
    (e) => {
      if (patient && e.record.id === patient.id) {
        setPatient(e.record)
      }
    },
    !!patient,
  )

  return { patient, loading, reload: loadPatient }
}
