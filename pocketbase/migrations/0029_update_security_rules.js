migrate(
  (app) => {
    // 1. Update users collection with new fields for hierarchical access
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('profile')) {
      users.fields.add(new TextField({ name: 'profile' }))
    }
    if (!users.fields.getByName('clinicas_vinculadas')) {
      users.fields.add(
        new RelationField({
          name: 'clinicas_vinculadas',
          collectionId: app.findCollectionByNameOrId('clinics').id,
          maxSelect: 999,
        }),
      )
    }
    if (!users.fields.getByName('profissionais_da_clinica')) {
      users.fields.add(
        new RelationField({
          name: 'profissionais_da_clinica',
          collectionId: '_pb_users_auth_',
          maxSelect: 999,
        }),
      )
    }
    if (!users.fields.getByName('contexto_ativo')) {
      users.fields.add(new TextField({ name: 'contexto_ativo' }))
    }
    app.save(users)

    const updateRules = (colName, rules) => {
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (rules.list !== undefined) col.listRule = rules.list
        if (rules.view !== undefined) col.viewRule = rules.view
        if (rules.create !== undefined) col.createRule = rules.create
        if (rules.update !== undefined) col.updateRule = rules.update
        if (rules['delete'] !== undefined) col.deleteRule = rules['delete']
        app.save(col)
      } catch (e) {
        console.log('Collection not found or error:', colName, e)
      }
    }

    // 2. Patients Collection
    // Isolation by creator (professional), with clinic admin/secretary access granted through profissionais_da_clinica.
    updateRules('patients', {
      list: "@request.auth.role = 'gestor_saas' || created_by = @request.auth.id || profile = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.profissionais_da_clinica ?= created_by)",
      view: "@request.auth.role = 'gestor_saas' || created_by = @request.auth.id || profile = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.profissionais_da_clinica ?= created_by)",
      create:
        "@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica'",
      update:
        "@request.auth.role = 'gestor_saas' || created_by = @request.auth.id || profile = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.profissionais_da_clinica ?= created_by)",
      delete:
        "created_by = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.profissionais_da_clinica ?= created_by)",
    })

    // 3. Appointments Collection
    // Secretaries can manage (CRUD except delete) schedules, but cannot delete.
    updateRules('appointments', {
      list: "@request.auth.role = 'gestor_saas' || professional = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.profissionais_da_clinica ?= professional)",
      view: "@request.auth.role = 'gestor_saas' || professional = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.profissionais_da_clinica ?= professional)",
      create:
        "@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria'",
      update:
        "professional = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.profissionais_da_clinica ?= professional)",
      delete:
        "professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.profissionais_da_clinica ?= professional)",
    })

    // 4. Session Notes Collection
    // Highly sensitive. Secretaries explicitly excluded.
    updateRules('session_notes', {
      list: "@request.auth.role = 'gestor_saas' || professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.profissionais_da_clinica ?= professional)",
      view: "@request.auth.role = 'gestor_saas' || professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.profissionais_da_clinica ?= professional)",
      create:
        "professional = @request.auth.id && (@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica')",
      update:
        "professional = @request.auth.id && (@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica')",
      delete: 'professional = @request.auth.id',
    })

    // 5. Financial Records Collection
    // Secretaries can view but not edit or create.
    updateRules('financial_records', {
      list: "@request.auth.role = 'gestor_saas' || professional = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.clinicas_vinculadas ?= clinic)",
      view: "@request.auth.role = 'gestor_saas' || professional = @request.auth.id || ((@request.auth.role = 'admin_clinica' || @request.auth.role = 'secretaria') && @request.auth.clinicas_vinculadas ?= clinic)",
      create:
        "@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica'",
      update:
        "professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)",
      delete:
        "professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)",
    })

    // 6. Clinic Management Rules
    updateRules('clinic_professionals', {
      list: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || professional = @request.auth.id",
      view: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || professional = @request.auth.id",
      create: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      update: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      delete: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
    })

    updateRules('rooms', {
      list: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.clinicas_vinculadas ?= clinic",
      view: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.clinicas_vinculadas ?= clinic",
      create: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      update: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      delete: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
    })

    updateRules('inventory_items', {
      list: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.clinicas_vinculadas ?= clinic",
      view: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.clinicas_vinculadas ?= clinic",
      create: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      update: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      delete: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
    })

    updateRules('secretary_assignments', {
      list: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || secretary = @request.auth.id",
      view: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || secretary = @request.auth.id",
      create: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      update: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
      delete: "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica'",
    })
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      users.fields.removeByName('profile')
    } catch (_) {}
    try {
      users.fields.removeByName('clinicas_vinculadas')
    } catch (_) {}
    try {
      users.fields.removeByName('profissionais_da_clinica')
    } catch (_) {}
    try {
      users.fields.removeByName('contexto_ativo')
    } catch (_) {}
    app.save(users)
  },
)
