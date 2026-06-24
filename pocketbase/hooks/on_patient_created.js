onRecordAfterCreateSuccess((e) => {
  try {
    const patientId = e.record.id
    const professionalId = e.record.getString('created_by') || e.requestInfo().auth?.id

    if (professionalId) {
      const cpRecords = $app.findRecordsByFilter(
        'clinic_professionals',
        `professional = '${professionalId}' && is_active = true && deleted_at = ''`,
        '',
        1,
        0,
      )

      let clinicId = null
      if (cpRecords.length > 0) {
        if (cpRecords[0].getString('relationship_model') === 'contratacao') {
          clinicId = cpRecords[0].getString('clinic')
        }
      }

      const ppCol = $app.findCollectionByNameOrId('patient_professionals')
      const ppRecord = new Record(ppCol)
      ppRecord.set('patient', patientId)
      ppRecord.set('professional', professionalId)
      if (clinicId) ppRecord.set('clinic', clinicId)
      ppRecord.set('is_primary', true)
      ppRecord.set('is_active', true)
      ppRecord.set('started_at', new Date().toISOString())
      $app.save(ppRecord)
    }
  } catch (err) {
    console.log('Hook on_patient_created error:', err.message)
  }
  return e.next()
}, 'patients')
