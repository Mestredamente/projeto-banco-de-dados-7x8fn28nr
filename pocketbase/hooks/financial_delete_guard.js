onRecordDeleteRequest((e) => {
  const authId = e.auth ? e.auth.id : ''
  if (!authId) {
    e.next()
    return
  }

  const userRole = e.auth.getString('role') || ''

  if (userRole === 'paciente') {
    return e.forbiddenError(
      'Patients cannot delete financial records. Please contact your psychologist or clinic administrator.',
    )
  }

  if (userRole !== 'psicologo_autonomo' && userRole !== 'psicologo_vinculado') {
    e.next()
    return
  }

  const recordProfessional = e.record.getString('professional')
  if (recordProfessional !== authId) {
    return e.forbiddenError(
      'You can only delete your own financial records. This record belongs to another professional.',
    )
  }

  e.next()
}, 'financial_records')
