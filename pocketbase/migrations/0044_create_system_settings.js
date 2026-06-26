migrate(
  (app) => {
    const collection = new Collection({
      name: 'system_settings',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor_saas'",
      updateRule: "@request.auth.role = 'gestor_saas'",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        {
          name: 'logo',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 2097152, // 2MB
          mimeTypes: ['image/png', 'image/svg+xml', 'image/webp'],
        },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('system_settings')
      app.delete(collection)
    } catch (_) {}
  },
)
