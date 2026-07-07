migrate(
  (app) => {
    const patientsCol = app.findCollectionByNameOrId('patients')

    const collection = new Collection({
      name: 'profile_audit_log',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (patient_id.profile = @request.auth.id || @request.auth.role != 'paciente')",
      viewRule:
        "@request.auth.id != '' && (patient_id.profile = @request.auth.id || @request.auth.role != 'paciente')",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          required: true,
          collectionId: patientsCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'field_name', type: 'text', required: true },
        { name: 'old_value', type: 'text' },
        { name: 'new_value', type: 'text' },
        { name: 'changed_by', type: 'text' },
        { name: 'ip_address', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_profile_audit_patient ON profile_audit_log (patient_id)',
        'CREATE INDEX idx_profile_audit_created ON profile_audit_log (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('profile_audit_log')
      app.delete(collection)
    } catch (_) {}
  },
)
