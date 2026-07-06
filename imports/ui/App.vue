<script setup>
import { useRoute } from 'vue-router'
import AppMenu from './AppMenu.vue'

const route = useRoute()
</script>

<template>
  <div :class="route.name === 'builder' ? 'w-full h-full' : 'p-8 min-h-screen bg-[#1a1a2e] text-[#e0e0e0] print-hidden'">
    <AppMenu v-if="route.name !== 'builder'" class="mb-4" />
    <router-view />
  </div>
</template>
