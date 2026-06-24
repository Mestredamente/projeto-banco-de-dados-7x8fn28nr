migrate(
  (app) => {
    const patientColId = app.findCollectionByNameOrId('patients').id

    // 1. referrals
    let referrals
    try {
      referrals = app.findCollectionByNameOrId('referrals')
    } catch (_) {}
    if (!referrals) {
      referrals = new Collection({
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
            collectionId: patientColId,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'source',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          },
          { name: 'destination', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          {
            name: 'status',
            type: 'select',
            values: ['Enviado', 'Aceito', '1ª Sessão', 'Finalizado', 'Recusado'],
            maxSelect: 1,
          },
          { name: 'specialty', type: 'text' },
          { name: 'justification', type: 'text' },
          { name: 'token', type: 'text' },
          { name: 'reason_declined', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ["CREATE UNIQUE INDEX idx_referrals_token ON referrals (token) WHERE token != ''"],
      })
      app.save(referrals)
    }

    // 2. supervisions
    let supervisions
    try {
      supervisions = app.findCollectionByNameOrId('supervisions')
    } catch (_) {}
    if (!supervisions) {
      supervisions = new Collection({
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
          {
            name: 'supervisor',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          },
          {
            name: 'supervised',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            values: ['pendente', 'ativo', 'encerrado', 'recusado'],
            maxSelect: 1,
          },
          {
            name: 'frequency',
            type: 'select',
            values: ['semanal', 'quinzenal', 'mensal'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(supervisions)
    }

    // 3. supervision_logs
    let supervision_logs
    try {
      supervision_logs = app.findCollectionByNameOrId('supervision_logs')
    } catch (_) {}
    if (!supervision_logs) {
      supervision_logs = new Collection({
        name: 'supervision_logs',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'supervision',
            type: 'relation',
            collectionId: supervisions.id,
            required: true,
            maxSelect: 1,
          },
          { name: 'date', type: 'date' },
          { name: 'summary', type: 'text' },
          { name: 'hours', type: 'number' },
          { name: 'observations', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(supervision_logs)
    }

    // 4. academy_courses
    let academy_courses
    try {
      academy_courses = app.findCollectionByNameOrId('academy_courses')
    } catch (_) {}
    if (!academy_courses) {
      academy_courses = new Collection({
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
          { name: 'instructor', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'description', type: 'text' },
          {
            name: 'level',
            type: 'select',
            values: ['Iniciante', 'Intermediário', 'Avançado'],
            maxSelect: 1,
          },
          { name: 'price', type: 'number' },
          { name: 'included_plans', type: 'json' },
          { name: 'rev_share', type: 'number' },
          { name: 'is_active', type: 'bool' },
          { name: 'thumbnail', type: 'file', maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png'] },
          { name: 'thumbnail_url', type: 'text' },
          { name: 'video_url', type: 'text' },
          { name: 'material', type: 'file', maxSelect: 1 },
          { name: 'duration', type: 'text' },
          { name: 'modules', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(academy_courses)
    }

    // 5. academy_enrollments
    let academy_enrollments
    try {
      academy_enrollments = app.findCollectionByNameOrId('academy_enrollments')
    } catch (_) {}
    if (!academy_enrollments) {
      academy_enrollments = new Collection({
        name: 'academy_enrollments',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          },
          {
            name: 'course',
            type: 'relation',
            collectionId: academy_courses.id,
            required: true,
            maxSelect: 1,
          },
          { name: 'progress', type: 'number' },
          { name: 'completed_at', type: 'date' },
          { name: 'certificate_hash', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(academy_enrollments)
    }

    // 6. academy_forum
    let academy_forum
    try {
      academy_forum = app.findCollectionByNameOrId('academy_forum')
    } catch (_) {}
    if (!academy_forum) {
      academy_forum = new Collection({
        name: 'academy_forum',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && user = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
        fields: [
          {
            name: 'course',
            type: 'relation',
            collectionId: academy_courses.id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'user',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: true,
            maxSelect: 1,
          },
          { name: 'content', type: 'text', required: true },
          { name: 'parent_id', type: 'text' },
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
    }

    // Seed course
    try {
      app.findFirstRecordByData('academy_courses', 'title', 'TCC para Transtornos de Ansiedade')
    } catch (_) {
      try {
        const col = app.findCollectionByNameOrId('academy_courses')
        const course = new Record(col)
        course.set('title', 'TCC para Transtornos de Ansiedade')
        course.set('level', 'Intermediário')
        course.set('price', 199.9)
        course.set(
          'description',
          'Aprenda as melhores práticas de Terapia Cognitivo-Comportamental aplicadas aos transtornos de ansiedade. Abordagem prática baseada em evidências.',
        )
        course.set('is_active', true)
        course.set('thumbnail_url', 'https://img.usecurling.com/p/800/600?q=psychology%20study')
        course.set('modules', [
          {
            id: '1',
            title: 'Módulo 1: Introdução e Avaliação',
            duration: 45,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            id: '2',
            title: 'Módulo 2: Técnicas Cognitivas',
            duration: 60,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            id: '3',
            title: 'Módulo 3: Exposição e Prevenção',
            duration: 50,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
        ])
        app.save(course)
      } catch (_) {}
    }
  },
  (app) => {
    const toDelete = [
      'academy_forum',
      'academy_enrollments',
      'academy_courses',
      'supervision_logs',
      'supervisions',
      'referrals',
    ]
    toDelete.forEach((name) => {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    })
  },
)
