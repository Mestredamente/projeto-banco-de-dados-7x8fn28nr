migrate(
  (app) => {
    const collection = new Collection({
      name: 'coupons',
      type: 'base',
      listRule: "@request.auth.role = 'gestor_saas'",
      viewRule: "@request.auth.role = 'gestor_saas'",
      createRule: "@request.auth.role = 'gestor_saas'",
      updateRule: "@request.auth.role = 'gestor_saas'",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'code', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['percent', 'value'],
          maxSelect: 1,
        },
        { name: 'value', type: 'number', required: true },
        { name: 'expires_at', type: 'date' },
        { name: 'max_uses', type: 'number' },
        { name: 'current_uses', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_coupons_code ON coupons (code) WHERE code != ''"],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('coupons')
    app.delete(collection)
  },
)
