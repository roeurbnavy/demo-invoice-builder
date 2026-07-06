import { Meteor } from 'meteor/meteor'
import { LinksCollection } from '/imports/api/links'
import { InvoicesCollection } from '/imports/api/invoices'
import { SchemasCollection } from '/imports/api/configSchemas'
import { SampleDataCollection } from '/imports/api/configSampleData'
import { PresetsCollection } from '/imports/api/configPresets'

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() })
}

Meteor.startup(async () => {
  if ((await LinksCollection.find().countAsync()) === 0) {
    await insertLink({
      title: 'Do the Tutorial',
      url: 'https://vuejs.org/guide/quick-start.html',
    })

    await insertLink({
      title: 'Follow the Guide',
      url: 'https://guide.meteor.com',
    })

    await insertLink({
      title: 'Read the Docs',
      url: 'https://docs.meteor.com',
    })

    await insertLink({
      title: 'Discussions',
      url: 'https://forums.meteor.com',
    })
  }

  // Seed default schema if empty
  if ((await SchemasCollection.find().countAsync()) === 0) {
    await SchemasCollection.insertAsync({
      name: 'Invoice',
      schema: {
        label: 'Customer Invoice',
        description: 'Custom Customer Invoice Schema',
        fields: [
          { key: 'doc.number', label: 'Invoice No.', group: 'Document', type: 'string' },
          { key: 'doc.date', label: 'Date', group: 'Document', type: 'date' },
          { key: 'doc.dueDate', label: 'Due Date', group: 'Document', type: 'date' },
          { key: 'company.name', label: 'Company Name', group: 'Company', type: 'string' },
          { key: 'company.phone', label: 'Company Phone', group: 'Company', type: 'string' },
          { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
          { key: 'customer.phone', label: 'Customer Phone', group: 'Customer', type: 'string' },
          { key: 'customer.email', label: 'Email', group: 'Customer', type: 'string' },
          { key: 'customer.address', label: 'Address', group: 'Customer', type: 'string' },
          { key: 'customer.country', label: 'Country', group: 'Customer', type: 'string' },
          { key: 'items', label: 'Items Table', group: 'Items', type: 'table' },
          { key: 'totals.subtotal', label: 'Subtotal', group: 'Totals', type: 'currency' },
          { key: 'totals.total', label: 'Total Amount', group: 'Totals', type: 'currency' },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Seed default sample data if empty
  if ((await SampleDataCollection.find().countAsync()) === 0) {
    await SampleDataCollection.insertAsync({
      name: 'Default Sample Data',
      data: {
        doc: {
          number: 'INV-2026-9999',
          date: '2026-06-27',
          dueDate: '2026-07-27',
        },
        company: {
          name: 'Meteor Retail Systems',
          phone: '+1 555-0199',
        },
        customer: {
          name: 'Jane Doe',
          phone: '+1 555-9876',
          address: 'Battambang',
          email: 'you@mail.com',
          country: 'Cambodia',
        },
        items: [
          {
            no: 1,
            refNo: 'SKU-001',
            barcode: '1234567890123',
            description: 'POS Software License',
            qty: 1,
            unit_price: 120.0,
            unitName: 'Piece',
            amountAfterDiscount: 120.0,
            discount: 0,
            tax: 10,
            total: 120.0,
          },
          {
            no: 2,
            refNo: 'SKU-002',
            barcode: '1234567890124',
            description: 'Thermal Receipt Rolls (Box)',
            qty: 2,
            unit_price: 15.0,
            unitName: 'Box',
            amountAfterDiscount: 30.0,
            discount: 0,
            tax: 10,
            total: 30.0,
          },
        ],
        totals: {
          subtotal: 150.0,
          total: 150.0,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Seed default preset if empty
  if ((await PresetsCollection.find().countAsync()) === 0) {
    await PresetsCollection.insertAsync({
      name: 'Default Invoice Layout',
      schemaKey: 'Invoice',
      blocks: [
        {
          type: 'text',
          xPercent: 0.1,
          yPercent: 0.08,
          widthPercent: 0.8,
          heightPercent: 0.06,
          defaultProps: {
            content: 'INVOICE TEMPLATE DESIGNER',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#00b4d8',
          },
        },
        {
          type: 'text',
          xPercent: 0.1,
          yPercent: 0.18,
          widthPercent: 0.38,
          heightPercent: 0.1,
          defaultProps: {
            content: 'Bill To:\nCustomer Name: {{customer.name}}\nPhone: {{customer.phone}}',
            fontSize: 12,
            lineHeight: 1.4,
          },
        },
        {
          type: 'text',
          xPercent: 0.52,
          yPercent: 0.18,
          widthPercent: 0.38,
          heightPercent: 0.1,
          defaultProps: {
            content: 'Invoice Details:\nInvoice No: {{doc.number}}\nDate: {{doc.date}}',
            fontSize: 12,
            lineHeight: 1.4,
            textAlign: 'right',
          },
        },
        {
          type: 'table',
          xPercent: 0.1,
          yPercent: 0.32,
          widthPercent: 0.8,
          heightPercent: 0.35,
          defaultProps: {
            columns: [
              { key: 'no', label: 'No', width: '10%', align: 'center' },
              { key: 'description', label: 'Description', width: '50%', align: 'left' },
              { key: 'qty', label: 'Qty', width: '15%', align: 'center' },
              { key: 'total', label: 'Amount', width: '25%', align: 'right' },
            ],
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Seed default template if Invoices collection is empty
  if ((await InvoicesCollection.find().countAsync()) === 0) {
    await InvoicesCollection.insertAsync({
      name: 'Default Sale Invoice Template',
      format: 'A4',
      orientation: 'portrait',
      blocks: [],
      settings: {
        documentType: 'Sale',
        currency: 'USD',
        globalFont: '"Inter", "Noto Sans", sans-serif',
        globalFontSize: 12,
        company: {
          name: "My Company Ltd.",
          email: "hello@mycompany.com",
          phone: "+1 (555) 987-6543",
          address: "456 Business Ave",
          website: "www.mycompany.com",
          tax_id: "VAT-987654",
          bank_name: "First National Bank",
          account_no: "1234-5678-9012",
          account_name: "My Company Ltd.",
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
})
