migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')

    const fields = [
      new RelationField({ name: 'created_by', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      new BoolField({ name: 'ai_consent' }),
      new DateField({ name: 'consent_given_at' }),
      new TextField({ name: 'address_cep' }),
      new TextField({ name: 'address_street' }),
      new TextField({ name: 'address_number' }),
      new TextField({ name: 'address_neighborhood' }),
      new TextField({ name: 'address_city' }),
      new TextField({ name: 'address_state' }),
      new TextField({ name: 'clinical_history' }),
    ]

    for (const f of fields) {
      if (!col.fields.getByName(f.name)) {
        col.fields.add(f)
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    const names = [
      'created_by',
      'ai_consent',
      'consent_given_at',
      'address_cep',
      'address_street',
      'address_number',
      'address_neighborhood',
      'address_city',
      'address_state',
      'clinical_history',
    ]
    for (const name of names) {
      if (col.fields.getByName(name)) {
        col.fields.removeByName(name)
      }
    }
    app.save(col)
  },
)
