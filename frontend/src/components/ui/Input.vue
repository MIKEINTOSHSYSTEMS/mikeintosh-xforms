<script setup lang="ts">
type InputType = 'text' | 'email' | 'password' | 'number' | 'url'

withDefaults(
  defineProps<{
    modelValue: string
    type?: InputType
    required?: boolean
    placeholder?: string
  }>(),
  {
    type: 'text',
    required: false,
  },
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :required="required"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    class="border border-gray-300 rounded-lg px-3.5 py-2.5 text-base text-gray-900 bg-white w-full
           focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15
           transition-all"
  />
</template>
