<script setup lang="ts">
defineProps<{
  align?: 'left' | 'center' | 'right'
}>()
</script>

<template>
  <th
    :class="[
      'px-4 py-3 font-semibold text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200',
      {
        'text-left': align === 'left' || !align,
        'text-center': align === 'center',
        'text-right': align === 'right',
      },
    ]"
  >
    <slot />
  </th>
</template>
