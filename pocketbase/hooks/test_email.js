routerAdd(
  'POST',
  '/backend/v1/test-email',
  (e) => {
    // Mock endpoint to simulate test email dispatch
    return e.json(200, { success: true, message: 'Email enviado (simulado)' })
  },
  $apis.requireAuth(),
)
