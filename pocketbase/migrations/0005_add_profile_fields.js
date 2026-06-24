migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const fieldsToAdd = [
      new JSONField({ name: 'specializations' }),
      new TextField({ name: 'clinical_approach' }),
      new JSONField({ name: 'schedule' }),
      new JSONField({ name: 'bank_details' }),
    ]

    for (const field of fieldsToAdd) {
      if (!users.fields.getByName(field.name)) {
        users.fields.add(field)
      }
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('specializations')
    users.fields.removeByName('clinical_approach')
    users.fields.removeByName('schedule')
    users.fields.removeByName('bank_details')
    app.save(users)
  },
)
