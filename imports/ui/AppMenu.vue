<script setup>
import { Home, Sliders } from '@lucide/vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav class="flex items-center gap-2 bg-[#151b24]/60 border border-[#1f2833]/80 p-2.5 rounded-2xl backdrop-blur-md max-w-max mb-6">
    <router-link
      :to="{ name: 'home' }"
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 relative group"
      :class="
        route.name === 'home'
          ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20 shadow-[0_4px_12px_rgba(0,180,216,0.05)]'
          : 'text-[#8892a4] hover:text-white hover:bg-[#1f2833]/30 border border-transparent'
      "
    >
      <Home :size="16" class="transition-transform group-hover:scale-110" />
      Home
    </router-link>
    <router-link
      :to="{ name: 'config' }"
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 relative group"
      :class="
        route.name === 'config'
          ? 'bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20 shadow-[0_4px_12px_rgba(0,180,216,0.05)]'
          : 'text-[#8892a4] hover:text-white hover:bg-[#1f2833]/30 border border-transparent'
      "
    >
      <Sliders :size="16" class="transition-transform group-hover:rotate-45" />
      Config
    </router-link>
  </nav>
</template>

