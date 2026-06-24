routerAdd(
  'GET',
  '/backend/v1/supervisions/{id}/summary',
  (e) => {
    const id = e.request.pathValue('id')
    const supervision = $app.findRecordById('supervisions', id)

    if (
      supervision.getString('supervisor') !== e.auth?.id &&
      supervision.getString('supervised') !== e.auth?.id
    ) {
      return e.forbiddenError('Não autorizado')
    }

    const supervisedId = supervision.getString('supervised')

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const notes = $app.findRecordsByFilter(
      'session_notes',
      `professional = '${supervisedId}' && created >= '${sevenDaysAgo.toISOString().split('T')[0]} 00:00:00Z'`,
      '-created',
      50,
      0,
    )

    if (notes.length === 0) {
      return e.json(200, { summary: 'Nenhuma sessão registrada na última semana.' })
    }

    const notesText = notes
      .map(
        (n) =>
          `Sessão: ${n.getString('main_complaint') || 'Sem queixa'} - ${n.getString('content') || ''}`,
      )
      .join('\n\n')

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            "Você é um assistente de supervisão clínica. Resuma as seguintes notas de sessão da última semana em uma pauta anonimizada para uma supervisão clínica. Não inclua NENHUM DADO SENSÍVEL (nomes, locais exatos, etc). Agrupe por temas/diagnósticos (ex: 'Casos da semana: 3 sessões de TAG, 1 caso de luto'). Responda de forma concisa e profissional em Português do Brasil.",
        },
        { role: 'user', content: notesText },
      ],
    })

    return e.json(200, { summary: reply.choices[0].message.content })
  },
  $apis.requireAuth(),
)
