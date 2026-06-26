routerAdd('GET', '/backend/v1/invitations/{token}', (e) => {
  const token = e.request.pathValue('token')
  try {
    const invite = $app.findFirstRecordByData('convites_paciente', 'token', token)
    if (
      invite.getString('status') !== 'ativo' ||
      new Date(invite.getString('data_expiracao')) < new Date()
    ) {
      return e.badRequestError('Convite inválido ou expirado.')
    }
    $app.expandRecord(invite, ['psicologo_id', 'clinica_id'])
    const prof = invite.expandedOne('psicologo_id')
    return e.json(200, {
      id: invite.id,
      paciente_nome: invite.getString('paciente_nome'),
      paciente_email: invite.getString('paciente_email'),
      psicologo_nome: prof ? prof.getString('name') : 'Psicólogo',
    })
  } catch (err) {
    return e.notFoundError('Convite não encontrado.')
  }
})

routerAdd('POST', '/backend/v1/invitations/{token}/accept', (e) => {
  const token = e.request.pathValue('token')
  const body = e.requestInfo().body
  try {
    return $app.runInTransaction((txApp) => {
      const invite = txApp.findFirstRecordByData('convites_paciente', 'token', token)
      if (
        invite.getString('status') !== 'ativo' ||
        new Date(invite.getString('data_expiracao')) < new Date()
      ) {
        throw new BadRequestError('Convite inválido ou expirado.')
      }

      const usersCol = txApp.findCollectionByNameOrId('_pb_users_auth_')
      let user = null
      try {
        user = txApp.findAuthRecordByEmail('_pb_users_auth_', invite.getString('paciente_email'))
      } catch (_) {}

      if (!user) {
        user = new Record(usersCol)
        user.setEmail(invite.getString('paciente_email'))
        user.setPassword(body.password)
        user.setVerified(true)
        user.set('name', body.nome)
        user.set('cpf', body.cpf)
        user.set('phone', body.telefone)
        user.set('role', 'paciente')
        user.set('is_active', true)
        txApp.save(user)
      } else {
        if (!user.getString('cpf') && body.cpf) user.set('cpf', body.cpf)
        if (!user.getString('phone') && body.telefone) user.set('phone', body.telefone)
        txApp.save(user)
      }

      const patientsCol = txApp.findCollectionByNameOrId('patients')
      let patient = null
      try {
        patient = txApp.findFirstRecordByData('patients', 'profile', user.id)
      } catch (_) {}

      if (!patient) {
        patient = new Record(patientsCol)
        patient.set('profile', user.id)
        patient.set('name', body.nome)
        patient.set('email', invite.getString('paciente_email'))
        patient.set('cpf', body.cpf)
        patient.set('phone', body.telefone)
        patient.set('date_of_birth', body.data_nascimento)
        patient.set('convidado_por', invite.getString('psicologo_id'))
        patient.set('created_by', invite.getString('psicologo_id'))
        patient.set('is_active', true)
        patient.set('cadastro_completo', false)
        txApp.save(patient)
      }

      try {
        txApp.findFirstRecordByFilter(
          'patient_professionals',
          'patient = {:pat} && professional = {:prof}',
          { pat: patient.id, prof: invite.getString('psicologo_id') },
        )
      } catch (_) {
        const ppCol = txApp.findCollectionByNameOrId('patient_professionals')
        const pp = new Record(ppCol)
        pp.set('patient', patient.id)
        pp.set('professional', invite.getString('psicologo_id'))
        pp.set('is_primary', true)
        pp.set('is_active', true)
        pp.set('started_at', new Date().toISOString())
        if (invite.getString('clinica_id')) {
          pp.set('clinic', invite.getString('clinica_id'))
        }
        txApp.save(pp)
      }

      invite.set('status', 'utilizado')
      txApp.save(invite)

      return e.json(200, { success: true, user_id: user.id })
    })
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return e.badRequestError('Este CPF ou Email já está cadastrado.')
    }
    return e.badRequestError(err.message || 'Erro ao processar convite.')
  }
})

routerAdd(
  'POST',
  '/backend/v1/invitations',
  (e) => {
    const body = e.requestInfo().body
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Auth required')

    const email = body.email
    const nome = body.nome
    const clinica_id = body.clinica_id

    if (!email || !nome) return e.badRequestError('Nome e email obrigatórios')

    return $app.runInTransaction((txApp) => {
      try {
        const existing = txApp.findFirstRecordByFilter(
          'convites_paciente',
          "paciente_email = {:email} && psicologo_id = {:prof} && status = 'ativo'",
          { email: email, prof: auth.id },
        )
        if (existing) {
          return e.json(200, { token: existing.getString('token') })
        }
      } catch (_) {}

      const col = txApp.findCollectionByNameOrId('convites_paciente')
      const record = new Record(col)
      record.set('psicologo_id', auth.id)
      record.set('paciente_email', email)
      record.set('paciente_nome', nome)
      record.set('token', $security.randomString(32))
      record.set('status', 'ativo')

      const exp = new Date()
      exp.setDate(exp.getDate() + 7)
      record.set('data_expiracao', exp.toISOString())

      if (clinica_id) {
        record.set('clinica_id', clinica_id)
      }

      txApp.save(record)
      return e.json(200, { token: record.getString('token') })
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/invitations/{id}/resend',
  (e) => {
    const id = e.request.pathValue('id')
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Auth required')

    const record = $app.findRecordById('convites_paciente', id)
    if (record.getString('psicologo_id') !== auth.id && auth.getString('role') !== 'gestor_saas') {
      return e.forbiddenError('Não autorizado')
    }

    record.set('token', $security.randomString(32))
    record.set('status', 'ativo')
    const exp = new Date()
    exp.setDate(exp.getDate() + 7)
    record.set('data_expiracao', exp.toISOString())

    $app.save(record)

    return e.json(200, { token: record.getString('token') })
  },
  $apis.requireAuth(),
)
