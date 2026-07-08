migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    col.updateRule =
      "professional = @request.auth.id || @request.auth.role = 'gestor_saas' || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)"

    col.deleteRule =
      "professional = @request.auth.id || @request.auth.role = 'gestor_saas' || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    col.updateRule =
      "professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)"

    col.deleteRule =
      "professional = @request.auth.id || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)"

    app.save(col)
  },
)
