<script setup>
import { ref, nextTick } from "vue";
import { subscribe, autorun } from "vue-meteor-tracker";
import { Meteor } from "meteor/meteor";
import { InvoicesCollection } from "/imports/api/invoices";
import { FileText, Plus, Edit, Trash2, Printer } from "@lucide/vue";
import { InvoiceRenderer, useSettingsStore } from "invoice-builder";
import customPrintPlugin from "./print";

// Subscribe reactively to invoices collection
subscribe("invoices");
const invoices = autorun(() =>
  InvoicesCollection.find({}, { sort: { createdAt: -1 } }).fetch(),
).result;

function deleteTemplate(id, name) {
  if (confirm(`Are you sure you want to delete template "${name}"?`)) {
    Meteor.call("invoices.remove", id, (err) => {
      if (err) {
        alert("Failed to delete: " + err.reason);
      }
    });
  }
}

const printingInvoice = ref(null);
const printingFakerData = ref(null);
const isPrinting = ref(false);

const handleReadyPrint = () => {
  customPrintPlugin(".invoice-renderer-sheet", {
    afterPrint: () => {
      printingInvoice.value = null;
      printingFakerData.value = null;
      isPrinting.value = false;
    },
    customClass: [`.content {overflow: unset !important };`],
  });
};

function printTemplate(invoice) {
  if (isPrinting.value) return;
  isPrinting.value = true;

  const docType = invoice.settings?.documentType || "Invoice";
  Meteor.call("invoices.getFakerData", docType, (err, fakerData) => {
    if (err) {
      alert("Failed to get test print data: " + err.reason);
      isPrinting.value = false;
      return;
    }
    console.log("fakerData", fakerData, invoice);
    // const settingsStore = useSettingsStore();
    // settingsStore.setSampleData(fakerData);
    // if (invoice.settings) {
    //   if (invoice.settings.layoutMode)
    //     settingsStore.setLayoutMode(invoice.settings.layoutMode);
    //   if (invoice.settings.globalFont)
    //     settingsStore.setGlobalFont(invoice.settings.globalFont);
    //   if (invoice.settings.globalFontSize)
    //     settingsStore.setGlobalFontSize(invoice.settings.globalFontSize);
    //   if (invoice.settings.documentType)
    //     settingsStore.setDocumentType(invoice.settings.documentType);
    //   if (invoice.settings.repeatFooter !== undefined)
    //     settingsStore.setRepeatFooter(invoice.settings.repeatFooter);
    //   if (invoice.settings.repeatHeader !== undefined)
    //     settingsStore.setRepeatHeader(invoice.settings.repeatHeader);
    // }

    printingInvoice.value = invoice;
    printingFakerData.value = fakerData;
    console.log("printingFakerData.value", printingFakerData.value);

    // const handleAfterPrint = () => {
    //   printingInvoice.value = null;
    //   printingFakerData.value = null;
    //   isPrinting.value = false;
    //   window.removeEventListener("afterprint", handleAfterPrint);
    // };
    // window.addEventListener("afterprint", handleAfterPrint);

    // nextTick(() => {
    //   setTimeout(() => {
    //     _printReport();
    //   }, 500);
    // });
  });
}
</script>

