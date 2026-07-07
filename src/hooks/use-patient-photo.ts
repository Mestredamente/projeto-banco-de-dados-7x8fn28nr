import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from './use-auth'
import { useRealtime } from './use-realtime'

export function usePatientPhoto() {
  const { user } = useAuth()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)

  const loadPatient = async () => {
    if (!user) return
    try {
      const res = await pb.collection('patients').getFirstListItem(`profile="${user.id}"`)
      setPatientId(res.id)
      if (res.profile_photo) {
        setPhotoUrl(pb.files.getURL(res, res.profile_photo) + '?t=' + Date.now())
      } else {
        setPhotoUrl(null)
      }
    } catch {
      setPhotoUrl(null)
    }
  }

  useEffect(() => {
    loadPatient()
  }, [user])

  useRealtime(
    'patients',
    (e) => {
      if (patientId && e.record.id === patientId) {
        if (e.record.profile_photo) {
          setPhotoUrl(pb.files.getURL(e.record, e.record.profile_photo) + '?t=' + Date.now())
        } else {
          setPhotoUrl(null)
        }
      }
    },
    !!patientId,
  )

  return { photoUrl, patientId, reload: loadPatient }
}
