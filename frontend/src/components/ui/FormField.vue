<script setup lang="ts">
defineProps<{
  label: string
  required?: boolean
}>()
</script>

<template>
  <label class="flex flex-col gap-2">
    <span class="font-semibold text-gray-900">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </span>
    <slot />
  </label>
</template>
