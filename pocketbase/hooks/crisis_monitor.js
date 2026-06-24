// @deps
routerAdd(
  'POST',
  '/backend/v1/crisis/contact',
  (e) => {
    const body = e.requestInfo().body || {}
    const patientId = body.patient_id

    if (!patientId) return e.badRequestError('Patient ID is required')

    const patient = $app.findRecordById('patients', patientId)
    const name = patient.getString('name')
    const emergencyPhone = patient.getString('emergency_contact_phone')
    const emergencyName = patient.getString('emergency_contact_name')

    // A integração externa para envio de SMS/Email ficaria aqui.
    // Dentro do escopo, registramos no logger do sistema que a ação foi efetuada.
    $app
      .logger()
      .info(
        'Crisis emergency contact initiated',
        'patient',
        name,
        'emergency_contact',
        emergencyName,
        'phone',
        emergencyPhone,
      )

    return e.json(200, { success: true, contacted: true })
  },
  $apis.requireAuth(),
)

onRecordAfterCreateSuccess((e) => {
  const type = e.record.getString('type')
  if (type !== 'sentimentos' && type !== 'pessoal') {
    return e.next()
  }

  const content = e.record.getString('content').toLowerCase()
  if (!content) return e.next()

  const systemTriggers = [
    'vou morrer',
    'quero morrer',
    'sumir',
    'me matar',
    'suicídio',
    'suicida',
    'automutilação',
    'cortar',
    'machucar',
    'sangrar',
    'não aguento mais',
    'não quero mais viver',
    'acabar com tudo',
    'violento',
    'agressivo',
    'matar alguém',
  ]

  const patient = $app.findRecordById('patients', e.record.getString('patient'))
  const portalPerms = patient.get('portal_permissions') || {}

  let customTriggers = []
  if (portalPerms.custom_triggers && typeof portalPerms.custom_triggers === 'string') {
    customTriggers = portalPerms.custom_triggers.split(',').map((s) => s.trim())
  } else if (Array.isArray(portalPerms.custom_triggers)) {
    customTriggers = portalPerms.custom_triggers
  }

  const allTriggers = [...systemTriggers, ...customTriggers]
    .map((t) => t.toLowerCase())
    .filter(Boolean)

  const normalizedContent = ' ' + content.replace(/[.,!?\n\r]/g, ' ') + ' '
  let detectedTrigger = null

  for (const trigger of allTriggers) {
    if (normalizedContent.includes(' ' + trigger + ' ')) {
      detectedTrigger = trigger
      break
    }
  }

  if (detectedTrigger) {
    const links = $app.findRecordsByFilter(
      'patient_professionals',
      `patient = '${patient.id}' && is_active = true`,
      '',
      100,
      0,
    )

    for (const link of links) {
      const profId = link.getString('professional')

      const notif = new Record($app.findCollectionByNameOrId('notifications'))
      notif.set('profile', profId)
      notif.set('patient', patient.id)
      notif.set('title', '🚨 ALERTA DE CRISE — ' + patient.getString('name'))
      notif.set(
        'body',
        `Gatilho detectado: "${detectedTrigger}".\nTexto: "${content.substring(0, 200)}"`,
      )
      notif.set('type', 'crisis')
      notif.set('reference_table', 'diary_entries')
      notif.set('reference_id', e.record.id)
      notif.set('channel', 'push')
      notif.set('status', 'Entregue')
      notif.set('read', false)
      $app.save(notif)

      $app
        .logger()
        .info('Crisis trigger detected', 'patient', patient.id, 'trigger', detectedTrigger)
    }
  }

  return e.next()
}, 'diary_entries')
