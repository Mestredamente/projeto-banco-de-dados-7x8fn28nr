cronAdd('reminders_job', '0 * * * *', () => {
  const allSettings = $app.findRecordsByFilter('notification_settings', '', '', 0, 0)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const yyyy = tomorrow.getFullYear()
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getDate()).padStart(2, '0')

  const tomorrowStr = `${yyyy}-${mm}-${dd}`
  const tomorrowDisplay = `${dd}/${mm}/${yyyy}`

  for (const settings of allSettings) {
    const triggers = settings.get('triggers') || {}
    if (triggers.lembrete === false) continue

    const profId = settings.getString('user')
    const reminderTime = settings.getString('reminder_time') || '10:00'

    const currentHour = new Date().getHours().toString().padStart(2, '0')
    const setHour = reminderTime.split(':')[0]
    if (currentHour !== setHour) continue

    const templates = settings.get('templates') || {}
    const template =
      templates.lembrete ||
      'Olá [PACIENTE], sua sessão com [PSICÓLOGO] é amanhã às [HORÁRIO]. Confirme aqui: [LINK]'

    let prof
    try {
      prof = $app.findRecordById('users', profId)
    } catch (e) {
      continue
    }

    const appointments = $app.findRecordsByFilter(
      'appointments',
      `professional="${profId}" && scheduled_date="${tomorrowStr}" && status="agendado"`,
      '',
      0,
      0,
    )

    const siteUrl = $secrets.get('SITE_URL') || 'https://projeto-banco-de-dados-fa533.goskip.app'
    const jwtSecret = $secrets.get('CONFIRMATION_SECRET') || 'fallback'

    for (const apt of appointments) {
      const patientId = apt.getString('patient')
      let patient
      try {
        patient = $app.findRecordById('patients', patientId)
      } catch (e) {
        continue
      }

      if (!patient.getBool('is_active')) continue

      const token = $security.createJWT({ appointment_id: apt.id }, jwtSecret, 86400)
      const link = `${siteUrl}/confirmar?token=${token}`

      let bodyText = template
      bodyText = bodyText.replace(/\[PACIENTE\]/g, patient.getString('name').split(' ')[0])
      bodyText = bodyText.replace(/\[PSICÓLOGO\]/g, prof.getString('name').split(' ')[0])
      bodyText = bodyText.replace(/\[HORÁRIO\]/g, apt.getString('start_time'))
      bodyText = bodyText.replace(/\[DATA\]/g, tomorrowDisplay)
      bodyText = bodyText.replace(/\[LINK\]/g, link)

      const notif = new Record($app.findCollectionByNameOrId('notifications'))
      notif.set('profile', profId)
      notif.set('patient', patientId)
      notif.set('title', 'Lembrete de Sessão')
      notif.set('body', bodyText)
      notif.set('type', 'lembrete')
      notif.set('channel', 'email')
      notif.set('status', 'Enviada')
      notif.set('reference_table', 'appointments')
      notif.set('reference_id', apt.id)
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
            `Não foi possível enviar o lembrete para o paciente ${patient.getString('name')}.`,
          )
          internalNotif.set('type', 'erro_sistema')
          internalNotif.set('channel', 'in_app')
          $app.save(internalNotif)
        }
      }
    }
  }
})
