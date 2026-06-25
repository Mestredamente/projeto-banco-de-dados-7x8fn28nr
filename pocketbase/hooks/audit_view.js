routerAdd(
  'POST',
  '/backend/v1/audit/view',
  (e) => {
    const body = e.requestInfo().body || {}
    const record_id = body.record_id
    const table_name = body.table_name || 'patients'
    const user = e.auth

    if (!user || !record_id) {
      return e.badRequestError('Missing user or record_id')
    }

    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const record = new Record(auditCol)

    record.set('actor', user.id)
    record.set('action', 'Visualizou prontuário')
    record.set('table_name', table_name)
    record.set('record_id', record_id)
    record.set('ip_address', e.request.remoteAddr || '')

    try {
      const patient = $app.findRecordById('patients', record_id)
      record.set('new_data', {
        patient_name: patient.getString('name'),
        actor_name: user.getString('name'),
      })
    } catch (err) {
      record.set('new_data', {
        actor_name: user.getString('name'),
      })
    }

    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
