migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clinics')

    if (!col.fields.getByName('razao_social')) {
      col.fields.add(new TextField({ name: 'razao_social' }))
    }
    if (!col.fields.getByName('crp_pj')) {
      col.fields.add(new TextField({ name: 'crp_pj' }))
    }
    if (!col.fields.getByName('address_cep')) {
      col.fields.add(new TextField({ name: 'address_cep' }))
    }
    if (!col.fields.getByName('address_street')) {
      col.fields.add(new TextField({ name: 'address_street' }))
    }
    if (!col.fields.getByName('address_number')) {
      col.fields.add(new TextField({ name: 'address_number' }))
    }
    if (!col.fields.getByName('address_complement')) {
      col.fields.add(new TextField({ name: 'address_complement' }))
    }
    if (!col.fields.getByName('address_neighborhood')) {
      col.fields.add(new TextField({ name: 'address_neighborhood' }))
    }
    if (!col.fields.getByName('address_city')) {
      col.fields.add(new TextField({ name: 'address_city' }))
    }
    if (!col.fields.getByName('address_state')) {
      col.fields.add(new TextField({ name: 'address_state' }))
    }
    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
        }),
      )
    }
    if (!col.fields.getByName('primary_color')) {
      col.fields.add(new TextField({ name: 'primary_color' }))
    }
    if (!col.fields.getByName('secondary_color')) {
      col.fields.add(new TextField({ name: 'secondary_color' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clinics')

    col.fields.removeByName('razao_social')
    col.fields.removeByName('crp_pj')
    col.fields.removeByName('address_cep')
    col.fields.removeByName('address_street')
    col.fields.removeByName('address_number')
    col.fields.removeByName('address_complement')
    col.fields.removeByName('address_neighborhood')
    col.fields.removeByName('address_city')
    col.fields.removeByName('address_state')
    col.fields.removeByName('logo')
    col.fields.removeByName('primary_color')
    col.fields.removeByName('secondary_color')

    app.save(col)
  },
)
