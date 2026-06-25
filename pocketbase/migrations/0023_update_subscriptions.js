migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('subscriptions')

    if (!col.fields.getByName('cancellation_reason')) {
      col.fields.add(new TextField({ name: 'cancellation_reason' }))
    }
    if (!col.fields.getByName('retention_offer_sent_at')) {
      col.fields.add(new DateField({ name: 'retention_offer_sent_at' }))
    }
    if (!col.fields.getByName('retention_offer_status')) {
      col.fields.add(
        new SelectField({
          name: 'retention_offer_status',
          values: ['pending', 'accepted', 'rejected'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('subscriptions')

    col.fields.removeByName('cancellation_reason')
    col.fields.removeByName('retention_offer_sent_at')
    col.fields.removeByName('retention_offer_status')

    app.save(col)
  },
)
