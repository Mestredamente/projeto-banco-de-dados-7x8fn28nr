onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const destinationId = record.getString('destination')
  if (!destinationId) return e.next()

  const notif = new Record($app.findCollectionByNameOrId('notifications'))
  notif.set('profile', destinationId)
  notif.set('title', 'Novo encaminhamento recebido')
  notif.set(
    'body',
    `Você recebeu um encaminhamento de paciente para a especialidade: ${record.getString('specialty') || 'Não informada'}.`,
  )
  notif.set('type', 'referral')
  notif.set('reference_table', 'referrals')
  notif.set('reference_id', record.id)
  notif.set('channel', 'in_app')
  notif.set('status', 'Enviada')

  $app.save(notif)
  return e.next()
}, 'referrals')
