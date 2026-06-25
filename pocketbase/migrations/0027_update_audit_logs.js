migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.listRule =
      "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'secretaria'"
    col.viewRule =
      "@request.auth.role = 'gestor_saas' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'secretaria'"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.listRule = "@request.auth.role = 'gestor_saas'"
    col.viewRule = "@request.auth.role = 'gestor_saas'"
    app.save(col)
  },
)
