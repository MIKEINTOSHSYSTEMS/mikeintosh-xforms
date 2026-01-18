<script setup lang="ts">
defineProps<{
  label?: string
  align?: 'left' | 'center' | 'right'
}>()
</script>

<template>
  <td
    :data-label="label"
    :class="[
      'px-4 py-3 text-gray-900 text-base border-b border-gray-200',
      {
        'text-left': align === 'left' || !align,
        'text-center': align === 'center',
        'text-right': align === 'right',
      },
    ]"
  >
    <slot />
  </td>
</template>
