onRecordCreate((e) => {
  const email = e.record.getString('email')
  const currentProfile = e.record.getString('profile')

  if (email && !currentProfile) {
    try {
      const user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
      if (user) {
        e.record.set('profile', user.id)
      }
    } catch (_) {}
  }

  e.next()
}, 'patients')
