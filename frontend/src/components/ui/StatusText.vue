<script setup lang="ts">
type StatusVariant = 'default' | 'error' | 'success' | 'muted'

withDefaults(
  defineProps<{
    variant?: StatusVariant
  }>(),
  {
    variant: 'default',
  },
)
</script>

<template>
  <p
    :class="[
      'text-base',
      {
        'text-gray-600': variant === 'default',
        'text-red-700 font-medium': variant === 'error',
        'text-green-700': variant === 'success',
        'text-gray-500': variant === 'muted',
      },
    ]"
  >
    <slot />
  </p>
</template>
