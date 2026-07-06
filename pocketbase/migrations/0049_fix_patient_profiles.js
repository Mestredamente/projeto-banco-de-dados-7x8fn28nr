migrate(
  (app) => {
    // 1. Batch fix: Link patients with missing profile to users by email
    const orphanPatients = app
      .db()
      .newQuery("SELECT id, email, name FROM patients WHERE profile IS NULL OR profile = ''")
      .all()

    let fixed = 0
    let notFound = 0
    let noEmail = 0

    for (const row of orphanPatients) {
      if (!row.email || row.email.trim() === '') {
        noEmail++
        continue
      }

      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', row.email)
        const patient = app.findRecordById('patients', row.id)
        patient.set('profile', user.id)
        app.save(patient)
        fixed++
      } catch (_) {
        notFound++
      }
    }

    console.log('=== Patient Profile Linkage Fix ===')
    console.log('Total orphan patients: ' + orphanPatients.length)
    console.log('Records corrected: ' + fixed)
    console.log('No matching user: ' + notFound)
    console.log('No email on record: ' + noEmail)

    var remainingRows = app
      .db()
      .newQuery("SELECT COUNT(*) as cnt FROM patients WHERE profile IS NULL OR profile = ''")
      .all()
    var remaining = remainingRows.length > 0 ? remainingRows[0].cnt : 0
    console.log('Remaining patients without profile: ' + remaining)
    console.log('=== End Profile Linkage Fix ===')

    // 2. Update createRule to enforce profile for patient self-registration
    var patientsCol = app.findCollectionByNameOrId('patients')
    patientsCol.createRule =
      "(@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'gestor_saas') || (@request.auth.role = 'paciente' && @request.body.profile = @request.auth.id)"
    app.save(patientsCol)
  },
  (app) => {
    // No down migration — profile links cannot be safely reversed
  },
)
