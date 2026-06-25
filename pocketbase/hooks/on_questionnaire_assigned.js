onRecordAfterCreateSuccess((e) => {
  const assignment = e.record
  const questionnaireId = assignment.getString('questionnaire')
  const patientId = assignment.getString('patient')

  if (!questionnaireId || !patientId) return e.next()

  let questionnaire, patient
  try {
    questionnaire = $app.findRecordById('questionnaires', questionnaireId)
    patient = $app.findRecordById('patients', patientId)
  } catch (err) {
    return e.next()
  }

  const profileId = patient.getString('profile')
  const title = 'Nova Escala Disponível'
  const body = `📋 Você tem uma escala para preencher: ${questionnaire.getString('title')}`

  // 1. In-app notification
  if (profileId) {
    try {
      const notif = new Record($app.findCollectionByNameOrId('notifications'))
      notif.set('profile', profileId)
      notif.set('patient', patientId)
      notif.set('title', title)
      notif.set('body', body)
      notif.set('type', 'escala')
      notif.set('channel', 'in_app')
      notif.set('status', 'Entregue')
      notif.set('reference_table', 'questionnaire_assignments')
      notif.set('reference_id', assignment.id)
      notif.set('read', false)
      $app.save(notif)
    } catch (err) {
      $app.logger().error('Failed to create in-app notification', 'error', err.message)
    }
  }

  const patientName = patient.getString('name').split(' ')[0]
  const qTitle = questionnaire.getString('title')
  const messageContent = `Olá ${patientName}, seu psicólogo solicitou que você preencha a escala ${qTitle}. Acesse o portal do Syntra para responder.`

  // 2. Send Email
  const email = patient.getString('email')
  if (email) {
    const sgKey = $secrets.get('SENDGRID_API_KEY')
    if (sgKey) {
      try {
        const res = $http.send({
          url: 'https://api.sendgrid.com/v3/mail/send',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + sgKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: 'no-reply@goskip.app', name: 'Portal Syntra' },
            subject: title,
            content: [{ type: 'text/plain', value: messageContent }],
          }),
        })

        if (res.statusCode >= 400) {
          $app
            .logger()
            .error('SendGrid error on assignment', 'status', res.statusCode, 'body', res.json || '')
        }
      } catch (err) {
        $app
          .logger()
          .error(
            'Failed to send email notification for assignment ' + assignment.id,
            'error',
            err.message,
          )
      }
    }
  }

  // 3. Send WhatsApp
  const phone = patient.getString('phone')
  if (phone) {
    const waToken = $secrets.get('WHATSAPP_API_TOKEN')
    if (waToken) {
      try {
        const res = $http.send({
          url: 'https://api.whatsapp.com/v1/messages',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + waToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: phone,
            text: messageContent,
          }),
        })

        if (res.statusCode >= 400) {
          $app.logger().error('WhatsApp error on assignment', 'status', res.statusCode)
        }
      } catch (err) {
        $app
          .logger()
          .error(
            'Failed to send WA notification for assignment ' + assignment.id,
            'error',
            err.message,
          )
      }
    }
  }

  return e.next()
}, 'questionnaire_assignments')
