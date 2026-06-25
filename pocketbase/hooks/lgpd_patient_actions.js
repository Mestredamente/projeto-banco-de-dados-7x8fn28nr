routerAdd(
  'POST',
  '/backend/v1/patients/{id}/lgpd',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const type = body.type // 'anonymize' or 'delete'
    const actorId = e.auth?.id

    if (!actorId) return e.unauthorizedError('Auth required')

    let responseData = {}

    $app.runInTransaction((txApp) => {
      const patient = txApp.findRecordById('patients', id)

      // Pre-deletion Validation
      const pendingAppts = txApp.findRecordsByFilter(
        'appointments',
        `patient = '${id}' && (status = 'agendado' || status = 'confirmado_paciente')`,
        '',
        1,
      )
      const pendingFin = txApp.findRecordsByFilter(
        'financial_records',
        `patient = '${id}' && (status = 'pendente' || status = 'atrasado')`,
        '',
        1,
      )

      if (pendingAppts.length > 0 || pendingFin.length > 0) {
        throw new BadRequestError(
          'Paciente possui pendências financeiras ou agendamentos. Regularize antes de excluir.',
        )
      }

      const hash = $security
        .sha256(id + (patient.getString('cpf') || patient.getString('email') || ''))
        .substring(0, 16)

      if (type === 'anonymize') {
        patient.set('name', 'Paciente Anonimizado ' + hash)
        patient.set('email', '')
        patient.set('phone', '')
        patient.set('cpf', '')
        patient.set('rg', '')
        patient.set('address', '')
        patient.set('address_cep', '')
        patient.set('address_street', '')
        patient.set('address_number', '')
        patient.set('address_neighborhood', '')
        patient.set('address_city', '')
        patient.set('address_state', '')
        patient.set('emergency_contact_name', '')
        patient.set('emergency_contact_phone', '')
        patient.set('retention_extended_at', new Date().toISOString())

        txApp.save(patient)

        const auditLogs = txApp.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditLogs)
        log.set('actor', actorId)
        log.set('action', 'Exclusão LGPD - Anonimização')
        log.set('table_name', 'patients')
        log.set('record_id', hash)
        log.set('ip_address', e.request.remoteAddr || '')
        txApp.saveNoValidate(log)
      } else if (type === 'delete') {
        // Unlink financial_records and inventory_logs
        const updateCols = ['financial_records', 'inventory_logs']
        for (const col of updateCols) {
          const records = txApp.findRecordsByFilter(col, `patient = '${id}'`, '', 1000)
          for (const r of records) {
            if (col === 'financial_records') {
              const currentNotes = r.getString('notes') || ''
              r.set(
                'notes',
                currentNotes + (currentNotes ? '\n' : '') + `Paciente Anonimizado: ${hash}`,
              )
            }
            r.set('patient', '')
            txApp.saveNoValidate(r)
          }
        }

        // Hard delete related data
        const colsToDelete = [
          'clinical_insights',
          'session_notes',
          'diary_entries',
          'questionnaire_assignments',
          'patient_professionals',
          'appointments',
          'waitlist',
          'referrals',
          'room_reservations',
          'contracts',
          'messages',
          'notifications',
        ]

        for (const col of colsToDelete) {
          const records = txApp.findRecordsByFilter(col, `patient = '${id}'`, '', 1000)
          for (const r of records) {
            txApp.delete(r)
          }
        }

        // Delete patient
        txApp.delete(patient)

        const auditLogs = txApp.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditLogs)
        log.set('actor', actorId)
        log.set('action', 'Exclusão LGPD - Total')
        log.set('table_name', 'patients')
        log.set('record_id', hash)
        log.set('ip_address', e.request.remoteAddr || '')
        txApp.saveNoValidate(log)
      } else {
        throw new BadRequestError('Tipo de exclusão inválido.')
      }

      responseData = { success: true }
    })

    return e.json(200, responseData)
  },
  $apis.requireAuth(),
)
