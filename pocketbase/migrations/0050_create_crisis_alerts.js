migrate(
  (app) => {
    const patientsId = app.findCollectionByNameOrId('patients').id
    const usersId = '_pb_users_auth_'
    const diaryEntriesId = app.findCollectionByNameOrId('diary_entries').id

    const collection = new Collection({
      name: 'crisis_alerts',
      type: 'base',
      listRule:
        "psychologist_id = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      viewRule:
        "psychologist_id = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      createRule: null,
      updateRule:
        "psychologist_id = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      deleteRule:
        "psychologist_id = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          required: true,
          collectionId: patientsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'psychologist_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'diary_entry_id',
          type: 'relation',
          required: false,
          collectionId: diaryEntriesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'content',
          type: 'text',
          required: false,
          max: 500,
        },
        {
          name: 'severity',
          type: 'select',
          required: true,
          values: ['alto', 'crítico'],
          maxSelect: 1,
        },
        {
          name: 'detected_keywords',
          type: 'json',
          required: false,
        },
        {
          name: 'timestamp',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'email_sent',
          type: 'bool',
          required: false,
        },
        {
          name: 'sms_sent',
          type: 'bool',
          required: false,
        },
        {
          name: 'webhook_url',
          type: 'text',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_crisis_alerts_patient ON crisis_alerts (patient_id)',
        'CREATE INDEX idx_crisis_alerts_psychologist ON crisis_alerts (psychologist_id)',
        'CREATE INDEX idx_crisis_alerts_severity ON crisis_alerts (severity)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('crisis_alerts')
    app.delete(collection)
  },
)
