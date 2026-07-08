onRecordUpdateRequest((e) => {
  const authId = e.auth ? e.auth.id : ''
  if (!authId) {
    e.next()
    return
  }

  const userRole = e.auth.getString('role') || ''
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
