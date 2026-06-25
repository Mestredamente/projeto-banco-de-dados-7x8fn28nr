cronAdd('ai_daily_analysis_job', '0 2 * * *', () => {
  const now = new Date()
  const dateGenerated = now.toISOString().replace('T', ' ')
  const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().replace('T', ' ')
  const ninetyDaysAgoDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // 1. Compliance Alerts (Evoluções em Rascunho > 7 dias)
  try {
    const drafts = $app.findRecordsByFilter(
      'session_notes',
      `status = 'rascunho' && created <= '${sevenDaysAgoStr}'`,
      '',
      0,
      0,
    )
    for (const draft of drafts) {
      const prof = draft.getString('professional')
      const patient = draft.getString('patient')
      try {
        $app.findFirstRecordByFilter(
          'ai_alerts',
          `type='evolução' && professional='${prof}' && patient='${patient}' && is_resolved=false`,
        )
      } catch (_) {
        const alertCol = $app.findCollectionByNameOrId('ai_alerts')
        const alert = new Record(alertCol)
        alert.set('professional', prof)
        alert.set('patient', patient)
        alert.set('type', 'evolução')
        alert.set('priority', 'média')
        alert.set(
          'description',
          'Há uma anotação de sessão em status de rascunho há mais de 7 dias pendente de finalização para este paciente.',
        )
        alert.set('date_generated', dateGenerated)
        alert.set('is_resolved', false)
        $app.saveNoValidate(alert)
      }
    }
  } catch (err) {
    $app.logger().error('AI Analysis - Compliance Error', 'error', err.message)
  }

  // 2. Inventory Alerts (Abaixo do estoque mínimo)
  try {
    const items = $app.findRecordsByFilter('inventory_items', '', '', 0, 0)
    for (const item of items) {
      const qty = item.getInt('quantity')
      const min = item.getInt('min_stock')
      if (qty <= min) {
        const clinic = item.getString('clinic')
        const desc = `O item de estoque "${item.getString('name')}" atingiu nível crítico (${qty}/${min}). Sugere-se planejar a reposição.`
        try {
          $app.findFirstRecordByFilter(
            'ai_alerts',
            `type='compra' && clinic='${clinic}' && description='${desc}' && is_resolved=false`,
          )
        } catch (_) {
          const admins = $app.findRecordsByFilter(
            'users',
            `role='admin_clinica' || role='gestor_saas'`,
            '',
            1,
            0,
          )
          if (admins.length > 0) {
            const alertCol = $app.findCollectionByNameOrId('ai_alerts')
            const alert = new Record(alertCol)
            alert.set('professional', admins[0].id)
            alert.set('clinic', clinic)
            alert.set('type', 'compra')
            alert.set('priority', 'baixa')
            alert.set('description', desc)
            alert.set('date_generated', dateGenerated)
            alert.set('is_resolved', false)
            $app.saveNoValidate(alert)
          }
        }
      }
    }
  } catch (err) {
    $app.logger().error('AI Analysis - Inventory Error', 'error', err.message)
  }

  // 3. Re-evaluation Alerts (> 90 days sem Reavaliação)
  try {
    const links = $app.findRecordsByFilter('patient_professionals', 'is_active = true', '', 0, 0)
    for (const link of links) {
      const patientId = link.getString('patient')
      const profId = link.getString('professional')

      let lastReav = null
      try {
        lastReav = $app.findFirstRecordByFilter(
          'session_notes',
          `patient='${patientId}' && professional='${profId}' && evolution_type='Reavaliação'`,
          '-session_date',
        )
      } catch (_) {}

      if (!lastReav || new Date(lastReav.getString('session_date')) < ninetyDaysAgoDate) {
        let patientName = 'Desconhecido'
        try {
          const p = $app.findRecordById('patients', patientId)
          patientName = p.getString('name')
        } catch (_) {}

        const desc = `O paciente ${patientName} não passa por reavaliação clínica estruturada há mais de 90 dias. Considere agendar reavaliação.`
        try {
          $app.findFirstRecordByFilter(
            'ai_alerts',
            `type='reavaliação' && professional='${profId}' && patient='${patientId}' && is_resolved=false`,
          )
        } catch (_) {
          const alertCol = $app.findCollectionByNameOrId('ai_alerts')
          const alert = new Record(alertCol)
          alert.set('professional', profId)
          alert.set('patient', patientId)
          alert.set('type', 'reavaliação')
          alert.set('priority', 'média')
          alert.set('description', desc)
          alert.set('date_generated', dateGenerated)
          alert.set('is_resolved', false)
          $app.saveNoValidate(alert)
        }
      }
    }
  } catch (err) {
    $app.logger().error('AI Analysis - Reevaluation Error', 'error', err.message)
  }

  // 4. Academy Alerts (Sugestão IA)
  try {
    const profs = $app.findRecordsByFilter(
      'users',
      "role='psicologo_autonomo' || role='psicologo_vinculado'",
      '',
      0,
      0,
    )
    let coursesStr = ''
    try {
      const courses = $app.findRecordsByFilter('academy_courses', 'is_active=true', '', 0, 0)
      coursesStr = courses
        .map((c) => `- ${c.getString('title')}: ${c.getString('description')}`)
        .join('\n')
    } catch (_) {}

    if (coursesStr) {
      for (const prof of profs) {
        const notes = $app.findRecordsByFilter(
          'session_notes',
          `professional='${prof.id}' && status='finalizado'`,
          '-created',
          10,
          0,
        )
        if (notes.length === 0) continue

        const complaints = notes
          .map((n) => n.getString('main_complaint') || '')
          .filter(Boolean)
          .join('. ')
        if (!complaints) continue

        const prompt = `Como motor de IA da clínica, recomende capacitação continuada.
Especializações atuais: ${JSON.stringify(prof.get('specializations') || [])}
Resumo de queixas clínicas dos pacientes recentes: ${complaints.substring(0, 1000)}

Cursos Disponíveis (Syntra Academy):
${coursesStr}

Instruções:
Se houver uma forte correlação entre as demandas clínicas recentes e um curso, recomende-o.
Responda APENAS com JSON:
{"recommendation": "Breve justificativa médica para a indicação (pt-BR)", "course_title": "Título exato do curso"}
Se nenhum curso for útil, retorne campos vazios.`

        const aiRes = $ai.chat({
          model: 'fast',
          messages: [{ role: 'system', content: prompt }],
        })

        const reply = aiRes.choices[0].message.content
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim()
        const parsed = JSON.parse(reply)

        if (parsed.course_title && parsed.recommendation) {
          const desc = `Sugestão Educacional (Syntra Academy): Baseado nas demandas de seus atendimentos recentes, sugerimos o curso "${parsed.course_title}". ${parsed.recommendation}`
          try {
            $app.findFirstRecordByFilter(
              'ai_alerts',
              `type='academy' && professional='${prof.id}' && description~'${parsed.course_title}'`,
            )
          } catch (_) {
            const alertCol = $app.findCollectionByNameOrId('ai_alerts')
            const alert = new Record(alertCol)
            alert.set('professional', prof.id)
            alert.set('type', 'academy')
            alert.set('priority', 'baixa')
            alert.set('description', desc)
            alert.set('date_generated', dateGenerated)
            alert.set('is_resolved', false)
            $app.saveNoValidate(alert)
          }
        }
      }
    }
  } catch (err) {
    $app.logger().error('AI Analysis - Academy Error', 'error', err.message)
  }
})

