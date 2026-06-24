migrate(
  (app) => {
    const notes = app.findCollectionByNameOrId('session_notes')
    notes.fields.add(new NumberField({ name: 'session_number' }))
    notes.fields.add(new DateField({ name: 'session_date' }))
    notes.fields.add(
      new SelectField({
        name: 'evolution_type',
        values: [
          'Evolução padrão',
          'Intervenção em crise',
          'Reavaliação',
          'Relatório',
          'Encaminhamento',
        ],
        maxSelect: 1,
      }),
    )
    notes.fields.add(new TextField({ name: 'internal_observations' }))
    notes.fields.add(
      new SelectField({ name: 'status', values: ['rascunho', 'finalizado'], maxSelect: 1 }),
    )
    notes.fields.add(new TextField({ name: 'integrity_hash' }))
    notes.fields.add(
      new FileField({
        name: 'attachments',
        maxSelect: 10,
        maxSize: 10485760,
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      }),
    )

    notes.addIndex('idx_session_notes_patient', false, 'patient', '')
    notes.addIndex('idx_session_notes_professional', false, 'professional', '')
    notes.addIndex('idx_session_notes_status', false, 'status', '')
    app.save(notes)

    const patients = app.findCollectionByNameOrId('patients')
    patients.fields.add(new DateField({ name: 'retention_extended_at' }))
    app.save(patients)
  },
  (app) => {
    const notes = app.findCollectionByNameOrId('session_notes')
    notes.fields.removeByName('session_number')
    notes.fields.removeByName('session_date')
    notes.fields.removeByName('evolution_type')
    notes.fields.removeByName('internal_observations')
    notes.fields.removeByName('status')
    notes.fields.removeByName('integrity_hash')
    notes.fields.removeByName('attachments')
    notes.removeIndex('idx_session_notes_patient')
    notes.removeIndex('idx_session_notes_professional')
    notes.removeIndex('idx_session_notes_status')
    app.save(notes)

    const patients = app.findCollectionByNameOrId('patients')
    patients.fields.removeByName('retention_extended_at')
    app.save(patients)
  },
)
