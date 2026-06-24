import pb from '@/lib/pocketbase/client'

export const getResearchPatients = async () => {
  try {
    return await pb.collection('patients').getFullList({ filter: 'research_consent = true' })
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getPatientSessions = async (patientId: string) => {
  try {
    return await pb.collection('session_notes').getFullList({ filter: `patient = "${patientId}"` })
  } catch (error) {
    console.error(error)
    return []
  }
}

export const recordExport = async (type: string, count: number) => {
  try {
    if (pb.authStore.record) {
      await pb.collection('research_exports').create({
        user: pb.authStore.record.id,
        export_type: type,
        records_count: count,
      })
    }
  } catch (error) {
    console.error(error)
  }
}
