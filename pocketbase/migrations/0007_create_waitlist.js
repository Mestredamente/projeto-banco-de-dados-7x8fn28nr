migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const patients = app.findCollectionByNameOrId('patients')

    const waitlist = new Collection({
      name: 'waitlist',
      type: 'base',
      listRule: "@request.auth.id != '' && professional = @request.auth.id",
      viewRule: "@request.auth.id != '' && professional = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && professional = @request.auth.id",
      deleteRule: "@request.auth.id != '' && professional = @request.auth.id",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          collectionId: patients.id,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'professional',
          type: 'relation',
          collectionId: users.id,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['novos_pacientes', 'reagendamento'],
          required: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_waitlist_professional ON waitlist (professional)'],
    })
    app.save(waitlist)
  },
  (app) => {
    try {
      const waitlist = app.findCollectionByNameOrId('waitlist')
      app.delete(waitlist)
    } catch (_) {}
  },
)
