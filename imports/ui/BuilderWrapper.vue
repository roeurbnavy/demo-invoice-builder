<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { subscribe, autorun } from "vue-meteor-tracker";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { InvoicesCollection } from "/imports/api/invoices";
import { SchemasCollection } from "/imports/api/configSchemas";
import { SampleDataCollection } from "/imports/api/configSampleData";
import { PresetsCollection } from "/imports/api/configPresets";
import { InvoiceBuilder } from "invoice-builder";

const props = defineProps({
  id: { type: String, default: null },
});

const router = useRouter();
const route = useRoute();

const loaded = ref(false);
const blocks = ref(null);
const name = ref("Untitled Template");
const format = ref("A4");
const orientation = ref("portrait");
const settings = ref(null);

// ── Load config from DB ────────────────────────────────────────────────
subscribe("schemas");
subscribe("sampleData");
subscribe("presets");

const schemaDocs = autorun(() => SchemasCollection.find({}).fetch()).result;

const sampleDataDocs = autorun(() =>
  SampleDataCollection.find({}).fetch(),
).result;

const presetDocs = autorun(() => PresetsCollection.find({}).fetch()).result;

const clientSchemas = computed(() => {
  if (!schemaDocs?.value) return {};
  const result = {};
  for (const doc of schemaDocs.value) {
    if (doc.schema) {
      result[doc.name] = doc.schema;
    }
  }
  return result;
});

const clientSampleData = computed(() => {
  if (!sampleDataDocs?.value || sampleDataDocs.value.length === 0) {
    return {};
  }
  const result = {};
  for (const doc of sampleDataDocs.value) {
    if (doc.name && doc.data) {
      result[doc.name] = doc.data;
    }
  }
  return result;
});

const clientPresets = computed(() => {
  if (!presetDocs?.value) return {};
  const result = {};
  for (const doc of presetDocs.value) {
    if (doc.schemaKey && !result[doc.schemaKey]) {
      result[doc.schemaKey] = doc.blocks;
    }
  }
  return result;
});

onMounted(() => {
  const subSchemas = Meteor.subscribe("schemas");
  const subSample = Meteor.subscribe("sampleData");
  const subPresets = Meteor.subscribe("presets");
  const subInvoice = props.id ? Meteor.subscribe("invoices") : null;

  Tracker.autorun((computation) => {
    const schemasReady = subSchemas.ready();
    const sampleReady = subSample.ready();
    const presetsReady = subPresets.ready();
    const invoiceReady = subInvoice ? subInvoice.ready() : true;

    if (schemasReady && sampleReady && presetsReady && invoiceReady) {
      if (props.id) {
        const invoice = InvoicesCollection.findOne(props.id);
        if (invoice) {
          blocks.value = invoice.blocks || [];
          name.value = invoice.name || "Untitled Template";
          format.value = invoice.format || "A4";
          orientation.value = invoice.orientation || "portrait";
          settings.value = invoice.settings || null;
        }
      } else {
        blocks.value = null;
        name.value = "Untitled Template";
        format.value = "A4";
        orientation.value = "portrait";
        settings.value = null;
      }
      loaded.value = true;
      computation.stop();
    }
  });
});

function handleSave(schema) {
  console.log("handleSave", schema);
  const dbSchema = {
    name: schema.name,
    format: schema.format,
    orientation: schema.orientation,
    blocks: schema.blocks,
    settings: {
      documentType: schema.settings.documentType,
      globalFont: schema.settings.globalFont,
      layoutMode: schema.settings.layoutMode,
      globalFontSize: schema.settings.globalFontSize,
      repeatFooter: schema.settings.repeatFooter,
      repeatHeader: schema.settings.repeatHeader,
      ...schema.settings,
    },
  };

  if (props.id) {
    Meteor.call("invoices.update", props.id, dbSchema, (err) => {
      if (err) alert("Failed to save to database: " + err.reason);
    });
  } else {
    Meteor.call("invoices.insert", dbSchema, (err, newId) => {
      if (err) alert("Failed to save to database: " + err.reason);
      else {
        router.push({ name: "builder", params: { id: newId } });
      }
    });
  }
}

function handleClose() {
  router.push({ name: "home" });
}
</script>

<template>
  <div v-if="loaded" class="w-full h-full">
    <InvoiceBuilder
      :schemas="clientSchemas"
      :sampleData="clientSampleData"
      :presets="clientPresets"
      :initialBlocks="blocks"
      :initialName="name"
      :initialFormat="format"
      :initialOrientation="orientation"
      :initialSettings="settings"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
  <div
    v-else
    class="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] text-[#e0e0e0]"
  >
    <div
      class="w-10 h-10 border-4 border-[#00b4d8] border-t-transparent rounded-full animate-spin mb-4"
    />
    <p>Loading template designer...</p>
  </div>
</template>
