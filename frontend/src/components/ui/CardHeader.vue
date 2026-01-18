<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <header class="flex items-center justify-between gap-4 mb-6">
    <h1 class="text-3xl font-semibold text-gray-900">{{ title }}</h1>
    <slot name="actions" />
  </header>
</template>
