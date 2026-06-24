onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  if (record.getInt('progress') >= 100 && !record.getString('completed_at')) {
    const freshRecord = $app.findRecordById('academy_enrollments', record.id)
    freshRecord.set('completed_at', new Date().toISOString())
    freshRecord.set('certificate_hash', $security.randomString(16).toUpperCase())
    $app.saveNoValidate(freshRecord)
  }
  return e.next()
}, 'academy_enrollments')
