/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      name: 'anamnesis',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (professional = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || patient.profile = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (professional = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || patient.profile = @request.auth.id)",
      createRule: "@request.auth.id != '' && professional = @request.auth.id",
      updateRule: "@request.auth.id != '' && professional = @request.auth.id",
      deleteRule: "@request.auth.id != '' && professional = @request.auth.id",
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
        {
          name: 'clinic',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('clinics').id,
          maxSelect: 1,
        },
        { name: 'identification', type: 'json', required: false },
        { name: 'complaint', type: 'json', required: false },
        { name: 'history_personal', type: 'json', required: false },
        { name: 'history_medical', type: 'json', required: false },
        { name: 'lifestyle', type: 'json', required: false },
        { name: 'diagnosis', type: 'json', required: false },
        { name: 'status', type: 'select', required: true, values: ['draft', 'completed'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_anamnesis_patient ON anamnesis (patient)',
        'CREATE INDEX idx_anamnesis_professional ON anamnesis (professional)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('anamnesis')
      app.delete(collection)
    } catch (_) {}
  },
)
