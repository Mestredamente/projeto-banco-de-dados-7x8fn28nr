migrate(
  (app) => {
    const patients = app.findCollectionByNameOrId('patients')

    if (!patients.fields.getByName('session_value')) {
      patients.fields.add(new NumberField({ name: 'session_value', min: 0 }))
    }
    if (!patients.fields.getByName('accepted_payment_methods')) {
      patients.fields.add(new JSONField({ name: 'accepted_payment_methods' }))
    }
    if (!patients.fields.getByName('pix_key')) {
      patients.fields.add(new TextField({ name: 'pix_key' }))
    }
    if (!patients.fields.getByName('absence_policy')) {
      patients.fields.add(
        new SelectField({
          name: 'absence_policy',
          values: ['cobra_falta', 'nao_cobra_falta'],
          maxSelect: 1,
        }),
      )
    }
    if (!patients.fields.getByName('billing_notifications')) {
      patients.fields.add(new JSONField({ name: 'billing_notifications' }))
    }
    if (!patients.fields.getByName('auto_billing_enabled')) {
      patients.fields.add(new BoolField({ name: 'auto_billing_enabled' }))
    }
    if (!patients.fields.getByName('billing_frequency')) {
      patients.fields.add(
        new SelectField({
          name: 'billing_frequency',
          values: ['avulsa', 'semanal', 'quinzenal', 'mensal'],
          maxSelect: 1,
        }),
      )
    }
    if (!patients.fields.getByName('billing_day')) {
      patients.fields.add(new NumberField({ name: 'billing_day', min: 1, max: 31, onlyInt: true }))
    }
    if (!patients.fields.getByName('sessions_per_period')) {
      patients.fields.add(
        new NumberField({ name: 'sessions_per_period', min: 1, max: 5, onlyInt: true }),
      )
    }
    if (!patients.fields.getByName('billing_start_date')) {
      patients.fields.add(new DateField({ name: 'billing_start_date' }))
    }
    if (!patients.fields.getByName('cancellation_policy')) {
      patients.fields.add(new TextField({ name: 'cancellation_policy' }))
    }

    app.save(patients)

    const fr = app.findCollectionByNameOrId('financial_records')

    if (!fr.fields.getByName('due_time')) {
      fr.fields.add(new TextField({ name: 'due_time' }))
    }
    if (!fr.fields.getByName('auto_generated')) {
      fr.fields.add(new BoolField({ name: 'auto_generated' }))
    }
    if (!fr.fields.getByName('description')) {
      fr.fields.add(new TextField({ name: 'description' }))
    }

    if (fr.fields.getByName('status')) {
      fr.fields.removeByName('status')
    }
    fr.fields.add(
      new SelectField({
        name: 'status',
        values: [
          'pendente',
          'pago',
          'atrasado',
          'cancelado',
          'estornado',
          'aguardando_confirmacao',
        ],
        maxSelect: 1,
      }),
    )

    app.save(fr)
  },
  (app) => {
    try {
      const patients = app.findCollectionByNameOrId('patients')
      const patientFields = [
        'session_value',
        'accepted_payment_methods',
        'pix_key',
        'absence_policy',
        'billing_notifications',
        'auto_billing_enabled',
        'billing_frequency',
        'billing_day',
        'sessions_per_period',
        'billing_start_date',
        'cancellation_policy',
      ]
      for (const name of patientFields) {
        if (patients.fields.getByName(name)) {
          patients.fields.removeByName(name)
        }
      }
      app.save(patients)
    } catch (_) {}

    try {
      const fr = app.findCollectionByNameOrId('financial_records')
      const frFields = ['due_time', 'auto_generated', 'description']
      for (const name of frFields) {
        if (fr.fields.getByName(name)) {
          fr.fields.removeByName(name)
        }
      }
      if (fr.fields.getByName('status')) {
        fr.fields.removeByName('status')
      }
      fr.fields.add(
        new SelectField({
          name: 'status',
          values: ['pendente', 'pago', 'atrasado', 'cancelado', 'estornado'],
          maxSelect: 1,
        }),
      )
      app.save(fr)
    } catch (_) {}
  },
)
