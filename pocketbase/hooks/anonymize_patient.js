routerAdd(
  'POST',
  '/backend/v1/patients/{id}/anonymize',
  (e) => {
    const id = e.request.pathValue('id')
    const actorId = e.auth?.id
    if (!actorId) return e.unauthorizedError('Auth required')

    try {
      const patient = $app.findRecordById('patients', id)

      patient.set('name', 'Paciente Anonimizado ' + id.substring(0, 5))
      patient.set('email', '')
      patient.set('phone', '')
      patient.set('cpf', '')
      patient.set('rg', '')
      patient.set('address', '')
      patient.set('address_cep', '')
      patient.set('address_street', '')
      patient.set('address_number', '')
      patient.set('address_neighborhood', '')
      patient.set('address_city', '')
      patient.set('address_state', '')
      patient.set('emergency_contact_name', '')
      patient.set('emergency_contact_phone', '')
      patient.set('retention_extended_at', new Date().toISOString())

      $app.save(patient)

      return e.json(200, { success: true })
    } catch (err) {
      throw new BadRequestError(err.message)
    }
  },
  $apis.requireAuth(),
)
