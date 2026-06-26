migrate(
  (app) => {
    const convites = new Collection({
      name: 'convites_paciente',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (psicologo_id = @request.auth.id || @request.auth.role = 'gestor_saas')",
      viewRule:
        "@request.auth.id != '' && (psicologo_id = @request.auth.id || @request.auth.role = 'gestor_saas')",
      createRule: "@request.auth.id != '' && psicologo_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && psicologo_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && psicologo_id = @request.auth.id",
      fields: [
        {
          name: 'psicologo_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        {
          name: 'clinica_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clinics').id,
          maxSelect: 1,
        },
        { name: 'paciente_email', type: 'email', required: true },
        { name: 'paciente_nome', type: 'text', required: true },
        { name: 'token', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'utilizado', 'expirado', 'cancelado'],
        },
        { name: 'data_expiracao', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_convites_token ON convites_paciente (token)'],
    })
    app.save(convites)

    const patients = app.findCollectionByNameOrId('patients')
    patients.fields.add(
      new RelationField({ name: 'convidado_por', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    patients.fields.add(new BoolField({ name: 'cadastro_completo' }))
    app.save(patients)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('convites_paciente')
      app.delete(col)
    } catch (e) {}
    try {
      const patients = app.findCollectionByNameOrId('patients')
      patients.fields.removeByName('convidado_por')
      patients.fields.removeByName('cadastro_completo')
      app.save(patients)
    } catch (e) {}
  },
)
