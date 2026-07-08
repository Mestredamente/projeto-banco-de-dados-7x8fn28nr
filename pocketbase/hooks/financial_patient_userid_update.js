onRecordUpdate((e) => {
  const patientId = e.record.getString('patient')
  const originalPatientId = e.record.original().getString('patient')

  if (patientId === originalPatientId) {
    e.next()
    return
  }

  if (!patientId) {
    e.record.set('patient_user_id', '')
    e.next()
    return
  }

  try {
    const patient = $app.findRecordById('patients', patientId)
    const profileId = patient.getString('profile')
    if (profileId) {
      e.record.set('patient_user_id', profileId)
    }
  } catch (err) {}

  e.next()
}, 'financial_records')
