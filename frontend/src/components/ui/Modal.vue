<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import Button from './Button.vue'

interface Props {
  show: boolean
  title: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
  size?: 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  loading: false,
  size: 'default',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const modalWidthClass = computed(() => {
  return props.size === 'large' ? 'max-w-4xl' : 'max-w-md'
})

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.show) {
    emit('cancel')
    emit('close')
  }
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="
          () => {
            emit('cancel')
            emit('close')
          }
        "
      >
        <div
          :class="['bg-white rounded-lg shadow-xl w-full overflow-hidden', modalWidthClass]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title"
        >
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ title }}</h2>
            <div class="text-gray-700 mb-6">
              <slot />
            </div>
            <div v-if="$slots.footer">
              <slot name="footer" />
            </div>
            <div v-else class="flex gap-3 justify-end">
              <Button variant="secondary" @click="emit('cancel')" :disabled="loading">
                {{ cancelText }}
              </Button>
              <Button
                :variant="confirmVariant"
                @click="emit('confirm')"
                :disabled="loading"
              >
                {{ loading ? 'Processing…' : confirmText }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.2s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
