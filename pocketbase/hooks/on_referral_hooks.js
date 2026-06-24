onRecordCreate((e) => {
  if (!e.record.getString('token')) {
    e.record.set('token', $security.randomString(8).toUpperCase())
  }
  e.next()
}, 'referrals')

onRecordAfterCreateSuccess((e) => {
  try {
    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('profile', e.record.getString('destination'))
    notif.set('title', 'Novo encaminhamento recebido')
    notif.set(
      'body',
      `Especialidade solicitada: ${e.record.getString('specialty')}. Confira seus encaminhamentos.`,
    )
    notif.set('type', 'referral')
    notif.set('reference_table', 'referrals')
    notif.set('reference_id', e.record.id)
    notif.set('read', false)
    $app.save(notif)
  } catch (err) {
    console.log('Failed to send notification:', err.message)
  }
  e.next()
}, 'referrals')
