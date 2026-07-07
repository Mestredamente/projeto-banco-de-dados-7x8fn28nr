routerAdd(
  'POST',
  '/backend/v1/payments/confirm',
  (e) => {
    const body = e.requestInfo().body || {}
    const recordId = body.record_id
    if (!recordId) return e.badRequestError('Missing record_id')

    const authId = e.auth && e.auth.id
    if (!authId) return e.unauthorizedError('Auth required')

    let record
    try {
      record = $app.findRecordById('financial_records', recordId)
    } catch (err) {
      return e.notFoundError('Financial record not found')
    }

    const currentStatus = record.getString('status')
    if (currentStatus !== 'aguardando_confirmacao') {
      return e.badRequestError('Este pagamento nao pode ser confirmado no estado atual.')
    }

    record.set('status', 'pago')
    const now = new Date()
    const dateStr =
      now.getUTCFullYear() +
      '-' +
      String(now.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getUTCDate()).padStart(2, '0')
    record.set('payment_date', dateStr)
    $app.save(record)

    const patientId = record.getString('patient')
    const total = record.get('total') || 0
    const valorStr = total.toFixed(2).replace('.', ',')

    let notificationSent = true
    try {
      const patient = $app.findRecordById('patients', patientId)
      const profileId = patient.getString('profile')

      if (profileId) {
        const notif = new Record($app.findCollectionByNameOrId('notifications'))
        notif.set('profile', profileId)
        notif.set('patient', patientId)
        notif.set('title', 'Pagamento Confirmado')
        notif.set('body', 'Seu pagamento de R$ ' + valorStr + ' foi confirmado')
        notif.set('type', 'pagamento_confirmado')
        notif.set('channel', 'in_app')
        notif.set('status', 'Enviada')
        notif.set('reference_table', 'financial_records')
        notif.set('reference_id', recordId)
        $app.save(notif)
      } else {
        notificationSent = false
      }
    } catch (err) {
      notificationSent = false
      $app
        .logger()
        .error(
          'Failed to send payment confirmation notification',
          'error',
          err.message,
          'recordId',
          recordId,
        )
    }

    return e.json(200, {
      success: true,
      notification_sent: notificationSent,
    })
  },
  $apis.requireAuth(),
)
