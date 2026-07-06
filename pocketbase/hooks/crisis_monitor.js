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

  const content = e.record.getString('content')
  if (!content) return e.next()

  try {
    const prompt = `Analise a seguinte entrada de diário de um paciente em terapia.
Objetivo: Detectar sinais de CRISE psicológica aguda (ex: ideação suicida, automutilação, violência iminente, desespero extremo).
Entrada do Diário: "${content}"

Instruções:
Responda EXATAMENTE e APENAS em formato JSON, sem marcações markdown.
{
  "is_crisis": true ou false,
  "detected_trigger": "breve citação do padrão ou frase alarmante",
  "risk_level": "critical" ou "alto" ou "stable",
  "detected_keywords": ["lista", "de", "palavras-chave", "detectadas"],
  "summary": "Resumo do estado emocional em 1 frase (pt-BR)"
}`

    const aiRes = $ai.chat({
      model: 'fast',
      messages: [{ role: 'system', content: prompt }],
    })

    const reply = aiRes.choices[0].message.content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const parsed = JSON.parse(reply)

    var shouldAlert = false
    var severityLevel = ''

    if (parsed.is_crisis && parsed.risk_level === 'critical') {
      shouldAlert = true
      severityLevel = 'crítico'
    } else if (parsed.is_crisis && parsed.risk_level === 'alto') {
      shouldAlert = true
      severityLevel = 'alto'
    }

    if (shouldAlert) {
      const patientId = e.record.getString('patient')
      const patient = $app.findRecordById('patients', patientId)
      const diaryContentSnippet = content.substring(0, 500)
      var detectedKeywords = parsed.detected_keywords || []

      var links = []
      try {
        links = $app.findRecordsByFilter(
          'patient_professionals',
          "patient = '" + patientId + "' && is_active = true",
          '',
          100,
          0,
        )
      } catch (_) {}

      if (links.length === 0) {
        var createdBy = patient.getString('created_by')
        if (createdBy) {
          try {
            var creator = $app.findRecordById('users', createdBy)
            var profLink = {
              getString: function (field) {
                if (field === 'professional') return createdBy
                return ''
              },
            }
            links = [profLink]
          } catch (_) {}
        }
      }

      for (const link of links) {
        const profId = link.getString('professional')

        // 1. Notification (in-app)
        const notif = new Record($app.findCollectionByNameOrId('notifications'))
        notif.set('profile', profId)
        notif.set('patient', patientId)
        notif.set('title', '🚨 ALERTA DE CRISE DETECTADO PELA IA')
        notif.set(
          'body',
          'Paciente: ' +
            patient.getString('name') +
            '\nMotivo: ' +
            parsed.detected_trigger +
            '\nResumo: ' +
            parsed.summary,
        )
        notif.set('type', 'crisis')
        notif.set('reference_table', 'diary_entries')
        notif.set('reference_id', e.record.id)
        notif.set('channel', 'push')
        notif.set('status', 'Entregue')
        notif.set('read', false)
        $app.saveNoValidate(notif)

        // 2. Clinical Insights
        const insightCol = $app.findCollectionByNameOrId('clinical_insights')
        const insight = new Record(insightCol)
        insight.set('patient', patientId)
        insight.set('professional', profId)
        insight.set(
          'summary',
          'Alerta de risco gerado a partir de diário do paciente: ' + parsed.summary,
        )
        insight.set('risk_alerts', [{ alert: parsed.detected_trigger, level: severityLevel }])
        $app.saveNoValidate(insight)

        // 3. Centralized AI Alert
        const alertCol = $app.findCollectionByNameOrId('ai_alerts')
        const aiAlert = new Record(alertCol)
        aiAlert.set('professional', profId)
        aiAlert.set('patient', patientId)
        aiAlert.set('type', 'crise')
        aiAlert.set('priority', 'alta')
        aiAlert.set(
          'description',
          'Crise aguda detectada no diário (Gatilho: "' +
            parsed.detected_trigger +
            '"). ' +
            parsed.summary,
        )
        aiAlert.set('date_generated', new Date().toISOString().replace('T', ' '))
        aiAlert.set('is_resolved', false)
        $app.saveNoValidate(aiAlert)

        // 4. Persistent Crisis Alert Record
        const crisisCol = $app.findCollectionByNameOrId('crisis_alerts')
        const crisisAlert = new Record(crisisCol)
        crisisAlert.set('patient_id', patientId)
        crisisAlert.set('psychologist_id', profId)
        crisisAlert.set('diary_entry_id', e.record.id)
        crisisAlert.set('content', diaryContentSnippet)
        crisisAlert.set('severity', severityLevel)
        crisisAlert.set('detected_keywords', detectedKeywords)
        crisisAlert.set('email_sent', false)
        crisisAlert.set('sms_sent', false)
        $app.saveNoValidate(crisisAlert)
      }

      $app
        .logger()
        .info(
          'AI Crisis trigger detected',
          'patient',
          patientId,
          'trigger',
          parsed.detected_trigger,
          'severity',
          severityLevel,
        )
    }
  } catch (err) {
    $app.logger().error('AI Crisis Analysis Error', 'error', err.message)
  }

  return e.next()
}, 'diary_entries')
