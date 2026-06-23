migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const clinicsId = app.findCollectionByNameOrId('clinics').id

    const plans = new Collection({
      name: 'plans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'gestor_saas'",
      updateRule: "@request.auth.role = 'gestor_saas'",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'billing_cycle', type: 'select', values: ['mensal', 'anual'], maxSelect: 1 },
        { name: 'max_professionals', type: 'number' },
        { name: 'max_patients', type: 'number' },
        { name: 'features', type: 'json' },
        { name: 'is_active', type: 'bool' },
        { name: 'sort_order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_plans_is_active ON plans (is_active)'],
    })
    app.save(plans)

    const subscriptions = new Collection({
      name: 'subscriptions',
      type: 'base',
      listRule: "@request.auth.role = 'gestor_saas' || subscriber = @request.auth.id",
      viewRule: "@request.auth.role = 'gestor_saas' || subscriber = @request.auth.id",
      createRule: "@request.auth.role = 'gestor_saas'",
      updateRule: "@request.auth.role = 'gestor_saas'",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'subscriber', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'clinic', type: 'relation', collectionId: clinicsId, maxSelect: 1 },
        { name: 'plan', type: 'relation', collectionId: plans.id, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['trial', 'active', 'past_due', 'canceled'],
          maxSelect: 1,
        },
        { name: 'trial_ends_at', type: 'date' },
        { name: 'current_period_start', type: 'date' },
        { name: 'current_period_end', type: 'date' },
        { name: 'canceled_at', type: 'date' },
        { name: 'cancelled_reason', type: 'text' },
        { name: 'payment_gateway_subscription_id', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_subscriptions_status ON subscriptions (status)'],
    })
    app.save(subscriptions)

    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.role = 'gestor_saas'",
      viewRule: "@request.auth.role = 'gestor_saas'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'actor', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'action', type: 'text' },
        { name: 'table_name', type: 'text' },
        { name: 'record_id', type: 'text' },
        { name: 'old_data', type: 'json' },
        { name: 'new_data', type: 'json' },
        { name: 'ip_address', type: 'text' },
        { name: 'user_agent', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(auditLogs)

    const notifications = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: "profile = @request.auth.id || @request.auth.role = 'gestor_saas'",
      viewRule: "profile = @request.auth.id || @request.auth.role = 'gestor_saas'",
      createRule: "@request.auth.role = 'gestor_saas'",
      updateRule: 'profile = @request.auth.id',
      deleteRule: "profile = @request.auth.id || @request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'profile', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'text' },
        { name: 'type', type: 'text' },
        { name: 'reference_table', type: 'text' },
        { name: 'reference_id', type: 'text' },
        { name: 'read', type: 'bool' },
        { name: 'read_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_notifications_read ON notifications (read)'],
    })
    app.save(notifications)

    const timeEntries = new Collection({
      name: 'time_entries',
      type: 'base',
      listRule:
        "secretary = @request.auth.id || employer = @request.auth.id || @request.auth.role = 'gestor_saas'",
      viewRule:
        "secretary = @request.auth.id || employer = @request.auth.id || @request.auth.role = 'gestor_saas'",
      createRule: 'secretary = @request.auth.id || employer = @request.auth.id',
      updateRule: 'secretary = @request.auth.id || employer = @request.auth.id',
      deleteRule: "employer = @request.auth.id || @request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'secretary', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'employer', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'clinic', type: 'relation', collectionId: clinicsId, maxSelect: 1 },
        { name: 'entry_type', type: 'text' },
        { name: 'entry_time', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'notes', type: 'text' },
        { name: 'is_manual_adjustment', type: 'bool' },
        { name: 'adjusted_by', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(timeEntries)

    const vacationRequests = new Collection({
      name: 'vacation_requests',
      type: 'base',
      listRule:
        "requester = @request.auth.id || approver = @request.auth.id || @request.auth.role = 'gestor_saas'",
      viewRule:
        "requester = @request.auth.id || approver = @request.auth.id || @request.auth.role = 'gestor_saas'",
      createRule: 'requester = @request.auth.id',
      updateRule: 'requester = @request.auth.id || approver = @request.auth.id',
      deleteRule: "requester = @request.auth.id || @request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'requester', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'approver', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'aprovada', 'negada'],
          maxSelect: 1,
        },
        { name: 'reason', type: 'text' },
        { name: 'approved_at', type: 'date' },
        { name: 'denied_at', type: 'date' },
        { name: 'denied_reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(vacationRequests)

    // Update existing tables to soft delete logic and new access rules
    const updateCollectionRules = (name, rule) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        const hasDeletedAt = col.fields.getByName('deleted_at') != null
        let newRule = rule
        if (hasDeletedAt) {
          if (rule) {
            newRule = `deleted_at = '' && (${rule})`
          } else {
            newRule = `deleted_at = ''`
          }
        }
        col.listRule = newRule
        col.viewRule = newRule
        app.save(col)
      } catch (_) {}
    }

    updateCollectionRules(
      'patients',
      "profile = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'secretaria'",
    )
    updateCollectionRules('session_notes', 'professional = @request.auth.id')
    updateCollectionRules(
      'diary_entries',
      "patient.profile = @request.auth.id || (type = 'sentimentos' && is_visible_to_professional = true)",
    )
    updateCollectionRules(
      'appointments',
      "professional = @request.auth.id || patient.profile = @request.auth.id || @request.auth.role = 'gestor_saas'",
    )
    updateCollectionRules('messages', 'sender = @request.auth.id || receiver = @request.auth.id')
    updateCollectionRules(
      'financial_records',
      "professional = @request.auth.id || patient.profile = @request.auth.id || @request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
    )
    updateCollectionRules('questionnaires', 'professional = @request.auth.id')
    updateCollectionRules(
      'questionnaire_assignments',
      'professional = @request.auth.id || patient.profile = @request.auth.id',
    )

    const defaultAuthRule = "@request.auth.id != ''"
    updateCollectionRules('clinics', defaultAuthRule)
    updateCollectionRules('clinic_professionals', defaultAuthRule)
    updateCollectionRules('patient_professionals', defaultAuthRule)
    updateCollectionRules('secretary_assignments', defaultAuthRule)
    updateCollectionRules('questionnaire_responses', defaultAuthRule)
    updateCollectionRules('financial_repasses', defaultAuthRule)
    updateCollectionRules('contracts', defaultAuthRule)

    // Indexes
    users.addIndex('idx_users_role', false, 'role', '')
    app.save(users)

    try {
      const appointments = app.findCollectionByNameOrId('appointments')
      appointments.addIndex('idx_appointments_scheduled_date', false, 'scheduled_date', '')
      appointments.addIndex('idx_appointments_status', false, 'status', '')
      app.save(appointments)
    } catch (_) {}

    try {
      const diaryEntries = app.findCollectionByNameOrId('diary_entries')
      diaryEntries.addIndex('idx_diary_entries_entry_date', false, 'entry_date', '')
      diaryEntries.addIndex('idx_diary_entries_is_visible', false, 'is_visible_to_professional', '')
      app.save(diaryEntries)
    } catch (_) {}

    try {
      const clinicProf = app.findCollectionByNameOrId('clinic_professionals')
      clinicProf.addIndex('idx_cp_unique', true, 'clinic, professional', "deleted_at = ''")
      app.save(clinicProf)
    } catch (_) {}

    try {
      const patientProf = app.findCollectionByNameOrId('patient_professionals')
      patientProf.addIndex('idx_pp_unique', true, 'patient, professional', "deleted_at = ''")
      app.save(patientProf)
    } catch (_) {}
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('vacation_requests'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('time_entries'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('notifications'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('audit_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('subscriptions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('plans'))
    } catch (_) {}
  },
)
