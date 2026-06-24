migrate(
  (app) => {
    const patients = app.findCollectionByNameOrId('patients')
    if (!patients.fields.getByName('portal_permissions')) {
      patients.fields.add(new JSONField({ name: 'portal_permissions' }))
    }
    app.save(patients)

    const sessionNotes = app.findCollectionByNameOrId('session_notes')
    if (!sessionNotes.fields.getByName('shared_with_patient')) {
      sessionNotes.fields.add(new BoolField({ name: 'shared_with_patient' }))
    }
    app.save(sessionNotes)

    const appointments = app.findCollectionByNameOrId('appointments')
    if (!appointments.fields.getByName('meeting_link')) {
      appointments.fields.add(new TextField({ name: 'meeting_link' }))
    }
    app.save(appointments)

    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.createRule = "@request.auth.id != ''"
    app.save(notifications)
  },
  (app) => {
    const patients = app.findCollectionByNameOrId('patients')
    patients.fields.removeByName('portal_permissions')
    app.save(patients)

    const sessionNotes = app.findCollectionByNameOrId('session_notes')
    sessionNotes.fields.removeByName('shared_with_patient')
    app.save(sessionNotes)

    const appointments = app.findCollectionByNameOrId('appointments')
    appointments.fields.removeByName('meeting_link')
    app.save(appointments)

    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.createRule = "@request.auth.role = 'gestor_saas'"
    app.save(notifications)
  },
)
