<script setup>
import { ref, reactive, computed, nextTick, watch } from "vue";
import { subscribe, autorun } from "vue-meteor-tracker";
import { Meteor } from "meteor/meteor";
import { SchemasCollection } from "/imports/api/configSchemas";
import { SampleDataCollection } from "/imports/api/configSampleData";
import { PresetsCollection } from "/imports/api/configPresets";
import {
  Plus,
  Save,
  Trash2,
  Edit,
  X,
  Code,
  Table,
  Layers,
  Check,
  AlertTriangle,
  Search,
  ChevronUp,
  ChevronDown,
} from "@lucide/vue";

// ── Toast ────────────────────────────────────────────────────────────────
const toasts = ref([]);
let toastId = 0;

function showToast(message, type = "success") {
  const id = ++toastId;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 3500);
}

// ── Confirm Dialog ───────────────────────────────────────────────────────
const confirmDialog = reactive({
  show: false,
  title: "",
  message: "",
  onConfirm: null,
});

function openConfirm(title, message, onConfirm) {
  confirmDialog.show = true;
  confirmDialog.title = title;
  confirmDialog.message = message;
  confirmDialog.onConfirm = onConfirm;
}

function closeConfirm() {
  confirmDialog.show = false;
  confirmDialog.onConfirm = null;
}

// ── Active tab ───────────────────────────────────────────────────────────
const activeTab = ref("schemas");

// ── Search ───────────────────────────────────────────────────────────────
const searchQuery = ref("");

// ── Known block types (for preset dropdown) ──────────────────────────────
const KNOWN_BLOCK_TYPES = [
  "text", "dynamic_text", "image", "divider", "spacer", "shape", "container",
  "row", "column", "grid", "section", "background_block", "page_break", "page_number",
  "company_info", "client_info", "header_grid", "field_row",
  "document_title", "document_number", "issue_date", "due_date", "reference_number",
  "terms", "footer_note", "thank_you",
  "item_table", "table_builder", "currency_summary",
  "subtotal", "discount", "tax", "grand_total", "balance_due", "deposit_paid", "bank_details",
  "signature_line", "digital_signature",
  "variable_binding", "repeat_block", "conditional_block", "formula_block",
  "payment_qr", "barcode", "multi_language_row", "watermark", "scanner_result",
  "checkboxes_row", "table", "cut_line", "carbon_copy_label",
  "page_counter", "qr_code", "amount_in_words",
];

// ── Schemas ──────────────────────────────────────────────────────────────
subscribe("schemas");
const schemas = autorun(() =>
  SchemasCollection.find({}, { sort: { createdAt: -1 } }).fetch()
).result;

const schemaForm = reactive({
  _id: null,
  name: "",
  schema: { label: "", description: "", fields: [] },
});
const showSchemaForm = ref(false);
const schemaSaving = ref(false);
const schemaError = ref("");
const schemaNameRef = ref(null);

const fieldTemplate = () => ({
  key: "",
  label: "",
  group: "General",
  type: "string",
});

const FIELD_GROUPS = ["Document", "Company", "Customer", "Items", "Totals", "Financial", "Payment", "Shipping", "Deposit", "Vendor", "General"];

function openSchemaForm(item) {
  if (item) {
    schemaForm._id = item._id;
    schemaForm.name = item.name;
    schemaForm.schema = JSON.parse(JSON.stringify(item.schema));
  } else {
    schemaForm._id = null;
    schemaForm.name = "";
    schemaForm.schema = { label: "", description: "", fields: [] };
  }
  schemaError.value = "";
  showSchemaForm.value = true;
  nextTick(() => schemaNameRef.value?.focus());
}

function addSchemaField() {
  schemaForm.schema.fields.push(fieldTemplate());
}

function removeSchemaField(idx) {
  schemaForm.schema.fields.splice(idx, 1);
}

function moveSchemaField(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= schemaForm.schema.fields.length) return;
  const tmp = schemaForm.schema.fields[idx];
  schemaForm.schema.fields[idx] = schemaForm.schema.fields[target];
  schemaForm.schema.fields[target] = tmp;
}

const duplicateKeys = computed(() => {
  const keys = schemaForm.schema.fields.map((f) => f.key).filter(Boolean);
  const seen = {};
  const dupes = new Set();
  for (const k of keys) {
    if (seen[k]) dupes.add(k);
    seen[k] = true;
  }
  return dupes;
});

function isDuplicate(key) {
  return duplicateKeys.value.has(key);
}

function saveSchema() {
  schemaError.value = "";
  if (!schemaForm.name.trim()) {
    schemaError.value = "Schema key is required";
    return;
  }
  if (!schemaForm.schema.label.trim()) {
    schemaError.value = "Schema label is required";
    return;
  }
  schemaSaving.value = true;
  const payload = {
    name: schemaForm.name.trim(),
    schema: schemaForm.schema,
  };
  const method = schemaForm._id ? "schemas.update" : "schemas.insert";
  const arg = schemaForm._id ? [schemaForm._id, payload] : [payload];
  Meteor.call(method, ...arg, (err) => {
    schemaSaving.value = false;
    if (err) {
      schemaError.value = err.reason || err.message;
    } else {
      showToast(schemaForm._id ? "Schema updated" : "Schema created");
      showSchemaForm.value = false;
    }
  });
}

function deleteSchema(id) {
  openConfirm("Delete Schema", "Are you sure you want to delete this schema?", () => {
    Meteor.call("schemas.remove", id, (err) => {
      if (err) showToast(err.reason || err.message, "error");
      else showToast("Schema deleted");
    });
  });
}

const filteredSchemas = computed(() => {
  if (!schemas?.value) return [];
  const q = searchQuery.value.toLowerCase();
  if (!q) return schemas.value;
  return schemas.value.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.schema?.label || "").toLowerCase().includes(q)
  );
});

// ── Sample Data ──────────────────────────────────────────────────────────
subscribe("sampleData");
const sampleDataList = autorun(() =>
  SampleDataCollection.find({}, { sort: { createdAt: -1 } }).fetch()
).result;

const sampleForm = reactive({
  _id: null,
  name: "",
  data: "{\n  \n}",
});
const showSampleForm = ref(false);
const sampleSaving = ref(false);
const sampleError = ref("");
const sampleJsonError = ref("");
const sampleNameRef = ref(null);

const sampleFormMode = ref("form"); // "form" or "json"
const sampleFormParsed = ref({});

function setNestedKey(obj, path, value) {
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
}

function getNestedKey(obj, path) {
  if (!obj) return "";
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return "";
    }
    current = current[part];
  }
  return current !== undefined && current !== null ? current : "";
}

const selectedSchema = computed(() => {
  if (!schemas?.value || !sampleForm.name) return null;
  return schemas.value.find((s) => s.name === sampleForm.name);
});

const selectedSchemaFields = computed(() => {
  return selectedSchema.value?.schema?.fields || [];
});

const groupedFields = computed(() => {
  const fields = selectedSchemaFields.value;
  const groups = {};
  for (const f of fields) {
    const g = f.group || "General";
    if (!groups[g]) groups[g] = [];
    groups[g].push(f);
  }
  return groups;
});

