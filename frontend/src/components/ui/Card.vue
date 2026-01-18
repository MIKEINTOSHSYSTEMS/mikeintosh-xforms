<script setup lang="ts">
defineProps<{
  noPadding?: boolean
}>()
</script>

<template>
  <section
    :class="[
      'bg-white rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]',
      noPadding ? '' : 'p-8',
    ]"
  >
    <slot />
  </section>
</template>
