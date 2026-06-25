migrate(
  (app) => {
    const collectionsInOrder = [
      'diary_entries',
      'clinical_insights',
      'session_notes',
      'anamnesis',
      'appointments',
      'financial_repasses',
      'financial_records',
      'secretary_assignments',
      'clinic_professionals',
      'patient_professionals',
      'patients',
      'clinics',
    ]

    for (const colName of collectionsInOrder) {
      try {
        // Fetch up to 100,000 records to ensure we catch all mocked data.
        // Filtering by "id != ''" handles fetching all records safely.
        const records = app.findRecordsByFilter(colName, "id != ''", '', 100000, 0)

        if (records && records.length > 0) {
          for (const record of records) {
            try {
              app.delete(record)
            } catch (err) {
              console.log(
                `Failed to delete record ${record.id} from ${colName}:`,
                err.message || String(err),
              )
            }
          }
        }
      } catch (err) {
        console.log(`Failed to fetch/delete from ${colName}:`, err.message || String(err))
      }
    }

    // Selective User Deletion: Clear users except 'mestredamente1@gmail.com'
    try {
      const users = app.findRecordsByFilter(
        'users',
        "email != 'mestredamente1@gmail.com'",
        '',
        100000,
        0,
      )

      if (users && users.length > 0) {
        for (const user of users) {
          try {
            app.delete(user)
          } catch (err) {
            console.log(`Failed to delete user ${user.id}:`, err.message || String(err))
          }
        }
      }
    } catch (err) {
      console.log('Failed to fetch/delete from users:', err.message || String(err))
    }
  },
  (app) => {
    // This is a data cleanup migration; it cannot be reversed.
  },
)