function syncFormToJson() {
  sampleForm.data = JSON.stringify(sampleFormParsed.value, null, 2);
}

function syncJsonToForm() {
  try {
    sampleFormParsed.value = JSON.parse(sampleForm.data);
  } catch (e) {
    // Keep parsed form unchanged if JSON is temporarily invalid during manual editing
  }
}

function prepopulateFields() {
  if (!selectedSchemaFields.value || selectedSchemaFields.value.length === 0) return;
  for (const f of selectedSchemaFields.value) {
    const val = getNestedKey(sampleFormParsed.value, f.key);
    if (val === "" || val === null || val === undefined) {
      let defaultVal = "";
      if (f.type === "number" || f.type === "currency") defaultVal = 0;
      if (f.type === "table") defaultVal = [
        { name: "Sample Item 1", qty: 1, price: 10, amount: 10 }
      ];
      setNestedKey(sampleFormParsed.value, f.key, defaultVal);
    }
  }
  syncFormToJson();
}

function openSampleForm(item) {
  if (item) {
    sampleForm._id = item._id;
    sampleForm.name = item.name;
    sampleForm.data = JSON.stringify(item.data, null, 2);
  } else {
    sampleForm._id = null;
    sampleForm.name = "";
    sampleForm.data = "{\n  \n}";
  }
  sampleError.value = "";
  sampleJsonError.value = "";
  syncJsonToForm();

  // Choose default mode based on whether a schema matches
  const hasMatchingSchema = sampleForm.name && sampleForm.name !== "Custom" && schemas.value?.some(s => s.name === sampleForm.name);
  sampleFormMode.value = hasMatchingSchema ? "form" : "json";

  if (hasMatchingSchema) {
    prepopulateFields();
  }

  showSampleForm.value = true;
  nextTick(() => sampleNameRef.value?.focus());
}

watch(() => sampleForm.name, (newName) => {
  const hasMatchingSchema = newName && newName !== "Custom" && schemas.value?.some(s => s.name === newName);
  if (hasMatchingSchema) {
    syncJsonToForm();
    prepopulateFields();
    sampleFormMode.value = "form";
  } else {
    sampleFormMode.value = "json";
  }
});

watch(() => sampleForm.data, () => {
  syncJsonToForm();
});

function prettifySampleJson() {
  try {
    sampleForm.data = JSON.stringify(JSON.parse(sampleForm.data), null, 2);
    sampleJsonError.value = "";
  } catch (e) {
    sampleJsonError.value = "Cannot prettify: " + e.message;
  }
}

function validateSampleJson() {
  try {
    JSON.parse(sampleForm.data);
    sampleJsonError.value = "";
    showToast("JSON is valid");
  } catch (e) {
    sampleJsonError.value = "Invalid JSON: " + e.message;
  }
}

function saveSampleData() {
  sampleError.value = "";
  sampleJsonError.value = "";
  if (!sampleForm.name.trim()) {
    sampleError.value = "Name is required";
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(sampleForm.data);
  } catch (e) {
    sampleJsonError.value = "Invalid JSON: " + e.message;
    return;
  }
  sampleSaving.value = true;
  const payload = { name: sampleForm.name.trim(), data: parsed };
  const method = sampleForm._id ? "sampleData.update" : "sampleData.insert";
  const arg = sampleForm._id ? [sampleForm._id, payload] : [payload];
  Meteor.call(method, ...arg, (err) => {
    sampleSaving.value = false;
    if (err) {
      sampleError.value = err.reason || err.message;
    } else {
      showToast(sampleForm._id ? "Sample data updated" : "Sample data created");
      showSampleForm.value = false;
    }
  });
}

function deleteSampleData(id) {
  openConfirm("Delete Sample Data", "Are you sure you want to delete this sample data?", () => {
    Meteor.call("sampleData.remove", id, (err) => {
      if (err) showToast(err.reason || err.message, "error");
      else showToast("Sample data deleted");
    });
  });
}

const filteredSampleData = computed(() => {
  if (!sampleDataList?.value) return [];
  const q = searchQuery.value.toLowerCase();
  if (!q) return sampleDataList.value;
  return sampleDataList.value.filter((s) => s.name.toLowerCase().includes(q));
});

function sampleStructureSummary(data) {
  if (!data || typeof data !== "object") return "";
  const parts = [];
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) parts.push(`${k}[${v.length}]`);
    else if (typeof v === "object" && v) parts.push(`${k}{${Object.keys(v).length}}`);
    else if (typeof v === "string") parts.push(`${k}:"${v.slice(0, 15)}..."`);
    else parts.push(`${k}:${v}`);
  }
  return parts.join(", ");
}

// ── Presets ──────────────────────────────────────────────────────────────
subscribe("presets");
const presetsList = autorun(() =>
  PresetsCollection.find({}, { sort: { createdAt: -1 } }).fetch()
).result;

const presetForm = reactive({
  _id: null,
  name: "",
  schemaKey: "",
  blocks: [],
});
const showPresetForm = ref(false);
const presetSaving = ref(false);
const presetError = ref("");
const presetNameRef = ref(null);
const expandedBlocks = ref(new Set());

const presetBlockTemplate = () => ({
  type: "text",
  xPercent: 0.05,
  yPercent: 0.05,
  widthPercent: 0.40,
  heightPercent: 0.06,
  defaultProps: {},
});

function openPresetForm(item) {
  if (item) {
    presetForm._id = item._id;
    presetForm.name = item.name;
    presetForm.schemaKey = item.schemaKey;
    presetForm.blocks = JSON.parse(JSON.stringify(item.blocks));
  } else {
    presetForm._id = null;
    presetForm.name = "";
    presetForm.schemaKey = "";
    presetForm.blocks = [];
  }
  expandedBlocks.value = new Set();
  presetError.value = "";
  showPresetForm.value = true;
  nextTick(() => presetNameRef.value?.focus());
}

function addPresetBlock() {
  presetForm.blocks.push(presetBlockTemplate());
  expandedBlocks.value.add(presetForm.blocks.length - 1);
}

function removePresetBlock(idx) {
  presetForm.blocks.splice(idx, 1);
  expandedBlocks.value.delete(idx);
}

function movePresetBlock(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= presetForm.blocks.length) return;
  const tmp = presetForm.blocks[idx];
  presetForm.blocks[idx] = presetForm.blocks[target];
  presetForm.blocks[target] = tmp;
}

function toggleBlock(idx) {
  if (expandedBlocks.value.has(idx)) expandedBlocks.value.delete(idx);
  else expandedBlocks.value.add(idx);
}

