routerAdd(
  'POST',
  '/backend/v1/subscriptions/cancel',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const subs = $app.findRecordsByFilter(
      'subscriptions',
      `subscriber = '${userId}' && status != 'canceled'`,
      '-created',
      1,
      0,
    )
    if (!subs || subs.length === 0) {
      return e.badRequestError('Nenhuma assinatura ativa encontrada.')
    }
    const sub = subs[0]

    const now = new Date()
    const createdStr = sub.getString('created')
    const created = createdStr ? new Date(createdStr) : now
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)

    sub.set('status', 'canceled')
    sub.set('canceled_at', now.toISOString())
    sub.set(
      'cancelled_reason',
      e.requestInfo().body?.reason || 'Cancelado pelo usuário via dashboard',
    )

    if (diffDays <= 7) {
      // Refund & terminate immediately (Right of Regret)
      sub.set('current_period_end', now.toISOString())

      // Log the refund in financial_records
      try {
        const frCol = $app.findCollectionByNameOrId('financial_records')
        const fr = new Record(frCol)
        fr.set('professional', userId)
        fr.set('type', 'estorno')
        fr.set('status', 'pago')
        fr.set('total', 0)
        fr.set('payment_date', now.toISOString())
        fr.set('notes', 'Estorno de cancelamento automático (Arrependimento 7 dias)')
        $app.saveNoValidate(fr)
      } catch (err) {
        $app.logger().error('Failed to log refund', 'error', err.message)
      }

      // Terminate access by setting user as inactive
      const user = $app.findRecordById('users', userId)
      user.set('is_active', false)
      $app.saveNoValidate(user)
    }

    $app.saveNoValidate(sub)
    return e.json(200, { success: true, refunded: diffDays <= 7 })
  },
  $apis.requireAuth(),
)
