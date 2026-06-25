migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')

    if (!col.fields.getByName('legal_guardian_name')) {
      col.fields.add(new TextField({ name: 'legal_guardian_name' }))
    }

    if (!col.fields.getByName('legal_guardian_cpf')) {
      col.fields.add(new TextField({ name: 'legal_guardian_cpf' }))
    }

    if (!col.fields.getByName('first_access')) {
      col.fields.add(new BoolField({ name: 'first_access' }))
    }

    app.save(col)

    // Atualizar registros existentes para terem first_access = false
    app.db().newQuery('UPDATE patients SET first_access = 0').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')

    if (col.fields.getByName('legal_guardian_name')) {
      col.fields.removeByName('legal_guardian_name')
    }

    if (col.fields.getByName('legal_guardian_cpf')) {
      col.fields.removeByName('legal_guardian_cpf')
    }

    if (col.fields.getByName('first_access')) {
      col.fields.removeByName('first_access')
    }

    app.save(col)
  },
)
