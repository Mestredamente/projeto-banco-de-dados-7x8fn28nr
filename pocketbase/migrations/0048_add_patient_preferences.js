migrate(
  (app) => {
    const patients = app.findCollectionByNameOrId('patients')

    if (!patients.fields.getByName('status_convite')) {
      patients.fields.add(
        new SelectField({ name: 'status_convite', values: ['pendente', 'aceito'], maxSelect: 1 }),
      )
    }
    if (!patients.fields.getByName('horario_preferencial')) {
      patients.fields.add(
        new SelectField({
          name: 'horario_preferencial',
          values: ['manha', 'tarde', 'noite', 'indiferente'],
          maxSelect: 1,
        }),
      )
    }
    if (!patients.fields.getByName('dias_preferidos')) {
      patients.fields.add(new JSONField({ name: 'dias_preferidos' }))
    }
    if (!patients.fields.getByName('forma_pagamento')) {
      patients.fields.add(
        new SelectField({
          name: 'forma_pagamento',
          values: ['particular', 'convenio', 'plano', 'a_definir'],
          maxSelect: 1,
        }),
      )
    }
    if (!patients.fields.getByName('status_paciente')) {
      patients.fields.add(
        new SelectField({
          name: 'status_paciente',
          values: ['ativo', 'inativo', 'aguardando', 'avaliacao', 'alta', 'transferido'],
          maxSelect: 1,
        }),
      )
    }
    if (!patients.fields.getByName('observacoes_adicionais')) {
      patients.fields.add(new TextField({ name: 'observacoes_adicionais' }))
    }
    if (!patients.fields.getByName('contato_emergencia')) {
      patients.fields.add(new TextField({ name: 'contato_emergencia' }))
    }
    if (!patients.fields.getByName('indicacao')) {
      patients.fields.add(new TextField({ name: 'indicacao' }))
    }
    app.save(patients)

    const convites = app.findCollectionByNameOrId('convites_paciente')
    if (!convites.fields.getByName('patient')) {
      convites.fields.add(
        new RelationField({ name: 'patient', collectionId: patients.id, maxSelect: 1 }),
      )
    }
    app.save(convites)
  },
  (app) => {
    try {
      const patients = app.findCollectionByNameOrId('patients')
      patients.fields.removeByName('status_convite')
      patients.fields.removeByName('horario_preferencial')
      patients.fields.removeByName('dias_preferidos')
      patients.fields.removeByName('forma_pagamento')
      patients.fields.removeByName('status_paciente')
      patients.fields.removeByName('observacoes_adicionais')
      patients.fields.removeByName('contato_emergencia')
      patients.fields.removeByName('indicacao')
      app.save(patients)
    } catch (e) {}

    try {
      const convites = app.findCollectionByNameOrId('convites_paciente')
      convites.fields.removeByName('patient')
      app.save(convites)
    } catch (e) {}
  },
)