function savePreset() {
  presetError.value = "";
  if (!presetForm.name.trim()) {
    presetError.value = "Preset name is required";
    return;
  }
  if (!presetForm.schemaKey.trim()) {
    presetError.value = "Schema key is required";
    return;
  }
  presetSaving.value = true;
  const payload = {
    name: presetForm.name.trim(),
    schemaKey: presetForm.schemaKey.trim(),
    blocks: presetForm.blocks,
  };
  const method = presetForm._id ? "presets.update" : "presets.insert";
  const arg = presetForm._id ? [presetForm._id, payload] : [payload];
  Meteor.call(method, ...arg, (err) => {
    presetSaving.value = false;
    if (err) {
      presetError.value = err.reason || err.message;
    } else {
      showToast(presetForm._id ? "Preset updated" : "Preset created");
      showPresetForm.value = false;
    }
  });
}

function deletePreset(id) {
  openConfirm("Delete Preset", "Are you sure you want to delete this preset?", () => {
    Meteor.call("presets.remove", id, (err) => {
      if (err) showToast(err.reason || err.message, "error");
      else showToast("Preset deleted");
    });
  });
}

const filteredPresets = computed(() => {
  if (!presetsList?.value) return [];
  const q = searchQuery.value.toLowerCase();
  if (!q) return presetsList.value;
  return presetsList.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.schemaKey || "").toLowerCase().includes(q)
  );
});

const schemaKeys = computed(() => {
  if (!schemas?.value) return [];
  return schemas.value.map((s) => s.name);
});

// ── Modal common helpers ─────────────────────────────────────────────────
function onModalKeydown(e, closeFn) {
  if (e.key === "Escape") closeFn();
}
</script>

