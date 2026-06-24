/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const patients = app.findCollectionByNameOrId('patients')
    if (!patients.fields.getByName('research_consent')) {
      patients.fields.add(new BoolField({ name: 'research_consent' }))
      app.save(patients)
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('academic_title')) {
      users.fields.add(new TextField({ name: 'academic_title' }))
      users.fields.add(new TextField({ name: 'academic_institution' }))
      users.fields.add(new JSONField({ name: 'research_areas' }))
      app.save(users)
    }

    try {
      app.findCollectionByNameOrId('research_exports')
    } catch (_) {
      const researchExports = new Collection({
        name: 'research_exports',
        type: 'base',
        listRule: "@request.auth.id != '' && user = @request.auth.id",
        viewRule: "@request.auth.id != '' && user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && user = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'export_type',
            type: 'select',
            required: true,
            values: ['XML', 'CSV', 'PDF', 'DOCX'],
            maxSelect: 1,
          },
          { name: 'records_count', type: 'number', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(researchExports)
    }
  },
  (app) => {
    const patients = app.findCollectionByNameOrId('patients')
    patients.fields.removeByName('research_consent')
    app.save(patients)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('academic_title')
    users.fields.removeByName('academic_institution')
    users.fields.removeByName('research_areas')
    app.save(users)

    try {
      const col = app.findCollectionByNameOrId('research_exports')
      app.delete(col)
    } catch (_) {}
  },
)
