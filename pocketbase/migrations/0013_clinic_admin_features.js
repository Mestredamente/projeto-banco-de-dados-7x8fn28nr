migrate(
  (app) => {
    const cp = app.findCollectionByNameOrId('clinic_professionals')
    if (!cp.fields.getByName('custom_permissions')) {
      cp.fields.add(new JSONField({ name: 'custom_permissions' }))
    }
    const relModel = cp.fields.getByName('relationship_model')
    relModel.values = [
      'aluguel_sala',
      'comissionamento',
      'contratacao',
      'clt',
      'pj',
      'comissionado',
    ]
    app.save(cp)

    try {
      app.findCollectionByNameOrId('rooms')
    } catch (_) {
      const rooms = new Collection({
        name: 'rooms',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        updateRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        deleteRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'capacity', type: 'number' },
          { name: 'resources', type: 'json' },
          {
            name: 'clinic',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('clinics').id,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(rooms)
    }

    try {
      app.findCollectionByNameOrId('inventory_items')
    } catch (_) {
      const items = new Collection({
        name: 'inventory_items',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        updateRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        deleteRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'quantity', type: 'number', required: true },
          { name: 'min_stock', type: 'number' },
          { name: 'expiry_date', type: 'date' },
          { name: 'unit_cost', type: 'number' },
          { name: 'supplier', type: 'text' },
          {
            name: 'clinic',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('clinics').id,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(items)
    }

    try {
      app.findCollectionByNameOrId('inventory_logs')
    } catch (_) {
      const logs = new Collection({
        name: 'inventory_logs',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        updateRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        deleteRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
        fields: [
          {
            name: 'item',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('inventory_items').id,
          },
          { name: 'type', type: 'select', required: true, values: ['entrada', 'saída'] },
          { name: 'quantity', type: 'number', required: true },
          { name: 'reason', type: 'text' },
          { name: 'responsible', type: 'relation', collectionId: '_pb_users_auth_' },
          {
            name: 'patient',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('patients').id,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(logs)
    }

    try {
      app.findCollectionByNameOrId('room_reservations')
    } catch (_) {
      const res = new Collection({
        name: 'room_reservations',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'room',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('rooms').id,
          },
          {
            name: 'professional',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
          },
          {
            name: 'patient',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('patients').id,
          },
          { name: 'start_time', type: 'date', required: true },
          { name: 'end_time', type: 'date', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(res)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('room_reservations'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('inventory_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('inventory_items'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('rooms'))
    } catch (_) {}
    const cp = app.findCollectionByNameOrId('clinic_professionals')
    cp.fields.removeByName('custom_permissions')
    const relModel = cp.fields.getByName('relationship_model')
    relModel.values = ['aluguel_sala', 'comissionamento', 'contratacao']
    app.save(cp)
  },
)