<template>
  <div
    class="min-h-screen bg-[#1a1a2e] text-[#e0e0e0] font-sans p-8 selection:bg-[#00b4d8]/30 selection:text-white"
    @keydown.escape="showSchemaForm = false; showSampleForm = false; showPresetForm = false"
  >
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <div class="p-2.5 bg-gradient-to-tr from-[#00b4d8] to-[#0077b6] rounded-xl shadow-lg shadow-cyan-500/20">
          <Layers :size="26" class="text-white animate-pulse" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-[#e0e0e0] to-[#8892a4]">Config Manager</h1>
          <p class="text-xs text-[#8892a4] mt-0.5">Manage data structures, presets, and sample models</p>
        </div>
      </div>

      <!-- Tabs + Search -->
      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-[#0f3460]/80 mb-8 pb-px">
        <div class="flex gap-2">
          <button
            v-for="tab in [
              { key: 'schemas', label: 'Schemas', icon: Table },
              { key: 'sampleData', label: 'Sample Data', icon: Code },
              { key: 'presets', label: 'Presets', icon: Layers },
            ]"
            :key="tab.key"
            @click="activeTab = tab.key; searchQuery = ''"
            class="flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-t-xl transition-all duration-300 relative -mb-px"
            :class="
              activeTab === tab.key
                ? 'bg-[#16213e] text-[#00b4d8] border border-[#0f3460] border-b-transparent shadow-[0_-4px_12px_rgba(0,180,216,0.05)]'
                : 'text-[#8892a4] hover:text-white hover:bg-[#16213e]/30'
            "
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
            <span v-if="activeTab === tab.key" class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00b4d8] rounded-full" />
          </button>
        </div>

        <!-- Search -->
        <div class="relative pb-2.5">
          <Search :size="14" class="absolute left-3.5 top-1/2 -translate-y-[calc(50%+5px)] text-[#8892a4]" />
          <input
            v-model="searchQuery"
            class="pl-9 pr-3.5 py-2 bg-[#10192e]/60 border border-[#0f3460] rounded-xl text-white text-xs focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all duration-300 w-56 focus:w-72"
            placeholder="Search..."
          />
        </div>
      </div>

      <!-- ── Schemas Tab ──────────────────────────────── -->
      <div v-if="activeTab === 'schemas'">
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-[#8892a4]">
            <span class="font-semibold text-white">{{ schemas ? schemas.length : 0 }}</span> schema(s)
            <span v-if="searchQuery && filteredSchemas.length !== (schemas?.length || 0)" class="text-xs bg-[#1f2833] px-2 py-0.5 rounded ml-1 text-[#00b4d8]">
              {{ filteredSchemas.length }} filtered
            </span>
          </p>
          <button
            @click="openSchemaForm(null)"
            class="flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] text-[#0a1628] font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
          >
            <Plus :size="16" />
            New Schema
          </button>
        </div>

        <div v-if="filteredSchemas.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in filteredSchemas"
            :key="item._id"
            class="bg-gradient-to-br from-[#16213e] to-[#10192e] border border-[#0f3460] border-l-4 border-l-[#00b4d8] rounded-xl p-5 hover:border-[#00b4d8]/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/0 to-[#00b4d8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div class="flex items-start justify-between relative z-10">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5">
                  <h3 class="text-lg font-bold text-white truncate tracking-tight group-hover:text-[#00b4d8] transition-colors">{{ item.name }}</h3>
                  <span class="shrink-0 bg-[#10192e]/80 text-[#8892a4] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#0f3460]">
                    {{ item.schema?.fields?.length || 0 }} fields
                  </span>
                </div>
                <p class="text-sm text-[#8892a4] mt-1.5 truncate">
                  {{ item.schema?.label || "No label" }}
                </p>
                <p v-if="item.updatedAt" class="text-[10px] text-[#5a6a7a] mt-2 flex items-center gap-1 font-mono">
                  Updated: {{ new Date(item.updatedAt).toLocaleDateString() }}
                </p>
              </div>
              <div class="flex gap-1.5 shrink-0 ml-4">
                <button
                  @click="openSchemaForm(item)"
                  class="bg-[#10192e]/40 hover:bg-[#00b4d8]/20 p-2 rounded-lg transition-all duration-200"
                  title="Edit"
                >
                  <Edit :size="15" class="text-[#00b4d8]" />
                </button>
                <button
                  @click="deleteSchema(item._id)"
                  class="bg-[#10192e]/40 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-200"
                  title="Delete"
                >
                  <Trash2 :size="15" class="text-red-400" />
                </button>
              </div>
            </div>

            <!-- Field group summary -->
            <div v-if="item.schema?.fields?.length" class="mt-4 flex flex-wrap gap-1.5 relative z-10 border-t border-[#0f3460]/40 pt-3">
              <span
                v-for="f in item.schema.fields.slice(0, 6)"
                :key="f.key"
                class="text-[10px] font-mono bg-[#10192e]/60 text-[#b0b8c8] px-2 py-0.5 rounded-md border border-[#0f3460]"
              >
                <span class="text-[#00b4d8]/70">{{ f.group }}:</span>{{ f.key }}
              </span>
              <span
                v-if="item.schema.fields.length > 6"
                class="text-[10px] font-mono bg-[#00b4d8]/10 text-[#00b4d8] px-2 py-0.5 rounded-md border border-[#00b4d8]/20"
              >
                +{{ item.schema.fields.length - 6 }} more
              </span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center py-20 text-[#8892a4] bg-[#16213e]/40 border border-[#0f3460] rounded-xl"
        >
          <AlertTriangle :size="28" class="mb-3 text-[#0f3460]" />
          <p v-if="searchQuery">No schemas match "{{ searchQuery }}"</p>
          <p v-else>No schemas configured yet.</p>
        </div>

        <!-- Schema form modal -->
        <Teleport to="body">
          <div
            v-if="showSchemaForm"
            class="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-[#0b0c10]/80 backdrop-blur-md"
            @click.self="showSchemaForm = false"
            @keydown.escape="showSchemaForm = false"
          >
            <div
              class="bg-[#151b24] border border-[#1f2833]/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-black/80"
            >
              <div
                class="flex items-center justify-between p-6 border-b border-[#1f2833]/80 bg-[#151b24]"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-[#00b4d8]/10 p-2.5 rounded-xl">
                    <Table :size="20" class="text-[#00b4d8]" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-white tracking-tight">
                      {{ schemaForm._id ? "Edit" : "New" }} Schema
                    </h2>
                    <p class="text-xs text-[#8892a4] mt-0.5">
                      {{ schemaForm.schema.fields.length }} field(s) defined
                    </p>
                  </div>
                </div>
                <button
                  @click="showSchemaForm = false"
                  class="text-[#8892a4] hover:text-white transition-all hover:bg-[#1f2833]/60 p-2 rounded-xl"
                >
                  <X :size="20" />
                </button>
              </div>
              <div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                <div>
                  <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">
                    Schema Key
                    <span class="text-[#00b4d8] font-bold">*</span>
                  </label>
                  <input
                    ref="schemaNameRef"
                    v-model="schemaForm.name"
                    class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all duration-200"
                    placeholder="e.g. Invoice, Sale Order, Receipt"
                  />
                  <p class="text-xs text-[#5a6a7a] mt-2">
                    Used as the unique identifier. Must match the key used in sample data and presets.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">
                      Label
                      <span class="text-[#00b4d8] font-bold">*</span>
                    </label>
                    <input
                      v-model="schemaForm.schema.label"
                      class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all duration-200"
                      placeholder="e.g. Customer Invoice"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">
                      Description
                    </label>
                    <input
                      v-model="schemaForm.schema.description"
                      class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all duration-200"
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                <!-- Fields -->
                <div class="border-t border-[#1f2833]/80 pt-6">
                  <div class="flex items-center justify-between mb-4">
                    <label class="text-base font-bold text-white flex items-center gap-2">
                      Fields
                      <span class="bg-[#0b0c10]/80 text-[#8892a4] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#1f2833]">
                        {{ schemaForm.schema.fields.length }}
                      </span>
                    </label>
                    <button
                      @click="addSchemaField"
                      class="text-xs font-bold text-[#0a1628] bg-[#00b4d8] hover:bg-[#0096c7] transition-all duration-200 flex items-center gap-1.5 px-4 py-2 rounded-xl hover:shadow-md hover:shadow-cyan-500/20 active:scale-95"
                    >
                      <Plus :size="14" /> Add Field
                    </button>
                  </div>

                  <div v-if="schemaForm.schema.fields.length === 0" class="text-center py-12 text-[#5a6a7a] text-sm bg-[#0b0c10]/40 rounded-2xl border-2 border-dashed border-[#1f2833] flex flex-col items-center justify-center gap-2">
                    <div class="bg-[#1f2833]/45 p-3 rounded-full">
                      <Plus :size="20" class="text-[#8892a4]" />
                    </div>
                    No fields defined yet.
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="(field, idx) in schemaForm.schema.fields"
                      :key="idx"
                      class="bg-[#0b0c10]/40 rounded-xl overflow-hidden transition-all duration-300"
                      :class="[
                        isDuplicate(field.key)
                          ? 'border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.05)]'
                          : 'border border-[#1f2833] hover:border-[#00b4d8]/40 hover:shadow-[0_0_12px_rgba(0,180,216,0.02)]'
                      ]"
                    >
                      <!-- Row header -->
                      <div class="flex items-center gap-2.5 px-4 py-3 bg-[#151b24]/60 border-b border-[#1f2833]/40">
                        <span class="text-xs font-mono font-bold text-[#8892a4] bg-[#1f2833] px-2.5 py-0.5 rounded-lg border border-[#1f2833]">
                          #{{ idx + 1 }}
                        </span>
                        <span
                          v-if="isDuplicate(field.key)"
                          class="text-[10px] text-red-400 flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20"
                        >
                          <AlertTriangle :size="11" /> Duplicate key
                        </span>
                        <span v-else-if="field.key" class="text-xs font-mono text-[#00b4d8] truncate max-w-[200px]">
                          {{ field.key }}
                        </span>
                        <span v-else class="text-xs text-[#5a6a7a] italic">empty key</span>

                        <!-- Type Badge -->
                        <span
                          v-if="field.type"
                          class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                          :class="{
                            'bg-sky-500/10 text-sky-400 border-sky-500/20': field.type === 'string',
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': field.type === 'number',
                            'bg-amber-500/10 text-amber-400 border-amber-500/20': field.type === 'date',
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': field.type === 'currency',
                            'bg-purple-500/10 text-purple-400 border-purple-500/20': field.type === 'table',
                            'bg-pink-500/10 text-pink-400 border-pink-500/20': field.type === 'image',
                          }"
                        >
                          {{ field.type }}
                        </span>

                        <div class="flex-1" />
                        <div class="flex items-center gap-1">
                          <button
                            @click="moveSchemaField(idx, -1)"
                            :disabled="idx === 0"
                            class="text-[#5a6a7a] hover:text-white disabled:opacity-20 transition-all p-1 rounded-lg hover:bg-[#1f2833]"
                            title="Move up"
                          >
                            <ChevronUp :size="15" />
                          </button>
                          <button
                            @click="moveSchemaField(idx, 1)"
                            :disabled="idx === schemaForm.schema.fields.length - 1"
                            class="text-[#5a6a7a] hover:text-white disabled:opacity-20 transition-all p-1 rounded-lg hover:bg-[#1f2833]"
                            title="Move down"
                          >
                            <ChevronDown :size="15" />
                          </button>
                          <button
                            @click="removeSchemaField(idx)"
                            class="text-red-400 hover:text-red-300 transition-all p-1 rounded-lg hover:bg-red-500/10"
                            title="Remove field"
                          >
                            <Trash2 :size="15" />
                          </button>
                        </div>
                      </div>

                      <!-- Row body -->
                      <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Key</label>
                          <input
                            v-model="field.key"
                            class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                            placeholder="e.g. doc.number"
                          />
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Label</label>
                          <input
                            v-model="field.label"
                            class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                            placeholder="e.g. Invoice No."
                          />
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Group</label>
                          <div class="relative">
                            <select
                              v-model="field.group"
                              class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all appearance-none pr-8"
                            >
                              <option v-for="g in FIELD_GROUPS" :key="g" :value="g">{{ g }}</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#8892a4]">
                              <ChevronDown :size="14" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Type</label>
                          <div class="relative">
                            <select
                              v-model="field.type"
                              class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all appearance-none pr-8"
                            >
                              <option value="string">string</option>
                              <option value="date">date</option>
                              <option value="currency">currency</option>
                              <option value="number">number</option>
                              <option value="table">table</option>
                              <option value="image">image</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#8892a4]">
                              <ChevronDown :size="14" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p v-if="schemaError" class="text-red-400 text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle :size="16" /> {{ schemaError }}
                </p>

                <div class="flex justify-end gap-3 pt-5 border-t border-[#1f2833]/80">
                  <button
                    @click="showSchemaForm = false"
                    class="px-5 py-2.5 text-sm font-semibold text-[#8892a4] hover:text-white transition-all rounded-xl hover:bg-[#1f2833]/40"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveSchema"
                    :disabled="schemaSaving"
                    class="flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-[#1f2833] disabled:text-[#5a6a7a] text-[#0a1628] font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
                  >
                    <div
                      v-if="schemaSaving"
                      class="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin"
                    />
                    <Save v-else :size="15" />
                    {{ schemaSaving ? "Saving..." : "Save Schema" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- ── Sample Data Tab ──────────────────────────── -->
      <div v-if="activeTab === 'sampleData'">
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-[#8892a4]">
            <span class="font-semibold text-white">{{ sampleDataList ? sampleDataList.length : 0 }}</span> sample data set(s)
            <span v-if="searchQuery && filteredSampleData.length !== (sampleDataList?.length || 0)" class="text-xs bg-[#1f2833] px-2 py-0.5 rounded ml-1 text-[#00b4d8]">
              {{ filteredSampleData.length }} filtered
            </span>
          </p>
          <button
            @click="openSampleForm(null)"
            class="flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] text-[#0a1628] font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
          >
            <Plus :size="16" />
            New Sample Data
          </button>
        </div>

        <div v-if="filteredSampleData.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in filteredSampleData"
            :key="item._id"
            class="bg-gradient-to-br from-[#16213e] to-[#10192e] border border-[#0f3460] border-l-4 border-l-[#00b4d8] rounded-xl p-5 hover:border-[#00b4d8]/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/0 to-[#00b4d8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div class="flex items-start justify-between relative z-10">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5">
                  <h3 class="text-lg font-bold text-white truncate tracking-tight group-hover:text-[#00b4d8] transition-colors">{{ item.name }}</h3>
                  <span class="shrink-0 bg-[#10192e]/80 text-[#8892a4] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#0f3460]">
                    {{ Object.keys(item.data || {}).length }} keys
                  </span>
                </div>
                <p class="text-xs text-[#8892a4] mt-2 truncate font-mono bg-[#10192e]/30 px-2 py-1.5 rounded-md border border-[#0f3460]/40">
                  {{ sampleStructureSummary(item.data) }}
                </p>
                <p v-if="item.updatedAt" class="text-[10px] text-[#5a6a7a] mt-2.5 flex items-center gap-1 font-mono">
                  Updated: {{ new Date(item.updatedAt).toLocaleDateString() }}
                </p>
              </div>
              <div class="flex gap-1.5 shrink-0 ml-4">
                <button
                  @click="openSampleForm(item)"
                  class="bg-[#10192e]/40 hover:bg-[#00b4d8]/20 p-2 rounded-lg transition-all duration-200"
                  title="Edit"
                >
                  <Edit :size="15" class="text-[#00b4d8]" />
                </button>
                <button
                  @click="deleteSampleData(item._id)"
                  class="bg-[#10192e]/40 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-200"
                  title="Delete"
                >
                  <Trash2 :size="15" class="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center py-20 text-[#8892a4] bg-[#151b24]/40 border border-[#1f2833] rounded-xl"
        >
          <AlertTriangle :size="28" class="mb-3 text-[#1f2833]" />
          <p v-if="searchQuery">No sample data matches "{{ searchQuery }}"</p>
          <p v-else>No sample data configured yet.</p>
        </div>

        <!-- Sample data form modal -->
        <Teleport to="body">
          <div
            v-if="showSampleForm"
            class="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-[#0b0c10]/80 backdrop-blur-md"
            @click.self="showSampleForm = false"
            @keydown.escape="showSampleForm = false"
          >
            <div
              class="bg-[#151b24] border border-[#1f2833]/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-black/80"
            >
              <div class="flex items-center justify-between p-6 border-b border-[#1f2833]/80 bg-[#151b24]">
                <div class="flex items-center gap-3">
                  <div class="bg-[#00b4d8]/10 p-2.5 rounded-xl">
                    <Code :size="20" class="text-[#00b4d8]" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-white tracking-tight">
                      {{ sampleForm._id ? "Edit" : "New" }} Sample Data
                    </h2>
                    <p class="text-xs text-[#8892a4] mt-0.5">Define JSON model structure</p>
                  </div>
                </div>
                <button
                  @click="showSampleForm = false"
                  class="text-[#8892a4] hover:text-white transition-all hover:bg-[#1f2833]/60 p-2 rounded-xl"
                >
                  <X :size="20" />
                </button>
              </div>
              <div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                <div>
                  <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">
                    Linked Schema (Name)
                    <span class="text-[#00b4d8] font-bold">*</span>
                  </label>
                  <div class="relative">
                    <select
                      ref="sampleNameRef"
                      v-model="sampleForm.name"
                      class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all appearance-none pr-10"
                    >
                      <option value="" disabled>Select a schema...</option>
                      <option
                        v-for="key in schemaKeys"
                        :key="key"
                        :value="key"
                      >{{ key }}</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8892a4]">
                      <ChevronDown :size="18" />
                    </div>
                  </div>
                </div>

                 <!-- Mode Toggle (only show if name is selected and has matching schema) -->
                <div v-if="sampleForm.name && sampleForm.name !== 'Custom' && selectedSchemaFields.length > 0" class="flex gap-2 p-1 bg-[#0b0c10]/40 border border-[#1f2833] rounded-xl max-w-max">
                  <button
                    type="button"
                    @click="sampleFormMode = 'form'"
                    class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                    :class="sampleFormMode === 'form' ? 'bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/20' : 'text-[#8892a4] hover:text-white'"
                  >
                    Form View
                  </button>
                  <button
                    type="button"
                    @click="sampleFormMode = 'json'"
                    class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                    :class="sampleFormMode === 'json' ? 'bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/20' : 'text-[#8892a4] hover:text-white'"
                  >
                    JSON View
                  </button>
                </div>

                <!-- Form View: Render fields dynamically -->
                <div v-if="sampleFormMode === 'form'" class="space-y-6">
                  <div v-for="(fields, groupName) in groupedFields" :key="groupName" class="bg-[#0b0c10]/45 border border-[#1f2833]/60 rounded-xl p-5 space-y-4">
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1f2833]/40 pb-2 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#00b4d8]"></span>
                      {{ groupName }} Fields
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div v-for="field in fields" :key="field.key" class="space-y-1.5">
                        <label class="block text-xs font-semibold text-[#8892a4]">{{ field.label || field.key }}</label>
                        
                        <!-- Number Input -->
                        <input
                          v-if="field.type === 'number'"
                          type="number"
                          :value="getNestedKey(sampleFormParsed, field.key)"
                          @input="(e) => { setNestedKey(sampleFormParsed, field.key, parseFloat(e.target.value) || 0); syncFormToJson(); }"
                          class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                        />
                        
                        <!-- Currency Input -->
                        <div v-else-if="field.type === 'currency'" class="relative">
                          <span class="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-[#5a6a7a] pointer-events-none">$</span>
                          <input
                            type="number"
                            step="0.01"
                            :value="getNestedKey(sampleFormParsed, field.key)"
                            @input="(e) => { setNestedKey(sampleFormParsed, field.key, parseFloat(e.target.value) || 0); syncFormToJson(); }"
                            class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg pl-7 pr-3.5 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                          />
                        </div>
                        
                        <!-- Date Input -->
                        <input
                          v-else-if="field.type === 'date'"
                          type="date"
                          :value="getNestedKey(sampleFormParsed, field.key)"
                          @input="(e) => { setNestedKey(sampleFormParsed, field.key, e.target.value); syncFormToJson(); }"
                          class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                        />

                        <!-- Table Input (JSON array rows) -->
                        <div v-else-if="field.type === 'table'" class="space-y-1">
                          <textarea
                            :value="JSON.stringify(getNestedKey(sampleFormParsed, field.key), null, 2)"
                            @input="(e) => {
                              try {
                                setNestedKey(sampleFormParsed, field.key, JSON.parse(e.target.value));
                                syncFormToJson();
                                sampleJsonError.value = '';
                              } catch (err) {
                                sampleJsonError.value = 'Table rows must be valid JSON array: ' + err.message;
                              }
                            }"
                            rows="4"
                            class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2 text-white text-xs font-mono leading-relaxed focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all resize-y"
                            placeholder='[ { "name": "Item 1", "qty": 1, "price": 10 } ]'
                            spellcheck="false"
                          ></textarea>
                        </div>
                        
                        <!-- String/Image Default Input -->
                        <input
                          v-else
                          type="text"
                          :value="getNestedKey(sampleFormParsed, field.key)"
                          @input="(e) => { setNestedKey(sampleFormParsed, field.key, e.target.value); syncFormToJson(); }"
                          class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- JSON View -->
                <div v-else>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider">
                      JSON Data
                      <span class="text-[#00b4d8] font-bold">*</span>
                    </label>
                    <div class="flex gap-2">
                      <button
                        @click="validateSampleJson"
                        class="text-xs font-bold text-[#00b4d8] hover:text-[#0096c7] bg-[#00b4d8]/10 border border-[#00b4d8]/20 transition-all duration-200 flex items-center gap-1 px-3 py-1.5 rounded-lg active:scale-95"
                      >
                        <Check :size="12" /> Validate
                      </button>
                      <button
                        @click="prettifySampleJson"
                        class="text-xs font-bold text-[#00b4d8] hover:text-[#0096c7] bg-[#00b4d8]/10 border border-[#00b4d8]/20 transition-all duration-200 flex items-center gap-1 px-3 py-1.5 rounded-lg active:scale-95"
                      >
                        <Code :size="12" /> Prettify
                      </button>
                    </div>
                  </div>
                  <div class="relative">
                    <textarea
                      v-model="sampleForm.data"
                      rows="14"
                      class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3.5 text-white text-sm font-mono leading-relaxed focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all resize-y selection:bg-[#00b4d8]/30 selection:text-white"
                      placeholder='{\n  "doc": { "number": "INV-001" }\n}'
                      spellcheck="false"
                    ></textarea>
                  </div>
                  <p v-if="sampleJsonError" class="text-red-400 text-xs mt-2 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                    <AlertTriangle :size="12" /> {{ sampleJsonError }}
                  </p>
                </div>

                <p v-if="sampleError" class="text-red-400 text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle :size="16" /> {{ sampleError }}
                </p>

                <div class="flex justify-end gap-3 pt-5 border-t border-[#1f2833]/80">
                  <button
                    @click="showSampleForm = false"
                    class="px-5 py-2.5 text-sm font-semibold text-[#8892a4] hover:text-white transition-all rounded-xl hover:bg-[#1f2833]/40"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveSampleData"
                    :disabled="sampleSaving"
                    class="flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-[#1f2833] disabled:text-[#5a6a7a] text-[#0a1628] font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
                  >
                    <div
                      v-if="sampleSaving"
                      class="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin"
                    />
                    <Save v-else :size="15" />
                    {{ sampleSaving ? "Saving..." : "Save Sample Data" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <!-- ── Presets Tab ──────────────────────────────── -->
      <div v-if="activeTab === 'presets'">
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-[#8892a4]">
            <span class="font-semibold text-white">{{ presetsList ? presetsList.length : 0 }}</span> preset(s)
            <span v-if="searchQuery && filteredPresets.length !== (presetsList?.length || 0)" class="text-xs bg-[#1f2833] px-2 py-0.5 rounded ml-1 text-[#00b4d8]">
              {{ filteredPresets.length }} filtered
            </span>
          </p>
          <button
            @click="openPresetForm(null)"
            class="flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] text-[#0a1628] font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
          >
            <Plus :size="16" />
            New Preset
          </button>
        </div>

        <div v-if="filteredPresets.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in filteredPresets"
            :key="item._id"
            class="bg-gradient-to-br from-[#16213e] to-[#10192e] border border-[#0f3460] border-l-4 border-l-[#00b4d8] rounded-xl p-5 hover:border-[#00b4d8]/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-tr from-[#00b4d8]/0 to-[#00b4d8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div class="flex items-start justify-between relative z-10">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5">
                  <h3 class="text-lg font-bold text-white truncate tracking-tight group-hover:text-[#00b4d8] transition-colors">{{ item.name }}</h3>
                  <span class="shrink-0 bg-[#00b4d8]/10 text-[#00b4d8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#00b4d8]/20">
                    {{ item.schemaKey }}
                  </span>
                  <span class="shrink-0 bg-[#10192e]/80 text-[#8892a4] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#0f3460]">
                    {{ item.blocks?.length || 0 }} blocks
                  </span>
                </div>
                <p v-if="item.updatedAt" class="text-[10px] text-[#5a6a7a] mt-2 flex items-center gap-1 font-mono">
                  Updated: {{ new Date(item.updatedAt).toLocaleDateString() }}
                </p>
              </div>
              <div class="flex gap-1.5 shrink-0 ml-4">
                <button
                  @click="openPresetForm(item)"
                  class="bg-[#10192e]/40 hover:bg-[#00b4d8]/20 p-2 rounded-lg transition-all duration-200"
                  title="Edit"
                >
                  <Edit :size="15" class="text-[#00b4d8]" />
                </button>
                <button
                  @click="deletePreset(item._id)"
                  class="bg-[#10192e]/40 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-200"
                  title="Delete"
                >
                  <Trash2 :size="15" class="text-red-400" />
                </button>
              </div>
            </div>

            <!-- Block summary -->
            <div v-if="item.blocks?.length" class="mt-4 flex flex-wrap gap-1.5 relative z-10 border-t border-[#1f2833]/40 pt-3">
              <span
                v-for="(b, bi) in item.blocks.slice(0, 5)"
                :key="bi"
                class="text-[10px] font-mono bg-[#0b0c10]/60 text-[#b0b8c8] px-2 py-0.5 rounded-md border border-[#1f2833]"
              >
                {{ b.type }}
                <span class="text-[#5a6a7a]">({{ Math.round((b.xPercent || 0) * 100) }}%,{{ Math.round((b.yPercent || 0) * 100) }}%)</span>
              </span>
              <span
                v-if="item.blocks.length > 5"
                class="text-[10px] font-mono bg-[#00b4d8]/10 text-[#00b4d8] px-2 py-0.5 rounded-md border border-[#00b4d8]/20"
              >
                +{{ item.blocks.length - 5 }} more
              </span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center py-20 text-[#8892a4] bg-[#151b24]/40 border border-[#1f2833] rounded-xl"
        >
          <AlertTriangle :size="28" class="mb-3 text-[#1f2833]" />
          <p v-if="searchQuery">No presets match "{{ searchQuery }}"</p>
          <p v-else>No presets configured yet.</p>
        </div>

        <!-- Preset form modal -->
        <Teleport to="body">
          <div
            v-if="showPresetForm"
            class="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-[#0b0c10]/80 backdrop-blur-md"
            @click.self="showPresetForm = false"
            @keydown.escape="showPresetForm = false"
          >
            <div
              class="bg-[#151b24] border border-[#1f2833]/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-black/80"
            >
              <div class="flex items-center justify-between p-6 border-b border-[#1f2833]/80 bg-[#151b24]">
                <div class="flex items-center gap-3">
                  <div class="bg-[#00b4d8]/10 p-2.5 rounded-xl">
                    <Layers :size="20" class="text-[#00b4d8]" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-white tracking-tight">
                      {{ presetForm._id ? "Edit" : "New" }} Preset
                    </h2>
                    <p class="text-xs text-[#8892a4] mt-0.5">Configure layout coordinates and blocks</p>
                  </div>
                </div>
                <button
                  @click="showPresetForm = false"
                  class="text-[#8892a4] hover:text-white transition-all hover:bg-[#1f2833]/60 p-2 rounded-xl"
                >
                  <X :size="20" />
                </button>
              </div>
              <div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">
                      Preset Name
                      <span class="text-[#00b4d8] font-bold">*</span>
                    </label>
                    <input
                      ref="presetNameRef"
                      v-model="presetForm.name"
                      class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all duration-200"
                      placeholder="e.g. Default Invoice"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">
                      Linked Schema
                      <span class="text-[#00b4d8] font-bold">*</span>
                    </label>
                    <div class="relative">
                      <select
                        v-model="presetForm.schemaKey"
                        class="w-full bg-[#0b0c10]/60 border border-[#1f2833] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all appearance-none pr-10"
                      >
                        <option value="" disabled>Select a schema...</option>
                        <option
                          v-for="key in schemaKeys"
                          :key="key"
                          :value="key"
                        >{{ key }}</option>
                        <option value="Custom">Custom</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8892a4]">
                        <ChevronDown :size="18" />
                      </div>
                    </div>
                    <p class="text-xs text-[#5a6a7a] mt-2">
                      Defines which fields are available for data binding.
                    </p>
                  </div>
                </div>

                <!-- Blocks -->
                <div class="border-t border-[#1f2833]/80 pt-6">
                  <div class="flex items-center justify-between mb-4">
                    <label class="text-base font-bold text-white flex items-center gap-2">
                      Blocks
                      <span class="bg-[#0b0c10]/80 text-[#8892a4] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#1f2833]">
                        {{ presetForm.blocks.length }}
                      </span>
                    </label>
                    <button
                      @click="addPresetBlock"
                      class="text-xs font-bold text-[#0a1628] bg-[#00b4d8] hover:bg-[#0096c7] transition-all duration-200 flex items-center gap-1.5 px-4 py-2 rounded-xl hover:shadow-md hover:shadow-cyan-500/20 active:scale-95"
                    >
                      <Plus :size="14" /> Add Block
                    </button>
                  </div>

                  <div v-if="presetForm.blocks.length === 0" class="text-center py-12 text-[#5a6a7a] text-sm bg-[#0b0c10]/40 rounded-2xl border-2 border-dashed border-[#1f2833] flex flex-col items-center justify-center gap-2">
                    <div class="bg-[#1f2833]/45 p-3 rounded-full">
                      <Plus :size="20" class="text-[#8892a4]" />
                    </div>
                    No blocks defined yet.
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="(block, idx) in presetForm.blocks"
                      :key="idx"
                      class="bg-[#0b0c10]/45 border border-[#1f2833] rounded-xl overflow-hidden hover:border-[#00b4d8]/40 transition-all duration-300"
                    >
                      <!-- Block header -->
                      <div
                        class="flex items-center gap-3 px-4 py-3 bg-[#151b24]/60 border-b border-[#1f2833]/40 cursor-pointer hover:bg-[#151b24] transition-colors select-none"
                        @click="toggleBlock(idx)"
                      >
                        <span class="text-xs font-mono font-bold text-[#8892a4] bg-[#1f2833] px-2.5 py-0.5 rounded-lg border border-[#1f2833]">
                          #{{ idx + 1 }}
                        </span>
                        
                        <!-- Block Type Tag (Color coded categories) -->
                        <span
                          v-if="block.type"
                          class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                          :class="{
                            'bg-purple-500/10 text-purple-400 border-purple-500/20': ['container', 'row', 'column', 'grid', 'section', 'background_block'].includes(block.type),
                            'bg-sky-500/10 text-sky-400 border-sky-500/20': ['text', 'dynamic_text', 'image', 'divider', 'spacer', 'page_break', 'page_number'].includes(block.type),
                            'bg-amber-500/10 text-amber-400 border-amber-500/20': ['company_info', 'client_info', 'header_grid', 'field_row', 'document_title', 'document_number', 'issue_date', 'due_date', 'reference_number', 'terms', 'footer_note', 'thank_you'].includes(block.type),
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': ['item_table', 'table_builder', 'currency_summary', 'subtotal', 'discount', 'tax', 'grand_total', 'balance_due', 'deposit_paid', 'bank_details'].includes(block.type),
                            'bg-indigo-500/10 text-indigo-400 border-indigo-500/20': !['container', 'row', 'column', 'grid', 'section', 'background_block', 'text', 'dynamic_text', 'image', 'divider', 'spacer', 'page_break', 'page_number', 'company_info', 'client_info', 'header_grid', 'field_row', 'document_title', 'document_number', 'issue_date', 'due_date', 'reference_number', 'terms', 'footer_note', 'thank_you', 'item_table', 'table_builder', 'currency_summary', 'subtotal', 'discount', 'tax', 'grand_total', 'balance_due', 'deposit_paid', 'bank_details'].includes(block.type)
                          }"
                        >
                          {{ block.type }}
                        </span>

                        <span class="text-[11px] font-mono text-[#5a6a7a] truncate hidden sm:inline">
                          Pos: {{ Math.round((block.xPercent || 0) * 100) }}%, {{ Math.round((block.yPercent || 0) * 100) }}%
                          &middot;
                          Size: {{ Math.round((block.widthPercent || 0) * 100) }}% x {{ Math.round((block.heightPercent || 0) * 100) }}%
                        </span>
                        
                        <div class="flex-1" />
                        <div class="flex items-center gap-1">
                          <button
                            @click.stop="movePresetBlock(idx, -1)"
                            :disabled="idx === 0"
                            class="text-[#5a6a7a] hover:text-white disabled:opacity-20 transition-all p-1 rounded-lg hover:bg-[#1f2833]"
                          >
                            <ChevronUp :size="15" />
                          </button>
                          <button
                            @click.stop="movePresetBlock(idx, 1)"
                            :disabled="idx === presetForm.blocks.length - 1"
                            class="text-[#5a6a7a] hover:text-white disabled:opacity-20 transition-all p-1 rounded-lg hover:bg-[#1f2833]"
                          >
                            <ChevronDown :size="15" />
                          </button>
                          <button
                            @click.stop="removePresetBlock(idx)"
                            class="text-red-400 hover:text-red-300 transition-all p-1 rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 :size="15" />
                          </button>
                          <ChevronDown
                            :size="15"
                            class="text-[#5a6a7a] transition-transform duration-300 ml-1"
                            :class="expandedBlocks.has(idx) ? 'rotate-180 text-white' : ''"
                          />
                        </div>
                      </div>

                      <!-- Block body -->
                      <Transition name="fade">
                        <div v-if="expandedBlocks.has(idx)" class="p-4 space-y-4 bg-[#151b24]/20">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Type</label>
                              <div class="relative">
                                <select
                                  v-model="block.type"
                                  class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all appearance-none pr-8"
                                >
                                  <option v-for="bt in KNOWN_BLOCK_TYPES" :key="bt" :value="bt">{{ bt }}</option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#8892a4]">
                                  <ChevronDown :size="14" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">defaultProps (JSON)</label>
                              <textarea
                                :value="JSON.stringify(block.defaultProps, null, 2)"
                                @input="
                                  (e) => {
                                    try {
                                      block.defaultProps = JSON.parse(e.target.value);
                                    } catch {}
                                  }
                                "
                                rows="3"
                                class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all resize-y selection:bg-[#00b4d8]/30"
                                placeholder='{ "content": "Hello" }'
                                spellcheck="false"
                              ></textarea>
                            </div>
                          </div>
                          
                          <!-- Coordinate sliders/inputs -->
                          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#1f2833]/40 pt-4">
                            <div>
                              <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">X Coordinate</label>
                              <div class="relative">
                                <input
                                  :value="Math.round((block.xPercent || 0) * 100)"
                                  @input="
                                    (e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) block.xPercent = Math.max(0, Math.min(100, v)) / 100;
                                    }
                                  "
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg pl-3.5 pr-8 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                                />
                                <span class="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#5a6a7a] pointer-events-none">%</span>
                              </div>
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Y Coordinate</label>
                              <div class="relative">
                                <input
                                  :value="Math.round((block.yPercent || 0) * 100)"
                                  @input="
                                    (e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) block.yPercent = Math.max(0, Math.min(100, v)) / 100;
                                    }
                                  "
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg pl-3.5 pr-8 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                                />
                                <span class="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#5a6a7a] pointer-events-none">%</span>
                              </div>
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Width</label>
                              <div class="relative">
                                <input
                                  :value="Math.round((block.widthPercent || 0) * 100)"
                                  @input="
                                    (e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) block.widthPercent = Math.max(0, Math.min(100, v)) / 100;
                                    }
                                  "
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg pl-3.5 pr-8 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                                />
                                <span class="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#5a6a7a] pointer-events-none">%</span>
                              </div>
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-[#8892a4] uppercase tracking-wider mb-1.5">Height</label>
                              <div class="relative">
                                <input
                                  :value="Math.round((block.heightPercent || 0) * 100)"
                                  @input="
                                    (e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) block.heightPercent = Math.max(0, Math.min(100, v)) / 100;
                                    }
                                  "
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  class="w-full bg-[#151b24] border border-[#1f2833] rounded-lg pl-3.5 pr-8 py-2 text-white text-sm focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/10 transition-all"
                                />
                                <span class="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#5a6a7a] pointer-events-none">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>

                <p v-if="presetError" class="text-red-400 text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle :size="16" /> {{ presetError }}
                </p>

                <div class="flex justify-end gap-3 pt-5 border-t border-[#1f2833]/80">
                  <button
                    @click="showPresetForm = false"
                    class="px-5 py-2.5 text-sm font-semibold text-[#8892a4] hover:text-white transition-all rounded-xl hover:bg-[#1f2833]/40"
                  >
                    Cancel
                  </button>
                  <button
                    @click="savePreset"
                    :disabled="presetSaving"
                    class="flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-[#1f2833] disabled:text-[#5a6a7a] text-[#0a1628] font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
                  >
                    <div
                      v-if="presetSaving"
                      class="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin"
                    />
                    <Save v-else :size="15" />
                    {{ presetSaving ? "Saving..." : "Save Preset" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- ── Toast container ──────────────────────────── -->
    <Teleport to="body">
      <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        <TransitionGroup name="toast">
          <div
            v-for="t in toasts"
            :key="t.id"
            class="pointer-events-auto px-5 py-3 rounded-xl text-sm font-bold shadow-2xl backdrop-blur-md flex items-center gap-2.5 border animate-[slideIn_0.25s_ease-out]"
            :class="t.type === 'error' ? 'bg-red-950/90 text-red-200 border-red-500/30' : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'"
          >
            <Check v-if="t.type === 'success'" :size="16" class="text-emerald-400" />
            <AlertTriangle v-else :size="16" class="text-red-400" />
            {{ t.message }}
          </div>
        </TransitionGroup>
      </div>
    </Teleport>

    <!-- ── Confirm Dialog ──────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="confirmDialog.show"
        class="fixed inset-0 z-[9998] flex items-center justify-center bg-[#0b0c10]/80 backdrop-blur-md"
        @click.self="closeConfirm"
        @keydown.escape="closeConfirm"
      >
        <div class="bg-[#151b24] border border-[#1f2833]/80 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/80">
          <div class="flex items-center gap-3.5 mb-4">
            <div class="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              <AlertTriangle :size="20" class="text-red-400" />
            </div>
            <h3 class="text-lg font-bold text-white tracking-tight">{{ confirmDialog.title }}</h3>
          </div>
          <p class="text-sm text-[#8892a4] leading-relaxed mb-6">{{ confirmDialog.message }}</p>
          <div class="flex justify-end gap-3">
            <button
              @click="closeConfirm"
              class="px-4.5 py-2 text-sm font-semibold text-[#8892a4] hover:text-white transition-all rounded-lg"
            >
              Cancel
            </button>
            <button
              @click="confirmDialog.onConfirm?.(); closeConfirm()"
              class="px-5 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md shadow-red-500/20 active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.toast-enter-active {
  transition: all 0.25s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
