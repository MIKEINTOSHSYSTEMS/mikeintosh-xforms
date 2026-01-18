<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger'
type ButtonType = 'button' | 'submit' | 'reset'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    type?: ButtonType
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      {
        'bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-progress':
          variant === 'primary',
        'bg-gray-200 text-gray-900 px-4 py-2 hover:bg-gray-300 focus:ring-gray-500 disabled:opacity-50':
          variant === 'secondary',
        'bg-transparent text-blue-600 px-0 py-0 hover:underline focus:ring-blue-500 disabled:opacity-50':
          variant === 'text',
        'bg-red-600 text-white px-4 py-2 hover:bg-red-700 focus:ring-red-500 disabled:opacity-75 disabled:cursor-progress':
          variant === 'danger',
      },
    ]"
  >
    <slot />
  </button>
</template>
