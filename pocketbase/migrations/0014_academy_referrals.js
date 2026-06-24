migrate(
  (app) => {
    const referrals = new Collection({
      name: 'referrals',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'gestor_saas'",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('patients').id,
        },
        { name: 'source', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'destination', type: 'relation', collectionId: '_pb_users_auth_' },
        {
          name: 'status',
          type: 'select',
          values: ['Enviado', 'Aceito', '1ª Sessão', 'Finalizado', 'Recusado'],
        },
        { name: 'specialty', type: 'text' },
        { name: 'justification', type: 'text' },
        { name: 'token', type: 'text' },
        { name: 'reason_declined', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(referrals)

    const supervisions = new Collection({
      name: 'supervisions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'supervisor', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'supervised', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'status', type: 'select', values: ['pendente', 'ativo', 'encerrado'] },
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
        { name: 'supervision', type: 'relation', collectionId: supervisions.id },
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
      createRule: "@request.auth.role = 'gestor_saas'",
      updateRule: "@request.auth.role = 'gestor_saas'",
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
        { name: 'thumbnail_url', type: 'text' },
        { name: 'modules', type: 'json' },
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
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'course', type: 'relation', collectionId: academy_courses.id },
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
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'course', type: 'relation', collectionId: academy_courses.id },
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'content', type: 'text' },
        { name: 'parent_id', type: 'text' },
        { name: 'rating', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(academy_forum)

    // Seed course
    const course = new Record(academy_courses)
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
