onRecordAfterCreateSuccess((e) => {
  const grupoId = e.record.getString('grupo_id')
  const sessaoId = e.record.id

  if (!grupoId) return e.next()

  try {
    const participantes = $app.findRecordsByFilter(
      'participantes_grupo',
      "grupo_id = {:grupoId} && status = 'ativo'",
      '',
      1000,
      0,
      { grupoId },
    )

    const presencaCol = $app.findCollectionByNameOrId('presenca_grupo')

    for (const part of participantes) {
      const pRecord = new Record(presencaCol)
      pRecord.set('sessao_id', sessaoId)
      pRecord.set('participante_id', part.id)
      pRecord.set('presente', false)
      $app.save(pRecord)
    }
  } catch (err) {
    console.log('Error generating presences for session: ' + err.message)
  }

  return e.next()
}, 'sessoes_grupo')
