onRecordBeforeUpdateRequest((e) => {
  const record = e.record
  if (record.getInt('progress') >= 100 && !record.getString('completed_at')) {
    record.set('completed_at', new Date().toISOString())
    record.set('certificate_hash', $security.randomString(16).toUpperCase())
  }
  e.next()
}, 'academy_enrollments')
