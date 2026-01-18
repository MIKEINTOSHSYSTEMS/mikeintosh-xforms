<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

type LinkVariant = 'primary' | 'button' | 'text'

withDefaults(
  defineProps<{
    to: RouteLocationRaw
    variant?: LinkVariant
  }>(),
  {
    variant: 'text',
  },
)
</script>

<template>
  <RouterLink
    :to="to"
    :class="[
      'inline-flex items-center justify-center font-medium transition-colors',
      {
        'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 no-underline':
          variant === 'button',
        'text-blue-600 hover:underline no-underline': variant === 'text',
        'text-blue-600 font-medium hover:underline no-underline': variant === 'primary',
      },
    ]"
  >
    <slot />
  </RouterLink>
</template>
