migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const clinicsId = app.findCollectionByNameOrId('clinics').id
    const patientsId = app.findCollectionByNameOrId('patients').id
    const appointmentsId = app.findCollectionByNameOrId('appointments').id

    const rule = "@request.auth.id != ''"

    // 1. secretary_assignments
    const secretaryAssignments = new Collection({
      name: 'secretary_assignments',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'secretary', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'employer', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'clinic', type: 'relation', collectionId: clinicsId, maxSelect: 1 },
        { name: 'permissions', type: 'json' },
        { name: 'is_active', type: 'bool' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(secretaryAssignments)

    // 2. diary_entries
    const diaryEntries = new Collection({
      name: 'diary_entries',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'patient', type: 'relation', collectionId: patientsId, maxSelect: 1 },
        { name: 'type', type: 'select', values: ['pessoal', 'sentimentos'], maxSelect: 1 },
        { name: 'content', type: 'text' },
        { name: 'mood', type: 'text' },
        { name: 'mood_score', type: 'number' },
        { name: 'is_visible_to_professional', type: 'bool' },
        { name: 'entry_date', type: 'date' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(diaryEntries)

    // 3. questionnaires
    const questionnaires = new Collection({
      name: 'questionnaires',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'professional', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'title', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'questions', type: 'json' },
        { name: 'is_active', type: 'bool' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(questionnaires)

    // 4. questionnaire_assignments
    const questionnaireAssignments = new Collection({
      name: 'questionnaire_assignments',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'questionnaire', type: 'relation', collectionId: questionnaires.id, maxSelect: 1 },
        { name: 'patient', type: 'relation', collectionId: patientsId, maxSelect: 1 },
        { name: 'professional', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'assigned_at', type: 'date' },
        { name: 'due_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'respondido', 'expirado'],
          maxSelect: 1,
        },
        { name: 'completed_at', type: 'date' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(questionnaireAssignments)

    // 5. questionnaire_responses
    const questionnaireResponses = new Collection({
      name: 'questionnaire_responses',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        {
          name: 'assignment',
          type: 'relation',
          collectionId: questionnaireAssignments.id,
          maxSelect: 1,
        },
        { name: 'responses', type: 'json' },
        { name: 'submitted_at', type: 'date' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(questionnaireResponses)

    // 6. financial_records
    const financialRecords = new Collection({
      name: 'financial_records',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'patient', type: 'relation', collectionId: patientsId, maxSelect: 1 },
        { name: 'professional', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'clinic', type: 'relation', collectionId: clinicsId, maxSelect: 1 },
        { name: 'appointment', type: 'relation', collectionId: appointmentsId, maxSelect: 1 },
        {
          name: 'type',
          type: 'select',
          values: ['sessao', 'pacote', 'mensalidade', 'reembolso', 'estorno', 'outro'],
          maxSelect: 1,
        },
        { name: 'value', type: 'number' },
        { name: 'discount', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'payment_method', type: 'text' },
        { name: 'payment_date', type: 'date' },
        { name: 'due_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'pago', 'atrasado', 'cancelado', 'estornado'],
          maxSelect: 1,
        },
        { name: 'receipt_url', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(financialRecords)

    // 7. financial_repasses
    const financialRepasses = new Collection({
      name: 'financial_repasses',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'clinic', type: 'relation', collectionId: clinicsId, maxSelect: 1 },
        { name: 'professional', type: 'relation', collectionId: usersId, maxSelect: 1 },
        {
          name: 'financial_record',
          type: 'relation',
          collectionId: financialRecords.id,
          maxSelect: 1,
        },
        { name: 'session_value', type: 'number' },
        { name: 'commission_percentage', type: 'number' },
        { name: 'professional_value', type: 'number' },
        { name: 'clinic_value', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'repassado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'repassed_at', type: 'date' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(financialRepasses)

    // 8. contracts
    const contracts = new Collection({
      name: 'contracts',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'patient', type: 'relation', collectionId: patientsId, maxSelect: 1 },
        { name: 'professional', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'clinic', type: 'relation', collectionId: clinicsId, maxSelect: 1 },
        { name: 'content', type: 'text' },
        { name: 'signed_by_patient', type: 'bool' },
        { name: 'signed_by_professional', type: 'bool' },
        { name: 'patient_signed_at', type: 'date' },
        { name: 'professional_signed_at', type: 'date' },
        { name: 'valid_until', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['rascunho', 'pendente_assinatura', 'ativo', 'encerrado'],
          maxSelect: 1,
        },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(contracts)

    // 9. messages
    const messages = new Collection({
      name: 'messages',
      type: 'base',
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
      fields: [
        { name: 'sender', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'receiver', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'patient', type: 'relation', collectionId: patientsId, maxSelect: 1 },
        { name: 'content', type: 'text' },
        {
          name: 'message_type',
          type: 'select',
          values: ['texto', 'audio', 'imagem', 'arquivo'],
          maxSelect: 1,
        },
        { name: 'attachment_url', type: 'text' },
        { name: 'read_at', type: 'date' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(messages)
  },
  (app) => {
    const collections = [
      'messages',
      'contracts',
      'financial_repasses',
      'financial_records',
      'questionnaire_responses',
      'questionnaire_assignments',
      'questionnaires',
      'diary_entries',
      'secretary_assignments',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
