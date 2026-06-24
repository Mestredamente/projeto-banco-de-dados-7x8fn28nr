migrate(
  (app) => {
    const patientsId = app.findCollectionByNameOrId('patients').id
    const sessionNotesId = app.findCollectionByNameOrId('session_notes').id

    const collection = new Collection({
      name: 'clinical_insights',
      type: 'base',
      listRule: "professional = @request.auth.id || @request.auth.role = 'gestor_saas'",
      viewRule: "professional = @request.auth.id || @request.auth.role = 'gestor_saas'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patientsId,
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
          name: 'session_note',
          type: 'relation',
          required: true,
          collectionId: sessionNotesId,
          maxSelect: 1,
        },
        { name: 'summary', type: 'text' },
        { name: 'detected_patterns', type: 'json' },
        { name: 'risk_alerts', type: 'json' },
        { name: 'abandoned_topics', type: 'json' },
        { name: 'intervention_suggestion', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clinical_insights_patient ON clinical_insights (patient)',
        'CREATE INDEX idx_clinical_insights_session ON clinical_insights (session_note)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clinical_insights')
    app.delete(collection)
  },
)
