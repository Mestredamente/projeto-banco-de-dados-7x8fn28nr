onRecordAfterCreateSuccess((e) => {
  const userId = e.record.id

  // 1. Create Trial Subscription
  const subsCollection = $app.findCollectionByNameOrId('subscriptions')
  const sub = new Record(subsCollection)
  sub.set('subscriber', userId)
  sub.set('status', 'trial')
  const now = new Date()
  const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  sub.set('trial_ends_at', trialEnds.toISOString())
  sub.set('current_period_start', now.toISOString())
  sub.set('current_period_end', trialEnds.toISOString())

  // 2. Handle Clinic Administrator creation
  if (e.record.getString('role') === 'admin_clinica') {
    const body = e.requestInfo().body || {}
    const clinicName = body.clinic_name

    if (clinicName) {
      // Create Clinic
      const clinicsCol = $app.findCollectionByNameOrId('clinics')
      const clinic = new Record(clinicsCol)
      clinic.set('name', clinicName)
      clinic.set('is_active', true)
      $app.saveNoValidate(clinic)

      // Associate user with clinic
      const cpCol = $app.findCollectionByNameOrId('clinic_professionals')
      const cp = new Record(cpCol)
      cp.set('clinic', clinic.id)
      cp.set('professional', userId)
      cp.set('relationship_model', 'contratacao')
      cp.set('is_active', true)
      $app.saveNoValidate(cp)

      // Attach subscription to clinic as well
      sub.set('clinic', clinic.id)
    }
  }

  $app.saveNoValidate(sub)

  return e.next()
}, 'users')
