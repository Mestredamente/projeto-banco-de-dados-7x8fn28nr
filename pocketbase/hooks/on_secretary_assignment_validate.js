onRecordValidate((e) => {
  const employer = e.record.getString('employer')
  const clinic = e.record.getString('clinic')
  if (!employer && !clinic) {
    throw new BadRequestError('At least one of employer or clinic must be present.', {
      employer: new ValidationError('validation_required', 'Required if clinic is empty'),
      clinic: new ValidationError('validation_required', 'Required if employer is empty'),
    })
  }
  e.next()
}, 'secretary_assignments')