// Rota manual para disparar a engine via UI e validar
routerAdd(
  'POST',
  '/backend/v1/ai/trigger-analysis',
  (e) => {
    const now = new Date()
    const dateGenerated = now.toISOString().replace('T', ' ')
    const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().replace('T', ' ')
    const ninetyDaysAgoDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // 1. Compliance
    try {
      const drafts = $app.findRecordsByFilter(
        'session_notes',
        `status = 'rascunho' && created <= '${sevenDaysAgoStr}'`,
        '',
        0,
        0,
      )
      for (const draft of drafts) {
        const prof = draft.getString('professional')
        const patient = draft.getString('patient')
        try {
          $app.findFirstRecordByFilter(
            'ai_alerts',
            `type='evolução' && professional='${prof}' && patient='${patient}' && is_resolved=false`,
          )
        } catch (_) {
          const alertCol = $app.findCollectionByNameOrId('ai_alerts')
          const alert = new Record(alertCol)
          alert.set('professional', prof)
          alert.set('patient', patient)
          alert.set('type', 'evolução')
          alert.set('priority', 'média')
          alert.set(
            'description',
            'Há uma anotação de sessão em status de rascunho há mais de 7 dias pendente de finalização para este paciente.',
          )
          alert.set('date_generated', dateGenerated)
          alert.set('is_resolved', false)
          $app.saveNoValidate(alert)
        }
      }
    } catch (err) {}

    // 2. Inventory
    try {
      const items = $app.findRecordsByFilter('inventory_items', '', '', 0, 0)
      for (const item of items) {
        const qty = item.getInt('quantity')
        const min = item.getInt('min_stock')
        if (qty <= min) {
          const clinic = item.getString('clinic')
          const desc = `O item de estoque "${item.getString('name')}" atingiu nível crítico (${qty}/${min}). Sugere-se planejar a reposição.`
          try {
            $app.findFirstRecordByFilter(
              'ai_alerts',
              `type='compra' && clinic='${clinic}' && description='${desc}' && is_resolved=false`,
            )
          } catch (_) {
            const admins = $app.findRecordsByFilter(
              'users',
              `role='admin_clinica' || role='gestor_saas'`,
              '',
              1,
              0,
            )
            if (admins.length > 0) {
              const alertCol = $app.findCollectionByNameOrId('ai_alerts')
              const alert = new Record(alertCol)
              alert.set('professional', admins[0].id)
              alert.set('clinic', clinic)
              alert.set('type', 'compra')
              alert.set('priority', 'baixa')
              alert.set('description', desc)
              alert.set('date_generated', dateGenerated)
              alert.set('is_resolved', false)
              $app.saveNoValidate(alert)
            }
          }
        }
      }
    } catch (err) {}

    // 3. Re-evaluation
    try {
      const links = $app.findRecordsByFilter('patient_professionals', 'is_active = true', '', 0, 0)
      for (const link of links) {
        const patientId = link.getString('patient')
        const profId = link.getString('professional')

        let lastReav = null
        try {
          lastReav = $app.findFirstRecordByFilter(
            'session_notes',
            `patient='${patientId}' && professional='${profId}' && evolution_type='Reavaliação'`,
            '-session_date',
          )
        } catch (_) {}

        if (!lastReav || new Date(lastReav.getString('session_date')) < ninetyDaysAgoDate) {
          let patientName = 'Desconhecido'
          try {
            const p = $app.findRecordById('patients', patientId)
            patientName = p.getString('name')
          } catch (_) {}

          const desc = `O paciente ${patientName} não passa por reavaliação clínica estruturada há mais de 90 dias. Considere agendar reavaliação.`
          try {
            $app.findFirstRecordByFilter(
              'ai_alerts',
              `type='reavaliação' && professional='${profId}' && patient='${patientId}' && is_resolved=false`,
            )
          } catch (_) {
            const alertCol = $app.findCollectionByNameOrId('ai_alerts')
            const alert = new Record(alertCol)
            alert.set('professional', profId)
            alert.set('patient', patientId)
            alert.set('type', 'reavaliação')
            alert.set('priority', 'média')
            alert.set('description', desc)
            alert.set('date_generated', dateGenerated)
            alert.set('is_resolved', false)
            $app.saveNoValidate(alert)
          }
        }
      }
    } catch (err) {}

    // 4. Academy
    try {
      const profs = $app.findRecordsByFilter(
        'users',
        "role='psicologo_autonomo' || role='psicologo_vinculado'",
        '',
        0,
        0,
      )
      let coursesStr = ''
      try {
        const courses = $app.findRecordsByFilter('academy_courses', 'is_active=true', '', 0, 0)
        coursesStr = courses
          .map((c) => `- ${c.getString('title')}: ${c.getString('description')}`)
          .join('\n')
      } catch (_) {}

      if (coursesStr) {
        for (const prof of profs) {
          const notes = $app.findRecordsByFilter(
            'session_notes',
            `professional='${prof.id}' && status='finalizado'`,
            '-created',
            10,
            0,
          )
          if (notes.length === 0) continue

          const complaints = notes
            .map((n) => n.getString('main_complaint') || '')
            .filter(Boolean)
            .join('. ')
          if (!complaints) continue

          const prompt = `Como motor de IA da clínica, recomende capacitação continuada.
Especializações atuais: ${JSON.stringify(prof.get('specializations') || [])}
Resumo de queixas clínicas dos pacientes recentes: ${complaints.substring(0, 1000)}

Cursos Disponíveis (Syntra Academy):
${coursesStr}

Instruções:
Se houver uma forte correlação entre as demandas clínicas recentes e um curso, recomende-o.
Responda APENAS com JSON:
{"recommendation": "Breve justificativa médica para a indicação (pt-BR)", "course_title": "Título exato do curso"}
Se nenhum curso for útil, retorne campos vazios.`

          const aiRes = $ai.chat({
            model: 'fast',
            messages: [{ role: 'system', content: prompt }],
          })

          const reply = aiRes.choices[0].message.content
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim()
          const parsed = JSON.parse(reply)

          if (parsed.course_title && parsed.recommendation) {
            const desc = `Sugestão Educacional (Syntra Academy): Baseado nas demandas de seus atendimentos recentes, sugerimos o curso "${parsed.course_title}". ${parsed.recommendation}`
            try {
              $app.findFirstRecordByFilter(
                'ai_alerts',
                `type='academy' && professional='${prof.id}' && description~'${parsed.course_title}'`,
              )
            } catch (_) {
              const alertCol = $app.findCollectionByNameOrId('ai_alerts')
              const alert = new Record(alertCol)
              alert.set('professional', prof.id)
              alert.set('type', 'academy')
              alert.set('priority', 'baixa')
              alert.set('description', desc)
              alert.set('date_generated', dateGenerated)
              alert.set('is_resolved', false)
              $app.saveNoValidate(alert)
            }
          }
        }
      }
    } catch (err) {}

    return e.json(200, {
      success: true,
      message: 'Processamento de Inteligência Artificial finalizado com sucesso.',
    })
  },
  $apis.requireAuth(),
)
