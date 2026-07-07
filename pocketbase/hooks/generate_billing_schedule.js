routerAdd(
  'POST',
  '/backend/v1/billing/generate-schedule',
  (e) => {
    const body = e.requestInfo().body || {}
    const patientId = body.patient_id
    if (!patientId) return e.badRequestError('patient_id é obrigatório')

    const authId = e.auth ? e.auth.id : ''
    if (!authId) return e.unauthorizedError('Autenticação necessária')

    const patient = $app.findRecordById('patients', patientId)

    if (!patient.getBool('auto_billing_enabled')) {
      return e.badRequestError('Ative o agendamento automático nas preferências')
    }

    const frequency = patient.getString('billing_frequency')
    if (!frequency) {
      return e.badRequestError('Configure a frequência de cobrança')
    }

    const billingDay = patient.get('billing_day')
    if (!billingDay) {
      return e.badRequestError('Configure o dia de cobrança')
    }

    const sessionValue = patient.get('session_value')
    if (!sessionValue || sessionValue === 0) {
      return e.badRequestError('Configure o valor da sessão')
    }

    const sessionsPerPeriod = patient.get('sessions_per_period') || 1
    const totalValue = sessionValue * sessionsPerPeriod

    const acceptedMethods = patient.get('accepted_payment_methods')
    let paymentMethod = ''
    if (acceptedMethods && Array.isArray(acceptedMethods) && acceptedMethods.length > 0) {
      paymentMethod = acceptedMethods[0]
    }

    const professional = $app.findRecordById('users', authId)

    let schedule = professional.get('schedule')
    if (typeof schedule === 'string') {
      try {
        schedule = JSON.parse(schedule)
      } catch (_) {
        schedule = {}
      }
    }
    if (!schedule || typeof schedule !== 'object') {
      schedule = {}
    }

    let workingDays = schedule.dias_preferidos || schedule.working_days || schedule.days
    if (!workingDays || !Array.isArray(workingDays) || workingDays.length === 0) {
      workingDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
    }

    let preferredTime = schedule.horario_preferencial || schedule.preferred_time || schedule.time
    if (!preferredTime) {
      const patientPref = patient.getString('horario_preferencial')
      if (patientPref === 'manha') {
        preferredTime = '08:00'
      } else if (patientPref === 'tarde') {
        preferredTime = '14:00'
      } else if (patientPref === 'noite') {
        preferredTime = '18:00'
      } else {
        preferredTime = '08:00'
      }
    }
    if (preferredTime === 'manha') {
      preferredTime = '08:00'
    } else if (preferredTime === 'tarde') {
      preferredTime = '14:00'
    } else if (preferredTime === 'noite') {
      preferredTime = '18:00'
    }

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

    const startDateStr = patient.getString('billing_start_date')
    let startDate
    if (startDateStr) {
      startDate = new Date(startDateStr + 'T00:00:00')
    } else {
      startDate = new Date()
    }

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 3)

    const dates = []
    const currentDate = new Date(startDate)

    if (frequency === 'semanal') {
      while (currentDate <= endDate) {
        const dayName = dayNames[currentDate.getDay()]
        if (workingDays.indexOf(dayName) !== -1) {
          dates.push(new Date(currentDate))
        }
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else if (frequency === 'quinzenal') {
      while (currentDate <= endDate) {
        const dayName = dayNames[currentDate.getDay()]
        if (workingDays.indexOf(dayName) !== -1) {
          dates.push(new Date(currentDate))
        }
        currentDate.setDate(currentDate.getDate() + 14)
      }
    } else if (frequency === 'mensal') {
      for (let i = 0; i < 3; i++) {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
        date.setDate(Math.min(billingDay, lastDay))
        const dayName = dayNames[date.getDay()]
        if (workingDays.indexOf(dayName) !== -1) {
          dates.push(date)
        }
      }
    } else if (frequency === 'avulsa') {
      const dayName = dayNames[currentDate.getDay()]
      if (workingDays.indexOf(dayName) !== -1) {
        dates.push(new Date(currentDate))
      }
    }

    if (dates.length === 0) {
      return e.badRequestError('Nenhum dia disponível na agenda do psicólogo')
    }

    const existingDates = {}
    try {
      const existing = $app.findRecordsByFilter(
        'financial_records',
        'patient = "' + patientId + '" && auto_generated = true',
        '-created',
        200,
        0,
      )
      for (let i = 0; i < existing.length; i++) {
        const d = existing[i].getString('due_date')
        if (d) {
          existingDates[d.substring(0, 10)] = true
        }
      }
    } catch (_) {}

    const newDates = []
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i]
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = year + '-' + month + '-' + day
      if (!existingDates[dateStr]) {
        newDates.push(d)
      }
    }

    if (newDates.length === 0) {
      return e.badRequestError('Já existem cobranças automáticas geradas para este período')
    }

    const frCollection = $app.findCollectionByNameOrId('financial_records')
    const created = []

    for (let i = 0; i < newDates.length; i++) {
      const d = newDates[i]
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = year + '-' + month + '-' + day

      const record = new Record(frCollection)
      record.set('patient', patientId)
      record.set('professional', authId)
      record.set('value', totalValue)
      record.set('discount', 0)
      record.set('total', totalValue)
      record.set('description', 'Cobrança automática - ' + frequency)
      record.set('due_date', dateStr)
      record.set('due_time', preferredTime)
      record.set('payment_method', paymentMethod)
      record.set('status', 'pendente')
      record.set('auto_generated', true)
      record.set('type', 'sessao')
      $app.save(record)
      created.push(record.id)
    }

    return e.json(200, { success: true, created: created.length, ids: created })
  },
  $apis.requireAuth(),
)
