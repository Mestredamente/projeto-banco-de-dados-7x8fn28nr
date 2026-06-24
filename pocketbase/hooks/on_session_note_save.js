onRecordCreateRequest((e) => {
  const patient = e.record.getString('patient')
  if (!patient) throw new BadRequestError('Paciente é obrigatório.')

  if (!e.record.getInt('session_number')) {
    const records = $app.findRecordsByFilter(
      'session_notes',
      `patient = '${patient}'`,
      '-session_number',
      1,
      0,
    )
    const lastNum = records.length > 0 ? records[0].getInt('session_number') : 0
    e.record.set('session_number', lastNum + 1)
  }
  if (!e.record.getString('status')) {
    e.record.set('status', 'rascunho')
  }

  if (!e.record.getString('session_date')) {
    e.record.set('session_date', new Date().toISOString())
  }

  if (e.record.getString('status') === 'finalizado' && !e.record.getString('integrity_hash')) {
    const content = e.record.getString('content') || ''
    const hash = $security.sha256(content + new Date().toISOString())
    e.record.set('integrity_hash', hash)
  }

  e.next()
}, 'session_notes')

onRecordUpdateRequest((e) => {
  const oldStatus = e.record.original().getString('status')
  if (oldStatus === 'finalizado') {
    const contentChanged =
      e.record.getString('content') !== e.record.original().getString('content')
    const typeChanged =
      e.record.getString('evolution_type') !== e.record.original().getString('evolution_type')
    const dateChanged =
      e.record.getString('session_date') !== e.record.original().getString('session_date')

    if (contentChanged || typeChanged || dateChanged) {
      throw new BadRequestError(
        'Não é permitido alterar o conteúdo, tipo ou data de uma evolução finalizada.',
      )
    }
  } else if (
    e.record.getString('status') === 'finalizado' &&
    !e.record.getString('integrity_hash')
  ) {
    const content = e.record.getString('content') || ''
    const hash = $security.sha256(content + e.record.getString('updated'))
    e.record.set('integrity_hash', hash)
  }

  e.next()
}, 'session_notes')
