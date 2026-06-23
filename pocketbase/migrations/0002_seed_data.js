migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'mestredamente1@gmail.com')
    } catch (_) {
      admin = new Record(users)
      admin.setEmail('mestredamente1@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Admin do Sistema')
      admin.set('role', 'gestor_saas')
      admin.set('is_active', true)
      app.save(admin)
    }

    const clinicsCol = app.findCollectionByNameOrId('clinics')
    const clinic1 = new Record(clinicsCol)
    clinic1.set('name', 'Clínica Mente Saudável')
    clinic1.set('cnpj', '12345678000199')
    clinic1.set('address', 'Rua das Flores, 123, São Paulo, SP')
    clinic1.set('is_active', true)
    app.save(clinic1)

    const patientsCol = app.findCollectionByNameOrId('patients')
    const p1 = new Record(patientsCol)
    p1.set('name', 'João Silva')
    p1.set('email', 'joao.silva@example.com')
    p1.set('phone', '11999999999')
    p1.set('cpf', '11122233344')
    p1.set('is_active', true)
    app.save(p1)

    const appointmentsCol = app.findCollectionByNameOrId('appointments')
    const a1 = new Record(appointmentsCol)
    a1.set('patient', p1.id)
    a1.set('professional', admin.id)
    a1.set('clinic', clinic1.id)
    a1.set('scheduled_date', new Date().toISOString())
    a1.set('status', 'agendado')
    app.save(a1)
  },
  (app) => {
    // Can be left empty for seed down
  },
)
