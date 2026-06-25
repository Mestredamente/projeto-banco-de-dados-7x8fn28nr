migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')

    if (!col.fields.getByName('consent_clinical_at')) {
      col.fields.add(new DateField({ name: 'consent_clinical_at' }))
    }
    if (!col.fields.getByName('consent_risk_at')) {
      col.fields.add(new DateField({ name: 'consent_risk_at' }))
    }
    if (!col.fields.getByName('consent_research_at')) {
      col.fields.add(new DateField({ name: 'consent_research_at' }))
    }
    if (!col.fields.getByName('consent_referral_at')) {
      col.fields.add(new DateField({ name: 'consent_referral_at' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    col.fields.removeByName('consent_clinical_at')
    col.fields.removeByName('consent_risk_at')
    col.fields.removeByName('consent_research_at')
    col.fields.removeByName('consent_referral_at')
    app.save(col)
  },
)
