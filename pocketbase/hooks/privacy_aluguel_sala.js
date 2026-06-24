onRecordListRequest(
  (e) => {
    if (e.auth?.role !== 'admin_clinica') return e.next()

    try {
      const profs = $app.findRecordsByFilter(
        'clinic_professionals',
        "relationship_model = 'aluguel_sala'",
        '',
        1000,
        0,
      )
      if (profs.length > 0) {
        const ids = profs.map((p) => `'${p.getString('professional')}'`).join(',')
        const col = e.collection.name
        let f = ''
        if (col === 'financial_records' || col === 'session_notes' || col === 'appointments')
          f = 'professional'
        else if (col === 'patients') f = 'created_by'

        if (f) {
          let q = e.request.url.query()
          const current = q.get('filter') || ''
          const added = `${f} ?notin [${ids}]`
          q.set('filter', current ? `(${current}) && (${added})` : added)
          e.request.url.rawQuery = q.encode()
        }
      }
    } catch (err) {}

    return e.next()
  },
  'patients',
  'financial_records',
  'session_notes',
  'appointments',
)
