onRecordUpdateRequest((e) => {
  const authId = e.auth ? e.auth.id : ''
  if (!authId) {
    e.next()
    return
  }

  const userRole = e.auth.getString('role') || ''

  if (userRole === 'paciente') {
    let existingRecord
    try {
      existingRecord = $app.findRecordById('financial_records', e.record.id)
    } catch (err) {
      e.next()
      return
    }

    const patientId = existingRecord.getString('patient')
    if (!patientId) {
      return e.forbiddenError('Financial record has no associated patient.')
    }

    let patientProfile = ''
    try {
      const patient = $app.findRecordById('patients', patientId)
      patientProfile = patient.getString('profile')
    } catch (err) {
      return e.forbiddenError('Unable to verify patient ownership for this financial record.')
    }

    if (patientProfile !== authId) {
      return e.forbiddenError(
        'You can only modify your own financial records. This record belongs to another patient.',
      )
    }

    const body = e.requestInfo().body || {}
    var allowedFields = ['status', 'payment_method']
    var bodyKeys = Object.keys(body)
    for (var i = 0; i < bodyKeys.length; i++) {
      if (allowedFields.indexOf(bodyKeys[i]) === -1) {
        return e.forbiddenError(
          'Patients can only update payment status and payment method fields.',
        )
      }
    }

    if (body.status && body.status !== 'aguardando_confirmacao') {
      return e.forbiddenError('Patients can only mark payments as awaiting confirmation.')
    }

    e.next()
    return
  }

  if (userRole !== 'psicologo_autonomo' && userRole !== 'psicologo_vinculado') {
    e.next()
    return
  }

  let originalProfessional = ''
  try {
    const existing = $app.findRecordById('financial_records', e.record.id)
    originalProfessional = existing.getString('professional')
  } catch (err) {
    e.next()
    return
  }

  if (originalProfessional !== authId) {
    return e.forbiddenError(
      'You can only modify your own financial records. This record belongs to another professional.',
    )
  }

  const body = e.requestInfo().body || {}
  if (body.professional && body.professional !== authId) {
    return e.forbiddenError('You cannot reassign financial records to another professional.')
  }

  e.next()
}, 'financial_records')
