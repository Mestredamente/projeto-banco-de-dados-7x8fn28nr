migrate(
  (app) => {
    // Update users collection
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role'))
      users.fields.add(
        new SelectField({
          name: 'role',
          values: [
            'gestor_saas',
            'psicologo_autonomo',
            'admin_clinica',
            'psicologo_vinculado',
            'secretaria',
            'paciente',
          ],
          maxSelect: 1,
        }),
      )
    if (!users.fields.getByName('cpf')) users.fields.add(new TextField({ name: 'cpf' }))
    if (!users.fields.getByName('crp')) users.fields.add(new TextField({ name: 'crp' }))
    if (!users.fields.getByName('phone')) users.fields.add(new TextField({ name: 'phone' }))
    if (!users.fields.getByName('is_active')) users.fields.add(new BoolField({ name: 'is_active' }))
    if (!users.fields.getByName('terms_accepted_at'))
      users.fields.add(new DateField({ name: 'terms_accepted_at' }))
    if (!users.fields.getByName('consent_given_at'))
      users.fields.add(new DateField({ name: 'consent_given_at' }))
    if (!users.fields.getByName('last_login_at'))
      users.fields.add(new DateField({ name: 'last_login_at' }))

    app.save(users)
    users.addIndex('idx_users_cpf', true, 'cpf', "cpf != ''")
    app.save(users)

    // 2. Clinics
    const clinics = new Collection({
      name: 'clinics',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      updateRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cnpj', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'is_active', type: 'bool' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_clinics_cnpj ON clinics (cnpj) WHERE cnpj != ''"],
    })
    app.save(clinics)

    // 3. clinic_professionals
    const clinicProfessionals = new Collection({
      name: 'clinic_professionals',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      updateRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        {
          name: 'clinic',
          type: 'relation',
          required: true,
          collectionId: clinics.id,
          maxSelect: 1,
        },
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        {
          name: 'relationship_model',
          type: 'select',
          values: ['aluguel_sala', 'comissionamento', 'contratacao'],
          maxSelect: 1,
        },
        { name: 'commission_percentage', type: 'number' },
        { name: 'monthly_fee', type: 'number' },
        { name: 'fixed_salary', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
        { name: 'can_book_for_professional', type: 'bool' },
        { name: 'can_transfer_patients', type: 'bool' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(clinicProfessionals)

    // 4. patients
    const patients = new Collection({
      name: 'patients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      fields: [
        { name: 'profile', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'cpf', type: 'text' },
        { name: 'rg', type: 'text' },
        { name: 'date_of_birth', type: 'date' },
        { name: 'gender', type: 'text' },
        { name: 'marital_status', type: 'text' },
        { name: 'profession', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'emergency_contact_name', type: 'text' },
        { name: 'emergency_contact_phone', type: 'text' },
        { name: 'emergency_contact_relation', type: 'text' },
        { name: 'health_insurance', type: 'text' },
        { name: 'referred_by', type: 'text' },
        { name: 'consent_form_signed', type: 'bool' },
        { name: 'contract_signed', type: 'bool' },
        { name: 'notes', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_patients_cpf ON patients (cpf) WHERE cpf != ''"],
    })
    app.save(patients)

    // 5. patient_professionals
    const patientProfessionals = new Collection({
      name: 'patient_professionals',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          maxSelect: 1,
        },
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'clinic', type: 'relation', collectionId: clinics.id, maxSelect: 1 },
        { name: 'is_primary', type: 'bool' },
        { name: 'started_at', type: 'date' },
        { name: 'ended_at', type: 'date' },
        { name: 'is_active', type: 'bool' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(patientProfessionals)

    // 6. appointments
    const appointments = new Collection({
      name: 'appointments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          maxSelect: 1,
        },
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'clinic', type: 'relation', collectionId: clinics.id, maxSelect: 1 },
        { name: 'created_by', type: 'relation', collectionId: users.id, maxSelect: 1 },
        { name: 'scheduled_date', type: 'date' },
        { name: 'start_time', type: 'text' },
        { name: 'end_time', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: [
            'agendado',
            'confirmado_paciente',
            'reagendado',
            'cancelado',
            'realizado',
            'falta',
          ],
          maxSelect: 1,
        },
        { name: 'session_type', type: 'text' },
        { name: 'is_paid', type: 'bool' },
        { name: 'session_value', type: 'number' },
        { name: 'notes', type: 'text' },
        { name: 'confirmation_sent_at', type: 'date' },
        { name: 'patient_confirmed_at', type: 'date' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(appointments)

    // 7. session_notes
    const sessionNotes = new Collection({
      name: 'session_notes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'appointment', type: 'relation', collectionId: appointments.id, maxSelect: 1 },
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          maxSelect: 1,
        },
        {
          name: 'professional',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'content', type: 'text' },
        { name: 'structure', type: 'select', values: ['livre', 'soap'], maxSelect: 1 },
        { name: 'soap_subjective', type: 'text' },
        { name: 'soap_objective', type: 'text' },
        { name: 'soap_assessment', type: 'text' },
        { name: 'soap_plan', type: 'text' },
        { name: 'main_complaint', type: 'text' },
        { name: 'interventions', type: 'text' },
        { name: 'referrals', type: 'text' },
        { name: 'homework', type: 'text' },
        { name: 'mood_score', type: 'number' },
        { name: 'is_editable', type: 'bool' },
        { name: 'edited_at', type: 'date' },
        { name: 'edit_reason', type: 'text' },
        { name: 'deleted_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(sessionNotes)
  },
  (app) => {
    const collections = [
      'session_notes',
      'appointments',
      'patient_professionals',
      'patients',
      'clinic_professionals',
      'clinics',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
