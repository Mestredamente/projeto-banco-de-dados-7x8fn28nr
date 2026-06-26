routerAdd(
  'POST',
  '/backend/v1/request-backup',
  (e) => {
    // Mock endpoint to simulate async backup trigger
    return e.json(200, { success: true, message: 'Backup programado' })
  },
  $apis.requireAuth(),
)
