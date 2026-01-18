<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  text: string
}>()

const isVisible = ref(false)
</script>

<template>
  <div class="relative inline-block">
    <div @mouseenter="isVisible = true" @mouseleave="isVisible = false">
      <slot />
    </div>
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none bottom-full left-1/2 transform -translate-x-1/2 mb-1"
      >
        {{ text }}
        <div
          class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
        />
      </div>
    </Transition>
  </div>
</template>
