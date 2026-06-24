migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('onboarding_step')) {
      users.fields.add(new NumberField({ name: 'onboarding_step' }))
    }
    if (!users.fields.getByName('onboarding_completed')) {
      users.fields.add(new BoolField({ name: 'onboarding_completed' }))
    }
    if (!users.fields.getByName('show_tips')) {
      users.fields.add(new BoolField({ name: 'show_tips' }))
    }
    app.save(users)

    try {
      app.findCollectionByNameOrId('system_manual')
    } catch (_) {
      const manual = new Collection({
        name: 'system_manual',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'gestor_saas'",
        updateRule: "@request.auth.role = 'gestor_saas'",
        deleteRule: "@request.auth.role = 'gestor_saas'",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text' },
          { name: 'category', type: 'text' },
          {
            name: 'type',
            type: 'select',
            values: ['article', 'faq', 'glossary', 'video'],
            required: true,
            maxSelect: 1,
          },
          { name: 'video_url', type: 'url' },
          { name: 'video_duration', type: 'text' },
          { name: 'sort_order', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(manual)
    }

    try {
      app.findCollectionByNameOrId('feedbacks')
    } catch (_) {
      const feedbacks = new Collection({
        name: 'feedbacks',
        type: 'base',
        listRule: "@request.auth.role = 'gestor_saas'",
        viewRule: "@request.auth.role = 'gestor_saas'",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'gestor_saas'",
        deleteRule: "@request.auth.role = 'gestor_saas'",
        fields: [
          { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'rating', type: 'number', min: 1, max: 5 },
          { name: 'comment', type: 'text' },
          {
            name: 'screenshot',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          { name: 'system_version', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(feedbacks)
    }
  },
  (app) => {
    try {
      const manual = app.findCollectionByNameOrId('system_manual')
      app.delete(manual)
    } catch (e) {}

    try {
      const feedbacks = app.findCollectionByNameOrId('feedbacks')
      app.delete(feedbacks)
    } catch (e) {}
  },
)
