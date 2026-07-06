import { Meteor } from "meteor/meteor";
import { LinksCollection } from "/imports/api/links";
import { InvoicesCollection } from "/imports/api/invoices";
import { SchemasCollection } from "/imports/api/configSchemas";
import { SampleDataCollection } from "/imports/api/configSampleData";
import { PresetsCollection } from "/imports/api/configPresets";

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

Meteor.startup(async () => {
  // 1. Seed custom schemas if empty
  if ((await SchemasCollection.find().countAsync()) === 0) {
    // Invoice Schema
    await SchemasCollection.insertAsync({
      name: "Invoice",
      schema: {
        label: "Customer Invoice",
        description: "Standard Customer Invoice Schema",
        fields: [
          {
            key: "doc.number",
            label: "Invoice No.",
            group: "Document",
            type: "string",
          },
          { key: "doc.date", label: "Date", group: "Document", type: "date" },
          {
            key: "doc.dueDate",
            label: "Due Date",
            group: "Document",
            type: "date",
          },
          {
            key: "company.name",
            label: "Company Name",
            group: "Company",
            type: "string",
          },
          {
            key: "company.phone",
            label: "Company Phone",
            group: "Company",
            type: "string",
          },
          {
            key: "company.email",
            label: "Company Email",
            group: "Company",
            type: "string",
          },
          {
            key: "company.address",
            label: "Company Address",
            group: "Company",
            type: "string",
          },
          {
            key: "customer.name",
            label: "Customer Name",
            group: "Customer",
            type: "string",
          },
          {
            key: "customer.phone",
            label: "Customer Phone",
            group: "Customer",
            type: "string",
          },
          {
            key: "customer.email",
            label: "Email",
            group: "Customer",
            type: "string",
          },
          {
            key: "customer.address",
            label: "Address",
            group: "Customer",
            type: "string",
          },
          { key: "items", label: "Line Items", group: "Items", type: "table" },
          {
            key: "totals.subtotal",
            label: "Subtotal",
            group: "Totals",
            type: "currency",
          },
          {
            key: "totals.total",
            label: "Total Amount",
            group: "Totals",
            type: "currency",
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Sale Schema
    await SchemasCollection.insertAsync({
      name: "Sale",
      schema: {
        label: "Sale Receipt",
        description: "Standard retail sale receipt schema",
        fields: [
          {
            key: "doc.number",
            label: "Receipt No.",
            group: "Document",
            type: "string",
          },
          { key: "doc.date", label: "Date", group: "Document", type: "date" },
          {
            key: "company.name",
            label: "Company Name",
            group: "Company",
            type: "string",
          },
          {
            key: "company.phone",
            label: "Company Phone",
            group: "Company",
            type: "string",
          },
          {
            key: "company.address",
            label: "Company Address",
            group: "Company",
            type: "string",
          },
          {
            key: "customer.name",
            label: "Customer Name",
            group: "Customer",
            type: "string",
          },
          { key: "items", label: "Items Table", group: "Items", type: "table" },
          {
            key: "totals.total",
            label: "Grand Total",
            group: "Totals",
            type: "currency",
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 2. Seed sample data if empty (linked correctly by Schema name keys)
  if ((await SampleDataCollection.find().countAsync()) === 0) {
    // Invoice sample data
    await SampleDataCollection.insertAsync({
      name: "Invoice",
      data: {
        doc: {
          number: "INV-2026-0001",
          date: "2026-07-06",
          dueDate: "2026-08-06",
        },
        company: {
          name: "Meteor Retail Systems",
          phone: "+1 555-0199",
          email: "info@meteorretail.com",
          address: "123 Tech Park, San Francisco",
        },
        customer: {
          name: "Jane Doe",
          phone: "+1 555-9876",
          address: "Battambang, Cambodia",
          email: "jane.doe@gmail.com",
        },
        items: [
          {
            no: 1,
            name: "POS Terminal V2",
            description: "Advanced Point of Sale System Hardware",
            qty: 1,
            unit_price: 450.0,
            price: 450.0,
            amount: 450.0,
            total: 450.0,
          },
          {
            no: 2,
            name: "Thermal Receipt Rolls",
            description: "Box of 50 thermal paper rolls",
            qty: 2,
            unit_price: 25.0,
            price: 25.0,
            amount: 50.0,
            total: 50.0,
          },
        ],
        totals: {
          subtotal: 500.0,
          total: 500.0,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Sale sample data
    await SampleDataCollection.insertAsync({
      name: "Sale",
      data: {
        doc: {
          number: "REC-100254",
          date: "2026-07-06",
        },
        company: {
          name: "SuperMart Plaza",
          phone: "+855 23-456-789",
          address: "Monivong Blvd, Phnom Penh",
        },
        customer: {
          name: "General Customer",
        },
        items: [
          {
            no: 1,
            name: "Coca Cola 320ml",
            qty: 6,
            unit_price: 0.6,
            price: 0.6,
            amount: 3.6,
            total: 3.6,
          },
          {
            no: 2,
            name: "Pringles Sour Cream 150g",
            qty: 2,
            unit_price: 2.1,
            price: 2.1,
            amount: 4.2,
            total: 4.2,
          },
        ],
        totals: {
          total: 7.8,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 3. Seed presets if empty
  if ((await PresetsCollection.find().countAsync()) === 0) {
    await PresetsCollection.insertAsync({
      name: "Default Invoice Layout",
      schemaKey: "Invoice",
      blocks: [
        {
          type: "text",
          xPercent: 0.1,
          yPercent: 0.08,
          widthPercent: 0.8,
          heightPercent: 0.06,
          defaultProps: {
            content: "INVOICE TEMPLATE DESIGNER",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
            color: "#00b4d8",
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 4. Seed default templates (Invoices) with pre-designed blocks
  if ((await InvoicesCollection.find().countAsync()) === 0) {
    const defaultBlocks = [
      {
        id: "block-inv-title",
        type: "text",
        x: 40,
        y: 45,
        width: 714,
        height: 40,
        section: "header",
        content: "INVOICE",
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: "#00b4d8",
      },
      {
        id: "block-company-info",
        type: "text",
        x: 40,
        y: 110,
        width: 330,
        height: 100,
        section: "header",
        content:
          "**{{company.name}}**\nPhone: {{company.phone}}\nEmail: {{company.email}}\nAddress: {{company.address}}",
        fontSize: 10,
        lineHeight: 1.4,
        textAlign: "left",
      },
      {
        id: "block-invoice-details",
        type: "text",
        x: 420,
        y: 110,
        width: 334,
        height: 100,
        section: "header",
        content:
          "Invoice No: **{{doc.number}}**\nDate: **{{doc.date}}**\nDue Date: **{{doc.dueDate}}**",
        fontSize: 10,
        lineHeight: 1.4,
        textAlign: "right",
      },
      {
        id: "block-bill-to",
        type: "text",
        x: 40,
        y: 230,
        width: 330,
        height: 80,
        section: "header",
        content:
          "### Bill To:\n**{{customer.name}}**\nPhone: {{customer.phone}}\nAddress: {{customer.address}}",
        fontSize: 10,
        lineHeight: 1.4,
        textAlign: "left",
      },
      {
        id: "block-item-table",
        type: "item_table",
        x: 40,
        y: 0,
        width: 714,
        height: 250,
        section: "table",
        dataKey: "items",
        emptyRows: 3,
        showHeader: true,
        showBorders: true,
        columns: [
          { id: "no", label: "#", width: 5, visible: true, dataKey: "no" },
          {
            id: "description",
            label: "Description",
            width: 50,
            visible: true,
            dataKey: "description",
          },
          { id: "qty", label: "Qty", width: 10, visible: true, dataKey: "qty" },
          {
            id: "unit_price",
            label: "Price",
            width: 15,
            visible: true,
            dataKey: "unit_price",
          },
          {
            id: "total",
            label: "Total",
            width: 20,
            visible: true,
            dataKey: "total",
          },
        ],
      },
      {
        id: "block-totals",
        type: "text",
        x: 450,
        y: 20,
        width: 304,
        height: 80,
        section: "footer",
        content:
          "Subtotal: **${{totals.subtotal}}**\nGrand Total: **${{totals.total}}**",
        fontSize: 12,
        lineHeight: 1.5,
        textAlign: "right",
      },
      {
        id: "block-notes",
        type: "text",
        x: 40,
        y: 20,
        width: 380,
        height: 80,
        section: "footer",
        content:
          "### Notes:\nThank you for your business! Please pay within 30 days.",
        fontSize: 9,
        lineHeight: 1.4,
        textAlign: "left",
        color: "#8892a4",
      },
    ];

    // Default Invoice Template
    await InvoicesCollection.insertAsync({
      name: "Default Sale Invoice Template",
      format: "A4",
      orientation: "portrait",
      blocks: defaultBlocks,
      settings: {
        documentType: "Invoice",
        globalFont: '"Inter", "Noto Sans", sans-serif',
        globalFontSize: 12,
        layoutMode: "sections",
        repeatHeader: true,
        repeatFooter: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Default Sale Template
    await InvoicesCollection.insertAsync({
      name: "Retail Sale Receipt Template",
      format: "A4",
      orientation: "portrait",
      blocks: defaultBlocks.map((b) => {
        // Customize some items for Sale receipt
        if (b.id === "block-inv-title")
          return { ...b, content: "SALE RECEIPT" };
        if (b.id === "block-invoice-details") {
          return {
            ...b,
            content: "Receipt No: **{{doc.number}}**\nDate: **{{doc.date}}**",
          };
        }
        if (b.id === "block-totals") {
          return { ...b, content: "Grand Total: **${{totals.total}}**" };
        }
        return b;
      }),
      settings: {
        documentType: "Sale",
        globalFont: '"Inter", "Noto Sans", sans-serif',
        globalFontSize: 12,
        layoutMode: "sections",
        repeatHeader: true,
        repeatFooter: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
});
