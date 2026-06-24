onRecordAfterCreateSuccess((e) => {
  const user = e.record

  // 1. Create trial subscription
  try {
    const subsCol = $app.findCollectionByNameOrId('subscriptions')
    const sub = new Record(subsCol)
    sub.set('subscriber', user.id)
    sub.set('status', 'trial')

    const now = new Date()
    sub.set('current_period_start', now.toISOString().replace('T', ' '))

    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    sub.set('trial_ends_at', trialEnd.toISOString().replace('T', ' '))

    $app.save(sub)
  } catch (err) {
    $app.logger().error('Trial creation failed', 'error', err.message)
  }

  // 2. Audit Log
  try {
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const audit = new Record(auditCol)
    audit.set('actor', user.id)
    audit.set('action', 'account_created')
    audit.set('table_name', 'users')
    audit.set('record_id', user.id)
    audit.set('new_data', { trial_started: true })
    $app.save(audit)
  } catch (err) {
    $app.logger().error('Audit log failed', 'error', err.message)
  }

  // 3. Welcome Email
  $app.logger().info(`Sending welcome email to ${user.email()} with access instructions.`)

  e.next()
}, 'users')
