migrate((app) => {
  const col = app.findCollectionByNameOrId("patients")
  
  if (!col.fields.getByName("primeiro_acesso_portal")) {
    col.fields.add(new BoolField({ name: "primeiro_acesso_portal" }))
  }
  if (!col.fields.getByName("minor_guardian_name")) {
    col.fields.add(new TextField({ name: "minor_guardian_name" }))
  }
  if (!col.fields.getByName("minor_guardian_cpf")) {
    col.fields.add(new TextField({ name: "minor_guardian_cpf" }))
  }
  if (!col.fields.getByName("consent_history")) {
    col.fields.add(new JSONField({ name: "consent_history" }))
  }
  
  app.save(col)
}, (app) => {
  const col = app.findCollectionByNameOrId("patients")
  
  col.fields.removeByName("primeiro_acesso_portal")
  col.fields.removeByName("minor_guardian_name")
  col.fields.removeByName("minor_guardian_cpf")
  col.fields.removeByName("consent_history")
  
  app.save(col)
})
