onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const oldStatus = record.original().getString('status')
  const newStatus = record.getString('status')

  if (newStatus !== 'aguardando_confirmacao' || oldStatus === newStatus) {
    return e.next()
  }

  const professionalId = record.getString('professional')
  const patientId = record.getString('patient')
  const total = record.get('total') || 0

  if (!professionalId) return e.next()

  let patientName = 'Paciente'
  try {
    const patient = $app.findRecordById('patients', patientId)
    patientName = patient.getString('name') || 'Paciente'
  } catch (err) {}

  const valorStr = total.toFixed(2).replace('.', ',')

  try {
    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('profile', professionalId)
    notif.set('patient', patientId)
    notif.set('title', 'Pagamento Aguardando Confirmação')
    notif.set('body', 'Paciente ' + patientName + ' registrou pagamento de R$ ' + valorStr)
    notif.set('type', 'pagamento_aguardando')
    notif.set('channel', 'in_app')
    notif.set('status', 'Enviada')
    notif.set('reference_table', 'financial_records')
    notif.set('reference_id', record.id)
    $app.save(notif)
  } catch (err) {
    $app
      .logger()
      .error('Failed to send awaiting notification', 'error', err.message, 'recordId', record.id)
  }

  return e.next()
}, 'financial_records')
