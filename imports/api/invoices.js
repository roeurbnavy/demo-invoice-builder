import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const InvoicesCollection = new Mongo.Collection("invoices");

// Basic validation helper
function validateInvoice(invoice) {
  if (!invoice.name || typeof invoice.name !== "string") {
    throw new Meteor.Error("invalid-argument", "Template name is required");
  }
  if (!invoice.blocks || !Array.isArray(invoice.blocks)) {
    throw new Meteor.Error(
      "invalid-argument",
      "Template blocks must be an array",
    );
  }
}

if (Meteor.isServer) {
  Meteor.publish("invoices", function () {
    return InvoicesCollection.find({});
  });

  // Register methods
  Meteor.methods({
    async "invoices.insert"(invoiceData) {
      validateInvoice(invoiceData);
      const doc = {
        name: invoiceData.name,
        format: invoiceData.format || "A4",
        orientation: invoiceData.orientation || "portrait",
        blocks: invoiceData.blocks || [],
        settings: invoiceData.settings || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return await InvoicesCollection.insertAsync(doc);
    },

    async "invoices.update"(id, invoiceData) {
      if (!id) {
        throw new Meteor.Error("invalid-argument", "Invoice ID is required");
      }
      validateInvoice(invoiceData);
      return await InvoicesCollection.updateAsync(id, {
        $set: {
          name: invoiceData.name,
          format: invoiceData.format,
          orientation: invoiceData.orientation,
          blocks: invoiceData.blocks,
          settings: invoiceData.settings,
          updatedAt: new Date(),
        },
      });
    },

    async "invoices.remove"(id) {
      if (!id) {
        throw new Meteor.Error("invalid-argument", "Invoice ID is required");
      }
      return await InvoicesCollection.removeAsync(id);
    },

    async "invoices.getFakerData"(schemaName) {
      const { faker } = require("@faker-js/faker");
      const { SchemasCollection } = require("./configSchemas.js");

      // Helper function to set nested keys
      const setNestedKey = (obj, path, value) => {
        const parts = path.split(".");
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!(part in current) || typeof current[part] !== "object") {
            current[part] = {};
          }
          current = current[part];
        }
        current[parts[parts.length - 1]] = value;
      };

      const schemaDoc = schemaName
        ? await SchemasCollection.findOneAsync({ name: schemaName })
        : null;

      if (
        schemaDoc &&
        schemaDoc.schema &&
        Array.isArray(schemaDoc.schema.fields)
      ) {
        const result = {};
        let generatedItems = null;

        // Iterate through all fields defined in the schema to build the mock data
        for (const field of schemaDoc.schema.fields) {
          const key = field.key;
          const type = field.type;
          const keyLower = key.toLowerCase();

          let value;
          if (type === "currency") {
            value = parseFloat(faker.commerce.price({ min: 10, max: 1500 }));
          } else if (type === "number") {
            value = faker.number.int({ min: 1, max: 100 });
          } else if (type === "date") {
            value = faker.date.recent().toISOString().split("T")[0];
          } else if (type === "table") {
            const itemsCount = faker.number.int({ min: 5, max: 15 });
            value = Array.from({ length: itemsCount }).map((_, index) => {
              const qty = faker.number.int({ min: 1, max: 10 });
              const unitPrice = parseFloat(
                faker.commerce.price({ min: 5, max: 300 }),
              );
              const total = parseFloat((qty * unitPrice).toFixed(2));
              return {
                no: index + 1,
                name: faker.commerce.productName(),
                description:
                  faker.commerce.productName() +
                  " - " +
                  faker.commerce.productAdjective(),
                qty: qty,
                price: unitPrice,
                unit_price: unitPrice,
                discount: 0,
                tax: 10,
                amount: total,
                total: total,
              };
            });
            generatedItems = value;
          } else {
            // string / fallback: parse by keywords in key path
            if (keyLower.includes("email")) {
              value = faker.internet.email();
            } else if (keyLower.includes("phone") || keyLower.includes("tel")) {
              value = faker.phone.number();
            } else if (
              keyLower.includes("customer.name") ||
              keyLower.includes("vendor.name") ||
              keyLower.includes("customer.sub_name")
            ) {
              value = faker.person.fullName();
            } else if (keyLower.includes("company.name")) {
              value = faker.company.name();
            } else if (keyLower.includes("address")) {
              value =
                faker.location.streetAddress() + ", " + faker.location.city();
            } else if (
              keyLower.includes("number") ||
              keyLower.includes("no") ||
              keyLower.includes("ref")
            ) {
              value = `INV-${faker.date.anytime().getFullYear()}-${faker.number.int({ min: 1000, max: 9999 })}`;
            } else if (
              keyLower.includes("website") ||
              keyLower.includes("url")
            ) {
              value = faker.internet.url();
            } else if (
              keyLower.includes("notes") ||
              keyLower.includes("terms")
            ) {
              value = faker.lorem.sentence();
            } else {
              value = faker.lorem.words(2);
            }
          }

          setNestedKey(result, key, value);
        }

        // Auto-calculate summary totals if table items generated but totals missing
        if (generatedItems) {
          const subtotal = generatedItems.reduce(
            (sum, item) => sum + item.total,
            0,
          );
          const tax = parseFloat((subtotal * 0.1).toFixed(2));
          const total = parseFloat((subtotal + tax).toFixed(2));

          const getNestedValue = (obj, path) => {
            const parts = path.split(".");
            let current = obj;
            for (const part of parts) {
              if (current === null || current === undefined) return undefined;
              current = current[part];
            }
            return current;
          };

          if (getNestedValue(result, "totals.subtotal") === undefined) {
            setNestedKey(result, "totals.subtotal", subtotal);
          }
          if (getNestedValue(result, "totals.tax") === undefined) {
            setNestedKey(result, "totals.tax", tax);
          }
          if (getNestedValue(result, "totals.total") === undefined) {
            setNestedKey(result, "totals.total", total);
          }
          if (getNestedValue(result, "totals.balance") === undefined) {
            setNestedKey(result, "totals.balance", total);
          }
        }

        // Basic compatibility structure
        if (!result.doc) result.doc = { type: schemaName };
        if (!result.doc.type) result.doc.type = schemaName;

        return result;
      }

      // ── Fallback payload for legacy/predefined schemas ──
      const subtotal = parseFloat(
        faker.commerce.price({ min: 100, max: 2000 }),
      );
      const discount = parseFloat(faker.commerce.price({ min: 0, max: 150 }));
      const tax = parseFloat((subtotal * 0.1).toFixed(2));
      const total = parseFloat((subtotal - discount + tax).toFixed(2));
      const exchangeRateNum = 4100;
      const totalRiel = Math.round(total * exchangeRateNum);

      const itemsCount = faker.number.int({ min: 10, max: 50 });
      const items = Array.from({ length: itemsCount }).map((_, index) => {
        const qty = faker.number.int({ min: 1, max: 10 });
        const unitPrice = parseFloat(
          faker.commerce.price({ min: 5, max: 500 }),
        );
        const itemTotal = parseFloat((qty * unitPrice).toFixed(2));
        return {
          no: index + 1,
          refNo: `SKU-${faker.string.alphanumeric(6).toUpperCase()}`,
          barcode: faker.commerce.isbn(10),
          description:
            faker.commerce.productName() +
            " - " +
            faker.commerce.productAdjective(),
          qty: qty,
          unit_price: unitPrice,
          unitName: faker.helpers.arrayElement(["pcs", "box", "set", "unit"]),
          discount: 0,
          tax: 10,
          total: itemTotal,
          amountAfterDiscount: itemTotal,
        };
      });

      return {
        invoice: {
          number: `INV-${faker.date.anytime().getFullYear()}-${faker.number.int({ min: 1000, max: 9999 })}`,
          date: faker.date.recent().toISOString().split("T")[0],
          due_date: faker.date.future().toISOString().split("T")[0],
          reference: `PO-${faker.number.int({ min: 10000, max: 99999 })}`,
          subtotal: subtotal,
          discount: discount,
          tax: tax,
          total: total,
          balance: total,
          paid: 0,
          notes: faker.lorem.sentence(),
          terms:
            "Payment terms: Due upon receipt. 1.5% interest fee per month on late accounts.",
        },
        doc: {
          type: "Invoice",
          number: `INV-${faker.date.anytime().getFullYear()}-${faker.number.int({ min: 1000, max: 9999 })}`,
          date: faker.date.recent().toISOString().split("T")[0],
          due_date: faker.date.future().toISOString().split("T")[0],
          reference: `PO-${faker.number.int({ min: 10000, max: 99999 })}`,
          delivery_date: faker.date.recent().toISOString().split("T")[0],
          valid_until: faker.date.future().toISOString().split("T")[0],
          required_date: faker.date.future().toISOString().split("T")[0],
          reason: "Faker Simulated Transaction Data",
          notes: faker.lorem.sentence(),
          terms: "Thank you for your trust and business!",
          page_number: 1,
          total_pages: 1,
        },
        totals: {
          subtotal: subtotal,
          discount: discount,
          tax: tax,
          total: total,
          balance: total,
          paid: 0,
          exchange_rate: `${exchangeRateNum.toLocaleString()} ៛`,
          total_riel: `${totalRiel.toLocaleString()} ៛`,
        },
        deposit: {
          total: total,
          paid: 0,
          balance: total,
        },
        payment: {
          method: faker.helpers.arrayElement([
            "Bank Transfer",
            "ABA Pay",
            "Cash",
            "Credit Card",
          ]),
          amount: total,
          change: 0,
        },
        shipping: {
          carrier: faker.helpers.arrayElement(["DHL", "FedEx", "J&T Express"]),
          tracking: `TRK-${faker.number.int({ min: 10000000, max: 99999999 })}`,
        },
        vendor: {
          name: faker.company.name(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address:
            faker.location.streetAddress() + ", " + faker.location.city(),
        },
        customer: {
          name: `${faker.person.fullName()} ${faker.person.fullName()}`,
          sub_name: faker.person.lastName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          country: faker.location.country(),
          tax_id: `VAT-${faker.string.numeric(8)}`,
        },
        company: {
          name: faker.company.name(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address:
            faker.location.streetAddress() + ", " + faker.location.city(),
          website: faker.internet.domainName(),
          tax_id: `VAT-${faker.string.numeric(9)}`,
          bank_name: faker.helpers.arrayElement([
            "ABA Bank",
            "Acleda Bank",
            "Canadia Bank",
          ]),
          account_no: faker.finance.accountNumber(),
          account_name: faker.company.name().toUpperCase(),
        },
        items: items,
      };
    },
  });
}
