routerAdd(
  'GET',
  '/backend/v1/supervisions/{id}/agenda',
  (e) => {
    try {
      const supervisionId = e.request.pathValue('id')
      const supervision = $app.findRecordById('supervisions', supervisionId)

      const userId = e.auth?.id
      if (
        userId !== supervision.getString('supervisor') &&
        userId !== supervision.getString('supervised')
      ) {
        return e.forbiddenError('Not authorized')
      }

      const supervisedId = supervision.getString('supervised')

      const aWeekAgo = new Date()
      aWeekAgo.setDate(aWeekAgo.getDate() - 7)
      const dateStr = aWeekAgo.toISOString().split('T')[0]

      const notes = $app.findRecordsByFilter(
        'session_notes',
        `professional = '${supervisedId}' && session_date >= '${dateStr}'`,
        '-session_date',
        50,
        0,
      )

      if (notes.length === 0) {
        return e.json(200, { summary: 'Nenhuma sessão registrada na última semana.' })
      }

      const prompts = notes
        .map(
          (n) =>
            `- Evolução: ${n.getString('content') || n.getString('main_complaint') || n.getString('internal_observations')}`,
        )
        .join('\n')

      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente de supervisão clínica. Resuma os casos da semana de forma estruturada e totalmente ANONIMIZADA (nunca use nomes ou dados identificáveis). Foque nas queixas principais, técnicas e padrões.',
          },
          { role: 'user', content: `Aqui estão as notas de sessão:\n${prompts}` },
        ],
      })

      return e.json(200, { summary: reply.choices[0].message.content })
    } catch (err) {
      $app.logger().error('Supervision agenda error', 'err', err.message)
      return e.internalServerError('Failed to generate agenda')
    }
  },
  $apis.requireAuth(),
)
