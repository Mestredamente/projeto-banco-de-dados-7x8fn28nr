migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    if (!col.fields.getByName('address_complement')) {
      col.fields.add(new TextField({ name: 'address_complement' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    const field = col.fields.getByName('address_complement')
    if (field) {
      col.fields.remove(field)
    }
    app.save(col)
  },
)
