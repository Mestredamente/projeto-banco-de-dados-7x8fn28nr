migrate(
  (app) => {
    const referrals = new Collection({
      name: 'referrals',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (source = @request.auth.id || destination = @request.auth.id || @request.auth.role = 'gestor_saas')",
      viewRule:
        "@request.auth.id != '' && (source = @request.auth.id || destination = @request.auth.id || @request.auth.role = 'gestor_saas')",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != '' && source = @request.auth.id",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('patients').id,
          required: true,
        },
        { name: 'source', type: 'relation', collectionId: '_pb_users_auth_', required: true },
        { name: 'destination', type: 'relation', collectionId: '_pb_users_auth_' },
        {
          name: 'status',
          type: 'select',
          values: ['Enviado', 'Aceito', '1ª Sessão', 'Finalizado', 'Recusado'],
        },
        { name: 'specialty', type: 'text' },
        { name: 'justification', type: 'text' },
        { name: 'token', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(referrals)
    referrals.addIndex(
      "CREATE UNIQUE INDEX idx_referrals_token ON referrals (token) WHERE token != ''",
      false,
    )
    app.save(referrals)

    const supervisions = new Collection({
      name: 'supervisions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (supervisor = @request.auth.id || supervised = @request.auth.id || @request.auth.role = 'gestor_saas')",
      viewRule:
        "@request.auth.id != '' && (supervisor = @request.auth.id || supervised = @request.auth.id || @request.auth.role = 'gestor_saas')",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != '' && supervisor = @request.auth.id",
      fields: [
        { name: 'supervisor', type: 'relation', collectionId: '_pb_users_auth_', required: true },
        { name: 'supervised', type: 'relation', collectionId: '_pb_users_auth_', required: true },
        { name: 'status', type: 'select', values: ['pendente', 'ativo', 'encerrado', 'recusado'] },
        { name: 'frequency', type: 'select', values: ['semanal', 'quinzenal', 'mensal'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(supervisions)

    const supervision_logs = new Collection({
      name: 'supervision_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'supervision', type: 'relation', collectionId: supervisions.id, required: true },
        { name: 'date', type: 'date' },
        { name: 'summary', type: 'text' },
        { name: 'hours', type: 'number' },
        { name: 'observations', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(supervision_logs)

    const academy_courses = new Collection({
      name: 'academy_courses',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'psicologo_autonomo'",
      updateRule: "@request.auth.role = 'gestor_saas' || instructor = @request.auth.id",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'instructor', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'description', type: 'text' },
        { name: 'level', type: 'select', values: ['Iniciante', 'Intermediário', 'Avançado'] },
        { name: 'price', type: 'number' },
        { name: 'included_plans', type: 'json' },
        { name: 'rev_share', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'thumbnail', type: 'file', maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png'] },
        { name: 'video_url', type: 'text' },
        { name: 'material', type: 'file', maxSelect: 1 },
        { name: 'duration', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(academy_courses)

    const academy_enrollments = new Collection({
      name: 'academy_enrollments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', required: true },
        { name: 'course', type: 'relation', collectionId: academy_courses.id, required: true },
        { name: 'progress', type: 'number' },
        { name: 'completed_at', type: 'date' },
        { name: 'certificate_hash', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(academy_enrollments)

    const academy_forum = new Collection({
      name: 'academy_forum',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        { name: 'course', type: 'relation', collectionId: academy_courses.id, required: true },
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'rating', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(academy_forum)

    academy_forum.fields.add(
      new RelationField({ name: 'parent', collectionId: academy_forum.id, maxSelect: 1 }),
    )
    app.save(academy_forum)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('academy_forum'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('academy_enrollments'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('academy_courses'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('supervision_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('supervisions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('referrals'))
    } catch (_) {}
  },
)
