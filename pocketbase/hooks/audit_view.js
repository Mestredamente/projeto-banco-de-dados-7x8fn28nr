routerAdd(
  'POST',
  '/backend/v1/audit/view',
  (e) => {
    const body = e.requestInfo().body || {}
    const recordId = body.record_id
    const tableName = body.table_name

    if (!recordId || !tableName) return e.badRequestError('Missing record_id or table_name')

    const actorId = e.auth?.id || ''
    if (!actorId) return e.unauthorizedError('Auth required')

    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('actor', actorId)
      log.set('action', 'VIEW')
      log.set('table_name', tableName)
      log.set('record_id', recordId)
      log.set('ip_address', e.request.remoteAddr || '')
      log.set('user_agent', e.request.header.get('User-Agent') || '')
      $app.saveNoValidate(log)
    } catch (err) {
      $app.logger().error('Audit log VIEW failed', 'error', err?.message)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
