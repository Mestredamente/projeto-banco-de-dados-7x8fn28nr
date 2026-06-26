onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  if (
    record.getString('status') === 'utilizado' &&
    record.original().getString('status') !== 'utilizado'
  ) {
    const patientId = record.getString('patient')
    if (patientId) {
      try {
        const patient = $app.findRecordById('patients', patientId)
        patient.set('status_convite', 'aceito')
        $app.save(patient)
      } catch (err) {
        $app.logger().error('Failed to update patient status_convite', 'error', err.message)
      }
    }
  }
  e.next()
}, 'convites_paciente')
