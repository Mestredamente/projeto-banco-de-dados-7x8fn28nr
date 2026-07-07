onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus === newStatus) return e.next()

  if (newStatus !== 'aguardando_confirmacao') return e.next()

  const patientId = e.record.getString('patient')
  const professionalId = e.record.getString('professional')
  const total = e.record.get('total') || 0

  if (!professionalId || !patientId) return e.next()

  let patientName = 'Paciente'
  try {
    const patient = $app.findRecordById('patients', patientId)
    patientName = patient.getString('name') || 'Paciente'
  } catch (err) {}

  const valorStr = total.toFixed(2)

  try {
    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('profile', professionalId)
    notif.set('patient', patientId)
    notif.set('title', 'Pagamento Aguardando Confirmação')
    notif.set('body', 'Paciente ' + patientName + ' registrou pagamento de R$ ' + valorStr + '.')
    notif.set('type', 'pagamento_aguardando')
    notif.set('channel', 'in_app')
    notif.set('status', 'Enviada')
    notif.set('reference_table', 'financial_records')
    notif.set('reference_id', e.record.id)
    $app.save(notif)
  } catch (err) {
    $app
      .logger()
      .error(
        'Failed to send payment awaiting notification',
        'error',
        err.message,
        'recordId',
        e.record.id,
      )
  }

  return e.next()
}, 'financial_records')
