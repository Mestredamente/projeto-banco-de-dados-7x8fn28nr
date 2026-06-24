migrate(
  (app) => {
    const collection = new Collection({
      name: 'notification_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'clinic',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('clinics').id,
          maxSelect: 1,
        },
        { name: 'triggers', type: 'json', required: false },
        { name: 'reminder_time', type: 'text', required: false },
        { name: 'templates', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_notif_set_user ON notification_settings (user)'],
    })
    app.save(collection)

    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.fields.add(
      new RelationField({
        name: 'patient',
        maxSelect: 1,
        collectionId: app.findCollectionByNameOrId('patients').id,
      }),
    )
    notifications.fields.add(
      new SelectField({ name: 'channel', values: ['email', 'push', 'in_app'], maxSelect: 1 }),
    )
    notifications.fields.add(
      new SelectField({
        name: 'status',
        values: ['Enviada', 'Entregue', 'Lida', 'Erro'],
        maxSelect: 1,
      }),
    )
    app.save(notifications)
  },
  (app) => {
    const settings = app.findCollectionByNameOrId('notification_settings')
    app.delete(settings)

    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.fields.removeByName('patient')
    notifications.fields.removeByName('channel')
    notifications.fields.removeByName('status')
    app.save(notifications)
  },
)
