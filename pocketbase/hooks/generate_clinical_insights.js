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
    let age = 'unknown'
    if (dob) {
      const birthDate = new Date(dob)
      age = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970).toString()
    }
    const gender = patient.getString('gender') || 'unknown'

    let evolsText = ''
    try {
      const evols = $app.findRecordsByFilter(
        'session_notes',
        `patient = '${patientId}' && status = 'finalizado'`,
        '-session_date',
        20,
        0,
      )
      evolsText = evols
        .map(
          (ev, i) =>
            `Note ${evols.length - i} (Date: ${ev.getString('session_date')}): ${ev.getString('content')}`,
        )
        .join('\n\n')
    } catch (_) {}

    let diariesText = ''
    try {
      const diaries = $app.findRecordsByFilter(
        'diary_entries',
        `patient = '${patientId}' && type = 'sentimentos' && is_visible_to_professional = true`,
        '-entry_date',
        20,
        0,
      )
      diariesText = diaries
        .map(
          (d) =>
            `Diary (Date: ${d.getString('entry_date')}): Mood: ${d.getString('mood')} (Score: ${d.getInt('mood_score')}). Content: ${d.getString('content')}`,
        )
        .join('\n\n')
    } catch (_) {}

    const prompt = `You are a clinical AI assistant. Analyze the session notes and diary entries below.
Patient demographic (anonymized): Age: ${age}, Gender: ${gender}.

Instructions:
1. Extract clinical patterns and state their frequency (e.g., "3 consecutive sessions").
2. Check for abandoned topics (topics mentioned in older notes but not in recent ones).
3. Correlate diary entries with session notes (e.g., discrepancies in reported mood vs clinical note).
4. Evaluate risk alerts. If there is a critical risk or mood drop, set level to "critical". If stable, set to "stable".
5. Provide an intervention suggestion based on evidence.

IMPORTANT: The response MUST be EXACTLY the following JSON format and translated to Brazilian Portuguese (PT-BR). Do NOT include any markdown formatting like \`\`\`json.
{
  "summary": "Brief clinical summary and diary correlation in 2 to 3 sentences.",
  "detected_patterns": [
    {"pattern": "description", "frequency": "frequency description"}
  ],
  "risk_alerts": [
    {"alert": "description", "level": "critical" | "stable"}
  ],
  "abandoned_topics": [
    {"topic": "description", "time_since_last_mention": "e.g., 30 days"}
  ],
  "intervention_suggestion": "suggestion"
}

Session Notes:
${evolsText}

Diary Entries:
${diariesText}
`

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
    log.set('new_data', {
      usage: aiRes.usage,
      patient_id: patientId,
    })
    log.set('ip_address', 'system')
    $app.saveNoValidate(log)

    const hasCritical =
      Array.isArray(parsed.risk_alerts) && parsed.risk_alerts.some((a) => a.level === 'critical')
    if (hasCritical) {
      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCol)
      notif.set('profile', record.getString('professional'))
      notif.set('patient', patientId)
      notif.set('title', 'Alerta Clínico Detectado pela IA')
      notif.set(
        'body',
        'A IA detectou um risco clínico crítico ou queda de humor acentuada na última análise.',
      )
      notif.set('type', 'clinical_risk')
      notif.set('channel', 'in_app')
      notif.set('status', 'Entregue')
      $app.saveNoValidate(notif)
    }
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
    let age = 'unknown'
    if (dob) {
      const birthDate = new Date(dob)
      age = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970).toString()
    }
    const gender = patient.getString('gender') || 'unknown'

    let evolsText = ''
    try {
      const evols = $app.findRecordsByFilter(
        'session_notes',
        `patient = '${patientId}' && status = 'finalizado'`,
        '-session_date',
        20,
        0,
      )
      evolsText = evols
        .map(
          (ev, i) =>
            `Note ${evols.length - i} (Date: ${ev.getString('session_date')}): ${ev.getString('content')}`,
        )
        .join('\n\n')
    } catch (_) {}

    let diariesText = ''
    try {
      const diaries = $app.findRecordsByFilter(
        'diary_entries',
        `patient = '${patientId}' && type = 'sentimentos' && is_visible_to_professional = true`,
        '-entry_date',
        20,
        0,
      )
      diariesText = diaries
        .map(
          (d) =>
            `Diary (Date: ${d.getString('entry_date')}): Mood: ${d.getString('mood')} (Score: ${d.getInt('mood_score')}). Content: ${d.getString('content')}`,
        )
        .join('\n\n')
    } catch (_) {}

    const prompt = `You are a clinical AI assistant. Analyze the session notes and diary entries below.
Patient demographic (anonymized): Age: ${age}, Gender: ${gender}.

Instructions:
1. Extract clinical patterns and state their frequency (e.g., "3 consecutive sessions").
2. Check for abandoned topics (topics mentioned in older notes but not in recent ones).
3. Correlate diary entries with session notes (e.g., discrepancies in reported mood vs clinical note).
4. Evaluate risk alerts. If there is a critical risk or mood drop, set level to "critical". If stable, set to "stable".
5. Provide an intervention suggestion based on evidence.

IMPORTANT: The response MUST be EXACTLY the following JSON format and translated to Brazilian Portuguese (PT-BR). Do NOT include any markdown formatting like \`\`\`json.
{
  "summary": "Brief clinical summary and diary correlation in 2 to 3 sentences.",
  "detected_patterns": [
    {"pattern": "description", "frequency": "frequency description"}
  ],
  "risk_alerts": [
    {"alert": "description", "level": "critical" | "stable"}
  ],
  "abandoned_topics": [
    {"topic": "description", "time_since_last_mention": "e.g., 30 days"}
  ],
  "intervention_suggestion": "suggestion"
}

Session Notes:
${evolsText}

Diary Entries:
${diariesText}
`

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
    log.set('new_data', {
      usage: aiRes.usage,
      patient_id: patientId,
    })
    log.set('ip_address', 'system')
    $app.saveNoValidate(log)

    const hasCritical =
      Array.isArray(parsed.risk_alerts) && parsed.risk_alerts.some((a) => a.level === 'critical')
    if (hasCritical) {
      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCol)
      notif.set('profile', record.getString('professional'))
      notif.set('patient', patientId)
      notif.set('title', 'Alerta Clínico Detectado pela IA')
      notif.set(
        'body',
        'A IA detectou um risco clínico crítico ou queda de humor acentuada na última análise.',
      )
      notif.set('type', 'clinical_risk')
      notif.set('channel', 'in_app')
      notif.set('status', 'Entregue')
      $app.saveNoValidate(notif)
    }
  } catch (err) {
    $app.logger().error('AI Insight Update Error', 'error', err.message)
  }
  return e.next()
}, 'session_notes')
