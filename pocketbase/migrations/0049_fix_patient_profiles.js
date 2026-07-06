migrate(
  (app) => {
    const orphanPatients = app.findRecordsByFilter(
      'patients',
      "profile = null || profile = ''",
      'created',
      0,
      0,
    )

    let fixed = 0
    let notFound = 0
    let noEmail = 0

    for (const patient of orphanPatients) {
      const email = patient.getString('email')
      if (!email || email.trim() === '') {
        noEmail++
        continue
      }

      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', email)
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
    console.log('=== End Profile Linkage Fix ===')

    var patientsCol = app.findCollectionByNameOrId('patients')
    patientsCol.createRule =
      "(@request.auth.role = 'psicologo_autonomo' || @request.auth.role = 'psicologo_vinculado' || @request.auth.role = 'admin_clinica' || @request.auth.role = 'gestor_saas') || (@request.auth.role = 'paciente' && @request.body.profile = @request.auth.id)"
    app.save(patientsCol)
  },
  (app) => {
    var patientsCol = app.findCollectionByNameOrId('patients')
    patientsCol.createRule = "@request.auth.id != ''"
    app.save(patientsCol)
  },
)
