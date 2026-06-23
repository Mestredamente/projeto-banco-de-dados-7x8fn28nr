onRecordCreateRequest(
  (e) => {
    e.next()
    try {
      const actorId = e.auth?.id || ''
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('actor', actorId)
      log.set('action', 'INSERT')
      log.set('table_name', e.collection.name)
      log.set('record_id', e.record.id)
      log.set('old_data', null)
      log.set('new_data', e.record.publicExport())
      log.set('ip_address', e.request.remoteAddr || '')
      log.set('user_agent', e.request.header.get('User-Agent') || '')
      $app.saveNoValidate(log)
    } catch (err) {
      $app.logger().error('Audit log INSERT failed', 'error', err?.message)
    }
  },
  'patients',
  'appointments',
  'financial_records',
  'clinic_professionals',
  'contracts',
)

onRecordUpdateRequest(
  (e) => {
    let oldData = null
    try {
      oldData = e.record.original().publicExport()
    } catch (_) {}
    e.next()
    try {
      const actorId = e.auth?.id || ''
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('actor', actorId)
      log.set('action', 'UPDATE')
      log.set('table_name', e.collection.name)
      log.set('record_id', e.record.id)
      log.set('old_data', oldData)
      log.set('new_data', e.record.publicExport())
      log.set('ip_address', e.request.remoteAddr || '')
      log.set('user_agent', e.request.header.get('User-Agent') || '')
      $app.saveNoValidate(log)
    } catch (err) {
      $app.logger().error('Audit log UPDATE failed', 'error', err?.message)
    }
  },
  'patients',
  'appointments',
  'financial_records',
  'clinic_professionals',
  'contracts',
)

onRecordDeleteRequest(
  (e) => {
    let oldData = null
    try {
      oldData = e.record.publicExport()
    } catch (_) {}
    e.next()
    try {
      const actorId = e.auth?.id || ''
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('actor', actorId)
      log.set('action', 'DELETE')
      log.set('table_name', e.collection.name)
      log.set('record_id', e.record.id)
      log.set('old_data', oldData)
      log.set('new_data', null)
      log.set('ip_address', e.request.remoteAddr || '')
      log.set('user_agent', e.request.header.get('User-Agent') || '')
      $app.saveNoValidate(log)
    } catch (err) {
      $app.logger().error('Audit log DELETE failed', 'error', err?.message)
    }
  },
  'patients',
  'appointments',
  'financial_records',
  'clinic_professionals',
  'contracts',
)
