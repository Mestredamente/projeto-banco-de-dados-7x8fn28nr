routerAdd(
  'POST',
  '/backend/v1/notifications/send-billing',
  (e) => {
    const body = e.requestInfo().body || {}
    const recordId = body.record_id
    if (!recordId) return e.badRequestError('Missing record_id')

    const authId = e.auth?.id
    if (!authId) return e.unauthorizedError('Auth required')

    const finRecord = $app.findRecordById('financial_records', recordId)
    if (finRecord.getString('professional') !== authId && !e.hasSuperuserAuth()) {
      return e.forbiddenError('Not allowed')
    }

    const patientId = finRecord.getString('patient')
    const patient = $app.findRecordById('patients', patientId)

    if (!patient.getBool('is_active')) {
      return e.badRequestError('Patient is inactive')
    }

    const professional = $app.findRecordById('users', authId)

    let settings
    try {
      settings = $app.findFirstRecordByFilter('notification_settings', `user="${authId}"`)
    } catch (err) {}

    const templates = settings ? settings.get('templates') : {}
    let template =
      templates?.cobranca ||
      'Sessão de [DATA] no valor de R$ [VALOR]. Pagamento via [METODO]. Chave: [PIX]'

    let dateStr = ''
    const dueRaw = finRecord.getString('due_date')
    if (dueRaw) {
      const match = dueRaw.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) {
        dateStr = `${match[3]}/${match[2]}/${match[1]}`
      } else {
        const d = new Date(dueRaw)
        if (!isNaN(d.getTime())) {
          dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
        }
      }
    }
    const valorStr = finRecord.get('value') ? finRecord.get('value').toFixed(2) : '0.00'
    const bankDetails = professional.get('bank_details') || {}

    template = template.replace(/\[DATA\]/g, dateStr)
    template = template.replace(/\[VALOR\]/g, valorStr)
    template = template.replace(/\[METODO\]/g, bankDetails.pixType || 'PIX')
    template = template.replace(/\[PIX\]/g, bankDetails.pixKey || '')
    template = template.replace(/\[PACIENTE\]/g, patient.getString('name').split(' ')[0])
    template = template.replace(/\[PSICÓLOGO\]/g, professional.getString('name').split(' ')[0])

    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('profile', authId)
    notif.set('patient', patientId)
    notif.set('title', 'Cobrança de Sessão')
    notif.set('body', template)
    notif.set('type', 'cobranca')
    notif.set('channel', 'email')
    notif.set('status', 'Enviada')
    notif.set('reference_table', 'financial_records')
    notif.set('reference_id', recordId)
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
      } catch (e) {
        $app.logger().error('SendGrid error', 'error', e.message)
        notif.set('status', 'Erro')
        $app.save(notif)
      }

      if (notif.getString('status') === 'Erro') {
        const internalNotif = new Record($app.findCollectionByNameOrId('notifications'))
        internalNotif.set('profile', authId)
        internalNotif.set('title', 'Falha no Envio de Notificação')
        internalNotif.set(
          'body',
          `Não foi possível enviar o email de cobrança para o paciente ${patient.getString('name')}.`,
        )
        internalNotif.set('type', 'erro_sistema')
        internalNotif.set('channel', 'in_app')
        $app.save(internalNotif)
      }
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
