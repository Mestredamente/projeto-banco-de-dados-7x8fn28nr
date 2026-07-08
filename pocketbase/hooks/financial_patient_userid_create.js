onRecordCreate((e) => {
  const patientId = e.record.getString('patient')
  if (!patientId) {
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
