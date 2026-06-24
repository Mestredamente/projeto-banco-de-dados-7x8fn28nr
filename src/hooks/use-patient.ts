import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from './use-auth'

export function usePatient() {
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'paciente') {
      pb.collection('patients')
        .getFirstListItem(`profile="${user.id}"`)
        .then(setPatient)
        .catch((err) => {
          console.error('Failed to load patient profile', err)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  return { patient, loading }
}
