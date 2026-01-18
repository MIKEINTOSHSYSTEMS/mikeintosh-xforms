<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    rows?: number
    required?: boolean
    placeholder?: string
  }>(),
  {
    rows: 3,
    required: false,
  },
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <textarea
    :value="modelValue"
    :rows="rows"
    :required="required"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    class="border border-gray-300 rounded-lg px-3.5 py-2.5 text-base text-gray-900 bg-white w-full
           resize-y min-h-32
           focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15
           transition-all"
  />
</template>
