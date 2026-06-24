onRecordAfterUpdateSuccess((e) => {
  try {
    const auth = e.requestInfo().auth
    if (!auth) return e.next()

    const oldData = {}
    const newData = {}
    const orig = e.record.original()

    for (const field of e.collection.fields) {
      const name = field.name
      const oldVal = orig.get(name)
      const newVal = e.record.get(name)
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        oldData[name] = oldVal
        newData[name] = newVal
      }
    }

    if (Object.keys(newData).length > 0) {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const record = new Record(auditCol)
      record.set('actor', auth.id)
      record.set('action', 'UPDATE')
      record.set('table_name', e.collection.name)
      record.set('record_id', e.record.id)
      record.set('old_data', oldData)
      record.set('new_data', newData)
      record.set('ip_address', e.requestInfo().remoteAddr || '')
      record.set('user_agent', e.requestInfo().headers['user_agent'] || '')
      $app.save(record)
    }
  } catch (err) {
    console.log('Audit log error:', err.message)
  }
  return e.next()
}, 'patients')
