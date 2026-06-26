migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('system_settings')

    if (!col.fields.getByName('company_name'))
      col.fields.add(new TextField({ name: 'company_name' }))
    if (!col.fields.getByName('trading_name'))
      col.fields.add(new TextField({ name: 'trading_name' }))
    if (!col.fields.getByName('cnpj')) col.fields.add(new TextField({ name: 'cnpj' }))
    if (!col.fields.getByName('state_registration'))
      col.fields.add(new TextField({ name: 'state_registration' }))
    if (!col.fields.getByName('municipal_registration'))
      col.fields.add(new TextField({ name: 'municipal_registration' }))

    if (!col.fields.getByName('address_cep')) col.fields.add(new TextField({ name: 'address_cep' }))
    if (!col.fields.getByName('address_street'))
      col.fields.add(new TextField({ name: 'address_street' }))
    if (!col.fields.getByName('address_number'))
      col.fields.add(new TextField({ name: 'address_number' }))
    if (!col.fields.getByName('address_complement'))
      col.fields.add(new TextField({ name: 'address_complement' }))
    if (!col.fields.getByName('address_neighborhood'))
      col.fields.add(new TextField({ name: 'address_neighborhood' }))
    if (!col.fields.getByName('address_city'))
      col.fields.add(new TextField({ name: 'address_city' }))
    if (!col.fields.getByName('address_state'))
      col.fields.add(new TextField({ name: 'address_state' }))

    if (!col.fields.getByName('contact_email'))
      col.fields.add(new TextField({ name: 'contact_email' }))
    if (!col.fields.getByName('contact_phone'))
      col.fields.add(new TextField({ name: 'contact_phone' }))
    if (!col.fields.getByName('website')) col.fields.add(new TextField({ name: 'website' }))

    if (!col.fields.getByName('tax_regime'))
      col.fields.add(
        new SelectField({
          name: 'tax_regime',
          values: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'],
          maxSelect: 1,
        }),
      )
    if (!col.fields.getByName('standard_tax_rate'))
      col.fields.add(new NumberField({ name: 'standard_tax_rate' }))
    if (!col.fields.getByName('invoice_series'))
      col.fields.add(new TextField({ name: 'invoice_series' }))
    if (!col.fields.getByName('digital_certificate'))
      col.fields.add(
        new FileField({
          name: 'digital_certificate',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: [
            'application/x-pkcs12',
            'application/x-x509-ca-cert',
            'application/octet-stream',
          ],
        }),
      )

    if (!col.fields.getByName('email_provider'))
      col.fields.add(
        new SelectField({
          name: 'email_provider',
          values: ['SMTP Próprio', 'SendGrid', 'Amazon SES', 'Mailgun', 'Outro'],
          maxSelect: 1,
        }),
      )
    if (!col.fields.getByName('smtp_server')) col.fields.add(new TextField({ name: 'smtp_server' }))
    if (!col.fields.getByName('smtp_port')) col.fields.add(new NumberField({ name: 'smtp_port' }))
    if (!col.fields.getByName('smtp_username'))
      col.fields.add(new TextField({ name: 'smtp_username' }))
    if (!col.fields.getByName('smtp_password'))
      col.fields.add(new TextField({ name: 'smtp_password' }))
    if (!col.fields.getByName('smtp_encryption'))
      col.fields.add(
        new SelectField({ name: 'smtp_encryption', values: ['TLS', 'SSL', 'None'], maxSelect: 1 }),
      )

    if (!col.fields.getByName('terms_of_use'))
      col.fields.add(new EditorField({ name: 'terms_of_use' }))
    if (!col.fields.getByName('privacy_policy'))
      col.fields.add(new EditorField({ name: 'privacy_policy' }))
    if (!col.fields.getByName('document_version'))
      col.fields.add(new TextField({ name: 'document_version' }))
    if (!col.fields.getByName('document_updated_at'))
      col.fields.add(new DateField({ name: 'document_updated_at' }))

    if (!col.fields.getByName('maintenance_mode'))
      col.fields.add(new BoolField({ name: 'maintenance_mode' }))
    if (!col.fields.getByName('maintenance_message'))
      col.fields.add(new TextField({ name: 'maintenance_message' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('system_settings')
    col.fields.removeByName('company_name')
    col.fields.removeByName('trading_name')
    col.fields.removeByName('cnpj')
    col.fields.removeByName('state_registration')
    col.fields.removeByName('municipal_registration')
    col.fields.removeByName('address_cep')
    col.fields.removeByName('address_street')
    col.fields.removeByName('address_number')
    col.fields.removeByName('address_complement')
    col.fields.removeByName('address_neighborhood')
    col.fields.removeByName('address_city')
    col.fields.removeByName('address_state')
    col.fields.removeByName('contact_email')
    col.fields.removeByName('contact_phone')
    col.fields.removeByName('website')
    col.fields.removeByName('tax_regime')
    col.fields.removeByName('standard_tax_rate')
    col.fields.removeByName('invoice_series')
    col.fields.removeByName('digital_certificate')
    col.fields.removeByName('email_provider')
    col.fields.removeByName('smtp_server')
    col.fields.removeByName('smtp_port')
    col.fields.removeByName('smtp_username')
    col.fields.removeByName('smtp_password')
    col.fields.removeByName('smtp_encryption')
    col.fields.removeByName('terms_of_use')
    col.fields.removeByName('privacy_policy')
    col.fields.removeByName('document_version')
    col.fields.removeByName('document_updated_at')
    col.fields.removeByName('maintenance_mode')
    col.fields.removeByName('maintenance_message')
    app.save(col)
  },
)
