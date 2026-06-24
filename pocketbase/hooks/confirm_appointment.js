// @deps date-fns@4.1.0
routerAdd('POST', '/backend/v1/appointments/confirm', (e) => {
  const body = e.requestInfo().body || {}
  const token = body.token
  if (!token) return e.badRequestError('Missing token')
  const secret = $secrets.get('CONFIRMATION_SECRET') || 'fallback'
  let payload
  try {
    payload = $security.parseJWT(token, secret)
  } catch (err) {
    return e.badRequestError('Invalid or expired token')
  }
  const aptId = payload.appointment_id
  if (!aptId) return e.badRequestError('Invalid token payload')

  let record
  try {
    record = $app.findRecordById('appointments', aptId)
  } catch (err) {
    return e.notFoundError('Appointment not found')
  }

  record.set('status', 'confirmado_paciente')
  record.set('patient_confirmed_at', new Date().toISOString())
  $app.save(record)

  const profId = record.getString('professional')
  const patientId = record.getString('patient')
  const patient = $app.findRecordById('patients', patientId)

  let settings
  try {
    settings = $app.findFirstRecordByFilter('notification_settings', `user="${profId}"`)
  } catch (err) {}

  if (!settings || (settings.get('triggers') && settings.get('triggers').confirmacao !== false)) {
    const templates = settings ? settings.get('templates') : {}
    let template = templates?.confirmacao || 'Sessão confirmada para [DATA] às [HORÁRIO]. Até lá!'

    const { format } = require('date-fns')
    const dateStr = record.getString('scheduled_date')
      ? format(new Date(record.getString('scheduled_date')), 'dd/MM/yyyy')
      : ''

    template = template.replace(/\[DATA\]/g, dateStr)
    template = template.replace(/\[HORÁRIO\]/g, record.getString('start_time'))

    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('profile', profId)
    notif.set('patient', patientId)
    notif.set('title', 'Sessão Confirmada')
    notif.set('body', template)
    notif.set('type', 'confirmacao')
    notif.set('channel', 'email')
    notif.set('status', 'Enviada')
    notif.set('reference_table', 'appointments')
    notif.set('reference_id', aptId)
    $app.save(notif)

    const sgKey = $secrets.get('SENDGRID_API_KEY')
    if (sgKey && patient.getString('email')) {
      try {
        const res = $http.send({
          url: 'https://api.sendgrid.com/v3/mail/send',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + sgKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: patient.getString('email') }] }],
            from: { email: 'no-reply@goskip.app', name: 'PsicoManager' },
            subject: notif.getString('title'),
            content: [{ type: 'text/plain', value: notif.getString('body') }],
          }),
        })
        if (res.statusCode >= 400) {
          notif.set('status', 'Erro')
          $app
            .logger()
            .error('SendGrid HTTP error', 'status', res.statusCode, 'body', res.json || '')
        } else {
          notif.set('status', 'Entregue')
        }
        $app.save(notif)
      } catch (err) {
        $app.logger().error('SendGrid error', 'error', err.message)
        notif.set('status', 'Erro')
        $app.save(notif)
      }

      if (notif.getString('status') === 'Erro') {
        const internalNotif = new Record($app.findCollectionByNameOrId('notifications'))
        internalNotif.set('profile', profId)
        internalNotif.set('title', 'Falha no Envio de Notificação')
        internalNotif.set(
          'body',
          `Não foi possível enviar a confirmação para o paciente ${patient.getString('name')}.`,
        )
        internalNotif.set('type', 'erro_sistema')
        internalNotif.set('channel', 'in_app')
        $app.save(internalNotif)
      }
    }
  }

  return e.json(200, { success: true })
})
