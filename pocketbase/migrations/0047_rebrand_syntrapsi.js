migrate(
  (app) => {
    const manuals = app.findRecordsByFilter('system_manual', '1=1', '', 1000, 0)
    for (let record of manuals) {
      let changed = false

      const title = record.getString('title')
      if (title.includes('Syntra') && !title.includes('Syntrapsi')) {
        record.set('title', title.replace(/Syntra/g, 'Syntrapsi'))
        changed = true
      }

      const content = record.getString('content')
      if (content.includes('Syntra') && !content.includes('Syntrapsi')) {
        record.set('content', content.replace(/Syntra/g, 'Syntrapsi'))
        changed = true
      }

      if (changed) app.save(record)
    }

    try {
      const settings = app.findRecordsByFilter('system_settings', '1=1', '', 100, 0)
      for (let record of settings) {
        let changed = false

        const terms = record.getString('terms_of_use')
        if (terms && terms.includes('Syntra') && !terms.includes('Syntrapsi')) {
          record.set('terms_of_use', terms.replace(/Syntra/g, 'Syntrapsi'))
          changed = true
        }

        const priv = record.getString('privacy_policy')
        if (priv && priv.includes('Syntra') && !priv.includes('Syntrapsi')) {
          record.set('privacy_policy', priv.replace(/Syntra/g, 'Syntrapsi'))
          changed = true
        }

        if (changed) app.save(record)
      }
    } catch (e) {}
  },
  (app) => {
    const manuals = app.findRecordsByFilter('system_manual', '1=1', '', 1000, 0)
    for (let record of manuals) {
      let changed = false

      const title = record.getString('title')
      if (title.includes('Syntrapsi')) {
        record.set('title', title.replace(/Syntrapsi/g, 'Syntra'))
        changed = true
      }

      const content = record.getString('content')
      if (content.includes('Syntrapsi')) {
        record.set('content', content.replace(/Syntrapsi/g, 'Syntra'))
        changed = true
      }

      if (changed) app.save(record)
    }
  },
)
