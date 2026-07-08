migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    col.listRule =
      "((@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado') && professional = @request.auth.id) || @request.auth.role = 'gestor_saas' || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic) || (@request.auth.role = 'paciente' && patient.profile = @request.auth.id)"

    col.viewRule =
      "((@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado') && professional = @request.auth.id) || @request.auth.role = 'gestor_saas' || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic) || (@request.auth.role = 'paciente' && patient.profile = @request.auth.id)"

    col.updateRule =
      "((@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado') && professional = @request.auth.id) || @request.auth.role = 'gestor_saas' || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic) || (@request.auth.role = 'paciente' && patient.profile = @request.auth.id)"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"

    col.updateRule =
      "professional = @request.auth.id || @request.auth.role = 'gestor_saas' || (@request.auth.role = 'admin_clinica' && @request.auth.clinicas_vinculadas ?= clinic)"

    app.save(col)
  },
)
