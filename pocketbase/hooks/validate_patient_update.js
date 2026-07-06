onRecordUpdate((e) => {
  const originalProfile = e.record.original().getString('profile')
  const newProfile = e.record.getString('profile')

  if (originalProfile && !newProfile) {
    e.record.set('profile', originalProfile)
  }

  e.next()
}, 'patients')
