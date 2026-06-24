migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clinical_insights')
    if (!col.fields.getByName('feedback')) {
      col.fields.add(
        new SelectField({ name: 'feedback', values: ['util', 'nao_util'], maxSelect: 1 }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clinical_insights')
    if (col.fields.getByName('feedback')) {
      col.fields.removeByName('feedback')
      app.save(col)
    }
  },
)