<template>
  <div class="min-h-screen bg-[#1a1a2e] text-[#e0e0e0] font-sans pb-12">
    <!-- Hero / Header Section -->
    <div
      class="relative overflow-hidden bg-[#16213e] border-b border-[#0f3460] py-12 px-6 sm:px-12"
    >
      <!-- Background glows -->
      <div
        class="absolute top-[-50px] left-[10%] w-[300px] h-[300px] rounded-full bg-accent opacity-10 filter blur-[80px]"
      />
      <div
        class="absolute bottom-[-100px] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-500 opacity-10 filter blur-[100px]"
      />

      <div
        class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10"
      >
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span
              class="bg-[#00b4d8]/15 border border-[#00b4d8]/40 text-[#00b4d8] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
              >Meteor 3.0 Demo</span
            >
          </div>
          <h1
            class="text-4xl font-extrabold text-white tracking-tight leading-none mb-3"
          >
            Invoice Template Builder
          </h1>
          <p class="text-[#8892a4] text-base max-w-xl">
            Design professional, customized document templates with our
            drag-and-drop builder. Load dynamic fields and test printing
            instantly with server-side mock data.
          </p>
        </div>

        <div>
          <router-link
            :to="{ name: 'builder' }"
            class="inline-flex items-center gap-2 bg-[#00b4d8] hover:bg-[#0096c7] text-[#0a1628] font-bold px-6 py-3.5 rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Plus :size="18" />
            Create Template
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-6xl mx-auto px-6 sm:px-12 mt-10">
      <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <FileText :size="20" class="text-[#00b4d8]" />
        Your Templates ({{ invoices ? invoices.length : 0 }})
      </h2>

      <!-- Loading State -->
      <div
        v-if="!invoices"
        class="flex flex-col items-center justify-center py-20 bg-[#16213e]/40 border border-[#0f3460] rounded-xl"
      >
        <div
          class="w-10 h-10 border-4 border-[#00b4d8] border-t-transparent rounded-full animate-spin mb-4"
        />
        <p class="text-[#8892a4]">Loading templates...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="invoices.length === 0"
        class="flex flex-col items-center justify-center py-20 bg-[#16213e]/40 border border-[#0f3460] rounded-xl text-center px-6"
      >
        <div class="bg-[#00b4d8]/10 p-4 rounded-full text-[#00b4d8] mb-4">
          <FileText :size="32" />
        </div>
        <h3 class="text-lg font-bold text-white mb-2">No templates found</h3>
        <p class="text-[#8892a4] max-w-sm mb-6">
          You don't have any templates saved in the database yet. Create one or
          let startup seed populate the default.
        </p>
        <router-link
          :to="{ name: 'builder' }"
          class="inline-flex items-center gap-2 bg-[#16213e] hover:bg-[#1a2d4f] border border-[#0f3460] hover:border-[#00b4d8] text-white font-semibold px-5 py-2.5 rounded-lg transition-all"
        >
          <Plus :size="16" />
          Create First Template
        </router-link>
      </div>

      <!-- Templates Grid List -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="invoice in invoices"
          :key="invoice._id"
          class="bg-[#16213e] border border-[#0f3460] hover:border-[#00b4d8]/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:shadow-[#00b4d8]/5 transition-all duration-300 flex flex-col justify-between group"
        >
          <!-- Card Body -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <span
                class="bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              >
                {{ invoice.settings?.documentType || "Document" }}
              </span>
              <span class="text-xs text-[#8892a4] font-medium">
                {{ invoice.format || "A4" }} ({{
                  invoice.orientation || "portrait"
                }})
              </span>
            </div>

            <h3
              class="text-lg font-bold text-white group-hover:text-[#00b4d8] transition-colors mb-2 truncate"
              :title="invoice.name"
            >
              {{ invoice.name }}
            </h3>

            <p class="text-xs text-[#8892a4]">
              Blocks:
              <strong class="text-[#e0e0e0]">{{
                invoice.blocks ? invoice.blocks.length : 0
              }}</strong>
            </p>
            <p class="text-xs text-[#8892a4] mt-1">
              Updated:
              <span class="text-[#8892a4]/80">{{
                invoice.updatedAt
                  ? new Date(invoice.updatedAt).toLocaleDateString()
                  : "N/A"
              }}</span>
            </p>
          </div>

          <!-- Card Actions -->
          <div
            class="bg-[#10192e] px-6 py-4 border-t border-[#0f3460] flex items-center justify-between gap-2"
          >
            <div class="flex gap-2">
              <router-link
                :to="{ name: 'builder', params: { id: invoice._id } }"
                class="bg-[#16213e] hover:bg-[#1a2d4f] border border-[#0f3460] text-white p-2 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                title="Edit Layout Designer"
              >
                <Edit :size="14" class="text-[#00b4d8]" />
                Edit
              </router-link>

              <button
                @click="deleteTemplate(invoice._id, invoice.name)"
                class="bg-[#16213e]/50 hover:bg-red-500/10 border border-[#0f3460] hover:border-red-500/50 text-red-400 p-2 rounded-lg transition-colors inline-flex items-center"
                title="Delete Template"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <button
              @click="printTemplate(invoice)"
              :disabled="isPrinting"
              class="bg-[#00b4d8]/10 hover:bg-[#00b4d8] text-[#00b4d8] hover:text-[#0a1628] border border-[#00b4d8]/30 hover:border-[#00b4d8] px-3 py-2 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer :size="14" />
              {{
                isPrinting && printingInvoice?._id === invoice._id
                  ? "Preparing..."
                  : "Test Print"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="printingInvoice" class="only-print">
      <InvoiceRenderer
        :blocks="printingInvoice.blocks"
        :data="printingFakerData"
        :formatId="printingInvoice.format || 'A4'"
        :orientation="printingInvoice.orientation || 'portrait'"
        :globalFont="printingInvoice.settings?.globalFont"
        :globalFontSize="printingInvoice.settings?.globalFontSize"
        :layoutMode="printingInvoice.settings?.layoutMode"
        :repeatHeader="printingInvoice.settings?.repeatHeader"
        :repeatFooter="printingInvoice.settings?.repeatFooter"
        @ready="handleReadyPrint()"
      />
    </div>
  </Teleport>
</template>

<style>
/* Print sheet: render off-screen so the browser lays it out and
   ResizeObserver can measure actual table heights before print fires.
   On @media print it is repositioned to static/visible. */
.only-print {
  position: fixed;
  left: -99999px;
  top: 0;
  width: auto;
  height: auto;
  overflow: visible;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

@media print {
  /* Hide the entire app UI */
  #app {
    display: none !important;
  }

  /* Show only the teleported print sheet */
  .only-print {
    display: block !important;
    position: static !important;
    background: white !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .invoice-renderer-sheet {
    box-shadow: none !important;
    margin: 0 auto !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
}
</style>
