onRecordUpdateRequest((e) => {
  const trackedFields = {
    phone: 'telefone',
    address_cep: 'Endereço - CEP',
    address_street: 'Endereço - Logradouro',
    address_number: 'Endereço - Número',
    address_complement: 'Endereço - Complemento',
    address_neighborhood: 'Endereço - Bairro',
    address_city: 'Endereço - Cidade',
    address_state: 'Endereço - Estado',
    date_of_birth: 'data_nascimento',
    profession: 'profissao',
    profile_photo: 'profile_photo',
  }

  const orig = e.record.original()
  const oldValues = {}
  for (const field of Object.keys(trackedFields)) {
    const v = orig.get(field)
    oldValues[field] = v ? String(v) : ''
  }

  const patientProfile = orig.getString('profile')
  const authId = e.auth ? e.auth.id : ''

  e.next()

  try {
    let changedBy = 'psicólogo'
    if (
      authId &&
      (authId === patientProfile || (e.auth && e.auth.getString('role') === 'paciente'))
    ) {
      changedBy = 'paciente'
    }

    const auditCol = $app.findCollectionByNameOrId('profile_audit_log')
    const ipAddress = e.request.remoteAddr || ''

    for (const field of Object.keys(trackedFields)) {
      const oldVal = oldValues[field] || ''
      const rawNew = e.record.get(field)
      const newVal = rawNew ? String(rawNew) : ''

      if (oldVal !== newVal) {
        const log = new Record(auditCol)
        log.set('patient_id', e.record.id)
        log.set('field_name', trackedFields[field])
        log.set('old_value', oldVal)
        log.set('new_value', newVal)
        log.set('changed_by', changedBy)
        log.set('ip_address', ipAddress)
        $app.saveNoValidate(log)
      }
    }
  } catch (err) {
    $app.logger().error('Profile audit log failed', 'error', err ? err.message : '')
  }
}, 'patients')
