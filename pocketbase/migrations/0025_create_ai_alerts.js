migrate(
  (app) => {
    const collection = new Collection({
      name: 'ai_alerts',
      type: 'base',
      listRule: "professional = @request.auth.id || @request.auth.role = 'gestor_saas'",
      viewRule: "professional = @request.auth.id || @request.auth.role = 'gestor_saas'",
      createRule: null,
      updateRule: "professional = @request.auth.id || @request.auth.role = 'gestor_saas'",
      deleteRule: "professional = @request.auth.id || @request.auth.role = 'gestor_saas'",
      fields: [
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'clinic',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('clinics').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'patient',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('patients').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['reavaliação', 'evolução', 'crise', 'compra', 'academy'],
          maxSelect: 1,
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          values: ['alta', 'média', 'baixa'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'date_generated', type: 'date', required: true },
        { name: 'is_resolved', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ai_alerts_prof ON ai_alerts (professional)',
        'CREATE INDEX idx_ai_alerts_type ON ai_alerts (type)',
        'CREATE INDEX idx_ai_alerts_res ON ai_alerts (is_resolved)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('ai_alerts')
    app.delete(collection)
  },
)
