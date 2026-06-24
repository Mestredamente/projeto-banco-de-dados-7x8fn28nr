onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('status') !== 'finalizado') return e.next()

  const record = e.record
  const patientId = record.getString('patient')

  try {
    const patient = $app.findRecordById('patients', patientId)
    if (!patient.getBool('ai_consent')) return e.next()

    try {
      $app.findFirstRecordByData('clinical_insights', 'session_note', record.id)
      return e.next()
    } catch (_) {}

    const dob = patient.getString('date_of_birth')
    let age = 'desconhecida'
    if (dob) {
      const birthDate = new Date(dob)
      const ageDiffMs = Date.now() - birthDate.getTime()
      const ageDate = new Date(ageDiffMs)
      age = Math.abs(ageDate.getUTCFullYear() - 1970).toString()
    }
    const gender = patient.getString('gender') || 'não informado'

    let evolsText = ''
    try {
      const evols = $app.findRecordsByFilter(
        'session_notes',
        `patient = '${patientId}' && status = 'finalizado'`,
        '-session_date',
        5,
        0,
      )
      evolsText = evols
        .map((ev) => `Data: ${ev.getString('session_date')}\nConteúdo: ${ev.getString('content')}`)
        .join('\n\n')
    } catch (_) {}

    let diariesText = ''
    try {
      const diaries = $app.findRecordsByFilter(
        'diary_entries',
        `patient = '${patientId}' && type = 'sentimentos' && is_visible_to_professional = true`,
        '-entry_date',
        10,
        0,
      )
      diariesText = diaries
        .map(
          (d) =>
            `Data: ${d.getString('entry_date')}\nHumor: ${d.getString('mood')} (Nota: ${d.getInt('mood_score')})\nConteúdo: ${d.getString('content')}`,
        )
        .join('\n\n')
    } catch (_) {}

    const prompt = `Você é um assistente clínico de IA.
Analise as notas da sessão e os diários e forneça insights estritamente em formato JSON.
Dados anonimizados: Idade: ${age}, Gênero: ${gender}.

Histórico Recente de Evoluções:
${evolsText}

Diário de Sentimentos Recentes:
${diariesText}

IMPORTANTE: A resposta deve ser EXATAMENTE este JSON:
{
  "summary": "Resumo clínico em 2 a 3 frases.",
  "detected_patterns": ["padrão 1"],
  "risk_alerts": ["alerta 1"],
  "abandoned_topics": ["tópico 1"],
  "intervention_suggestion": "sugestão"
}`

    const aiRes = $ai.chat({
      model: 'fast',
      messages: [{ role: 'system', content: prompt }],
    })

    const reply = aiRes.choices[0].message.content
    const jsonStr = reply
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const parsed = JSON.parse(jsonStr)

    const col = $app.findCollectionByNameOrId('clinical_insights')
    const insight = new Record(col)
    insight.set('patient', patientId)
    insight.set('professional', record.getString('professional'))
    insight.set('session_note', record.id)
    insight.set('summary', parsed.summary || '')
    insight.set('detected_patterns', parsed.detected_patterns || [])
    insight.set('risk_alerts', parsed.risk_alerts || [])
    insight.set('abandoned_topics', parsed.abandoned_topics || [])
    insight.set('intervention_suggestion', parsed.intervention_suggestion || '')

    $app.saveNoValidate(insight)

    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditLogs)
    log.set('actor', record.getString('professional'))
    log.set('action', 'AI_ANALYSIS_GENERATED')
    log.set('table_name', 'clinical_insights')
    log.set('record_id', insight.id)
    log.set('new_data', insight.publicExport())
    log.set('ip_address', 'system')
    $app.saveNoValidate(log)
  } catch (err) {
    $app.logger().error('AI Insight Create Error', 'error', err.message)
  }
  return e.next()
}, 'session_notes')

onRecordAfterUpdateSuccess((e) => {
  if (e.record.getString('status') !== 'finalizado') return e.next()
  if (e.record.original().getString('status') === 'finalizado') return e.next()

  const record = e.record
  const patientId = record.getString('patient')

  try {
    const patient = $app.findRecordById('patients', patientId)
    if (!patient.getBool('ai_consent')) return e.next()

    try {
      $app.findFirstRecordByData('clinical_insights', 'session_note', record.id)
      return e.next()
    } catch (_) {}

    const dob = patient.getString('date_of_birth')
    let age = 'desconhecida'
    if (dob) {
      const birthDate = new Date(dob)
      const ageDiffMs = Date.now() - birthDate.getTime()
      const ageDate = new Date(ageDiffMs)
      age = Math.abs(ageDate.getUTCFullYear() - 1970).toString()
    }
    const gender = patient.getString('gender') || 'não informado'

    let evolsText = ''
    try {
      const evols = $app.findRecordsByFilter(
        'session_notes',
        `patient = '${patientId}' && status = 'finalizado'`,
        '-session_date',
        5,
        0,
      )
      evolsText = evols
        .map((ev) => `Data: ${ev.getString('session_date')}\nConteúdo: ${ev.getString('content')}`)
        .join('\n\n')
    } catch (_) {}

    let diariesText = ''
    try {
      const diaries = $app.findRecordsByFilter(
        'diary_entries',
        `patient = '${patientId}' && type = 'sentimentos' && is_visible_to_professional = true`,
        '-entry_date',
        10,
        0,
      )
      diariesText = diaries
        .map(
          (d) =>
            `Data: ${d.getString('entry_date')}\nHumor: ${d.getString('mood')} (Nota: ${d.getInt('mood_score')})\nConteúdo: ${d.getString('content')}`,
        )
        .join('\n\n')
    } catch (_) {}

    const prompt = `Você é um assistente clínico de IA.
Analise as notas da sessão e os diários e forneça insights estritamente em formato JSON.
Dados anonimizados: Idade: ${age}, Gênero: ${gender}.

Histórico Recente de Evoluções:
${evolsText}

Diário de Sentimentos Recentes:
${diariesText}

IMPORTANTE: A resposta deve ser EXATAMENTE este JSON:
{
  "summary": "Resumo clínico em 2 a 3 frases.",
  "detected_patterns": ["padrão 1"],
  "risk_alerts": ["alerta 1"],
  "abandoned_topics": ["tópico 1"],
  "intervention_suggestion": "sugestão"
}`

    const aiRes = $ai.chat({
      model: 'fast',
      messages: [{ role: 'system', content: prompt }],
    })

    const reply = aiRes.choices[0].message.content
    const jsonStr = reply
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const parsed = JSON.parse(jsonStr)

    const col = $app.findCollectionByNameOrId('clinical_insights')
    const insight = new Record(col)
    insight.set('patient', patientId)
    insight.set('professional', record.getString('professional'))
    insight.set('session_note', record.id)
    insight.set('summary', parsed.summary || '')
    insight.set('detected_patterns', parsed.detected_patterns || [])
    insight.set('risk_alerts', parsed.risk_alerts || [])
    insight.set('abandoned_topics', parsed.abandoned_topics || [])
    insight.set('intervention_suggestion', parsed.intervention_suggestion || '')

    $app.saveNoValidate(insight)

    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditLogs)
    log.set('actor', record.getString('professional'))
    log.set('action', 'AI_ANALYSIS_GENERATED')
    log.set('table_name', 'clinical_insights')
    log.set('record_id', insight.id)
    log.set('new_data', insight.publicExport())
    log.set('ip_address', 'system')
    $app.saveNoValidate(log)
  } catch (err) {
    $app.logger().error('AI Insight Update Error', 'error', err.message)
  }
  return e.next()
}, 'session_notes')
