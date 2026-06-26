migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('sala_fixa')) {
      users.fields.add(new TextField({ name: 'sala_fixa' }))
    }
    app.save(users)

    const termos = new Collection({
      name: 'termos_telepsicologia',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('patients').id,
          maxSelect: 1,
        },
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'accepted_at', type: 'date' },
        { name: 'term_content', type: 'text', required: true },
        { name: 'status', type: 'select', values: ['Pendente', 'Aceito'], required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(termos)

    const docs = new Collection({
      name: 'telepsicologia_documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 52428800 },
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('patients').id,
          maxSelect: 1,
        },
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'appointment',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('appointments').id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docs)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('sala_fixa')
    app.save(users)

    app.delete(app.findCollectionByNameOrId('termos_telepsicologia'))
    app.delete(app.findCollectionByNameOrId('telepsicologia_documents'))
  },
)
