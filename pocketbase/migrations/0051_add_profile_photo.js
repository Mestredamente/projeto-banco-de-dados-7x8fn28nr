migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    if (!col.fields.getByName('profile_photo')) {
      col.fields.add(
        new FileField({
          name: 'profile_photo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    if (col.fields.getByName('profile_photo')) {
      col.fields.removeByName('profile_photo')
    }
    app.save(col)
  },
)
