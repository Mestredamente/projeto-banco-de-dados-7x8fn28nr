routerAdd(
  'POST',
  '/backend/v1/clinical-insights/{id}/feedback',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}

    const insight = $app.findRecordById('clinical_insights', id)
    if (insight.getString('professional') !== e.auth?.id) {
      return e.unauthorizedError('Not allowed')
    }

    insight.set('feedback', body.feedback)
    $app.save(insight)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
