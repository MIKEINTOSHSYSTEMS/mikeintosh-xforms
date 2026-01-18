<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

type SnackbarVariant = 'success' | 'error' | 'info' | 'warning'

const props = withDefaults(
  defineProps<{
    message: string
    variant?: SnackbarVariant
    duration?: number
    show: boolean
  }>(),
  {
    variant: 'info',
    duration: 3000,
  },
)

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)
let timeoutId: number | null = null

function close() {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 300) // Wait for animation to complete
}

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      visible.value = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (props.duration > 0) {
        timeoutId = setTimeout(close, props.duration) as unknown as number
      }
    } else {
      visible.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.show && props.duration > 0) {
    timeoutId = setTimeout(close, props.duration) as unknown as number
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="visible"
      :class="[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'px-6 py-3 rounded-lg shadow-lg',
        'flex items-center gap-3',
        'min-w-[300px] max-w-md',
        {
          'bg-green-600 text-white': variant === 'success',
          'bg-red-600 text-white': variant === 'error',
          'bg-blue-600 text-white': variant === 'info',
          'bg-yellow-600 text-white': variant === 'warning',
        },
      ]"
      role="alert"
    >
      <div class="flex-1 text-sm font-medium">
        {{ message }}
      </div>
      <button
        @click="close"
        class="flex-shrink-0 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
        aria-label="Close"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>
