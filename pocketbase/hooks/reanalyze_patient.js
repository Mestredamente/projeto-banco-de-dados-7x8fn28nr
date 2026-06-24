routerAdd(
  'POST',
  '/backend/v1/patients/{id}/analyze',
  (e) => {
    const patientId = e.request.pathValue('id')
    const professionalId = e.auth?.id
    if (!professionalId) return e.unauthorizedError('auth required')

    const patient = $app.findRecordById('patients', patientId)
    if (!patient.getBool('ai_consent')) {
      return e.badRequestError('O paciente não autorizou a análise por IA.')
    }

    let evols
    try {
      evols = $app.findRecordsByFilter(
        'session_notes',
        `patient = '${patientId}' && status = 'finalizado'`,
        '-session_date',
        20,
        0,
      )
    } catch (_) {
      return e.badRequestError('Nenhuma evolução finalizada encontrada.')
    }

    if (!evols || evols.length === 0) {
      return e.badRequestError('Nenhuma evolução finalizada encontrada.')
    }

    const latestNote = evols[0]

    try {
      const oldInsight = $app.findFirstRecordByData(
        'clinical_insights',
        'session_note',
        latestNote.id,
      )
      $app.delete(oldInsight)
    } catch (_) {}

    const dob = patient.getString('date_of_birth')
    let age = 'unknown'
    if (dob) {
      const birthDate = new Date(dob)
      age = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970).toString()
    }
    const gender = patient.getString('gender') || 'unknown'

    let evolsText = evols
      .map(
        (ev, i) =>
          `Note ${evols.length - i} (Date: ${ev.getString('session_date')}): ${ev.getString('content')}`,
      )
      .join('\n\n')

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
    insight.set('professional', professionalId)
    insight.set('session_note', latestNote.id)
    insight.set('summary', parsed.summary || '')
    insight.set('detected_patterns', parsed.detected_patterns || [])
    insight.set('risk_alerts', parsed.risk_alerts || [])
    insight.set('abandoned_topics', parsed.abandoned_topics || [])
    insight.set('intervention_suggestion', parsed.intervention_suggestion || '')

    $app.saveNoValidate(insight)

    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditLogs)
    log.set('actor', professionalId)
    log.set('action', 'AI_ANALYSIS_GENERATED_MANUAL')
    log.set('table_name', 'clinical_insights')
    log.set('record_id', insight.id)
    log.set('new_data', {
      usage: aiRes.usage,
      patient_id: patientId,
    })
    log.set('ip_address', e.request.remoteAddr)
    $app.saveNoValidate(log)

    const hasCritical =
      Array.isArray(parsed.risk_alerts) && parsed.risk_alerts.some((a) => a.level === 'critical')
    if (hasCritical) {
      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCol)
      notif.set('profile', professionalId)
      notif.set('patient', patientId)
      notif.set('title', 'Alerta Clínico Detectado pela IA (Reanálise)')
      notif.set(
        'body',
        'A IA detectou um risco clínico crítico ou queda de humor acentuada na reanálise.',
      )
      notif.set('type', 'clinical_risk')
      notif.set('channel', 'in_app')
      notif.set('status', 'Entregue')
      $app.saveNoValidate(notif)
    }

    return e.json(200, { success: true, insight: insight.publicExport() })
  },
  $apis.requireAuth(),
)
