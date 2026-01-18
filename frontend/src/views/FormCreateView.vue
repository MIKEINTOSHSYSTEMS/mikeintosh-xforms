<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createForm } from '../api/forms'
import { Button, Card, FormField, Input, Snackbar, StatusText, Textarea } from '../components/ui'

const router = useRouter()

const formData = reactive({
  name: '',
  description: '',
})

const xlsFile = ref<File | null>(null)
const submitting = ref(false)
const error = ref<string | null>(null)
const showSuccessSnackbar = ref(false)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    xlsFile.value = target.files[0]
    error.value = null
  }
}

async function handleSubmit() {
  error.value = null

  if (!formData.name.trim()) {
    error.value = 'Please provide a name for the form.'
    return
  }

  if (!xlsFile.value) {
    error.value = 'Please select an XLSForm file (.xlsx or .xls).'
    return
  }

  submitting.value = true

  try {
    await createForm({
      name: formData.name.trim(),
      xls_file: xlsFile.value,
      description: formData.description.trim() || undefined,
    })

    showSuccessSnackbar.value = true
    // Delay navigation to allow snackbar to be visible
    setTimeout(() => {
      router.push({ name: 'form-list' })
    }, 1000)
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to create the form. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Card>
    <h1 class="text-3xl font-semibold text-gray-900 mb-3">Create a new form</h1>

    <p class="text-gray-600 mb-7">
      Upload an XLSForm file (.xlsx or .xls) to create a new form. The file will be
      automatically converted to XForm format. After saving, you'll be able to submit data
      for the new form immediately.
    </p>

    <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
      <FormField label="Form name" required>
        <Input v-model="formData.name" required />
      </FormField>

      <FormField label="Description">
        <Textarea v-model="formData.description" :rows="3" />
      </FormField>

      <FormField label="XLSForm file" required>
        <input
          type="file"
          accept=".xlsx,.xls"
          required
          @change="handleFileChange"
          class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p v-if="xlsFile" class="mt-2 text-sm text-gray-600">
          Selected: {{ xlsFile.name }} ({{ (xlsFile.size / 1024).toFixed(1) }} KB)
        </p>
      </FormField>

      <StatusText v-if="error" variant="error">{{ error }}</StatusText>

      <Button type="submit" :disabled="submitting">
        {{ submitting ? 'Creating…' : 'Create form' }}
      </Button>
    </form>
  </Card>

  <Snackbar
    :show="showSuccessSnackbar"
    message="Successfully created form"
    variant="success"
    @close="showSuccessSnackbar = false"
  />
</template>

<!-- No scoped styles needed - using Tailwind utilities -->

