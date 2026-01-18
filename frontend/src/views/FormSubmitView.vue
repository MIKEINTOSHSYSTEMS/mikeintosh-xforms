<script setup lang="ts">
import { OdkWebForm, POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms'
import { computed, onMounted, ref, watch } from 'vue'
import { getForm, submitForm, type Form } from '../api/forms'
import { Card, Link, StatusText } from '../components/ui'
import { Snackbar } from '../components/ui' // added
import { useRouter } from 'vue-router' // added

const router = useRouter() // added
const showSuccessSnackbar = ref(false) // added

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error'

const props = defineProps<{ formId: string | number }>()

const form = ref<Form | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const submissionState = ref<SubmissionStatus>('idle')
const submissionFeedback = ref<string | null>(null)
const lastSubmissionId = ref<number | null>(null)

const numericFormId = computed(() => {
  const parsed = Number(props.formId)
  return Number.isFinite(parsed) ? parsed : NaN
})

async function loadForm() {
  loading.value = true
  submissionState.value = 'idle'
  submissionFeedback.value = null
  lastSubmissionId.value = null

  const id = numericFormId.value

  if (!Number.isInteger(id)) {
    error.value = 'Invalid form identifier.'
    form.value = null
    loading.value = false
    return
  }

  error.value = null

  try {
    form.value = await getForm(id)
  } catch (err) {
    form.value = null
    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to load the form details. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(loadForm)

watch(() => props.formId, loadForm)

const fetchFormAttachment = async () => new Response('', { status: 404 })

type SubmissionPayload = {
  status: 'pending' | 'ready'
  data: readonly [FormData]
}

const XML_FILE_FIELD = 'xml_submission_file'

const handleSubmit = async (
  payload: SubmissionPayload,
  callback?: (result?: unknown) => void,
) => {
  submissionState.value = 'submitting'
  submissionFeedback.value = null
  lastSubmissionId.value = null

  try {
    if (payload.status !== 'ready') {
      throw new Error('Submission payload is not ready.')
    }

    const [instanceData] = payload.data
    const xmlFile = instanceData.get(XML_FILE_FIELD)

    if (!(xmlFile instanceof File)) {
      throw new Error('Submission payload missing XML file.')
    }

    const xmlBody = await xmlFile.text()
    const response = await submitForm(numericFormId.value, xmlBody)

    submissionState.value = 'success'
    lastSubmissionId.value = response.submission_id
    submissionFeedback.value = `Submission stored with ID ${response.submission_id}.`
    showSuccessSnackbar.value = true // added
    setTimeout(() => {
      router.push({ name: 'form-list' })
    }, 1000) // added
    callback?.({ next: POST_SUBMIT__NEW_INSTANCE })
  } catch (err) {
    submissionState.value = 'error'
    submissionFeedback.value =
      err instanceof Error ? err.message : 'Failed to submit the form.'
    console.error('Failed to submit form payload', err)
    callback?.()
  }
}
</script>

<template>
  <Card>
    <header class="flex justify-between items-start gap-6 mb-6">
      <div>
        <Link to="/forms" variant="text">← Back to forms</Link>
        <h1 class="text-3xl font-semibold text-gray-900 mt-2" v-if="form">
          Submit data for {{ form.name }}
        </h1>
        <h1 class="text-3xl font-semibold text-gray-900 mt-2" v-else>Submit form</h1>
      </div>
      <div v-if="form" class="flex flex-col gap-1 text-gray-600">
        <p v-if="form.version"><strong>Version:</strong> {{ form.version }}</p>
        <p v-if="form.description"><strong>Description:</strong> {{ form.description }}</p>
      </div>
    </header>

    <StatusText v-if="loading">Loading form definition…</StatusText>
    <StatusText v-else-if="error" variant="error">{{ error }}</StatusText>

    <template v-else-if="form">
      <OdkWebForm
        :form-xml="form.xml_definition"
        :fetch-form-attachment="fetchFormAttachment"
        @submit="handleSubmit"
      />

      <StatusText v-if="submissionState === 'submitting'" class="mt-4">
        Sending submission…
      </StatusText>
      <StatusText v-if="lastSubmissionId" variant="muted" class="mt-2">
        Last submission ID: {{ lastSubmissionId }}
      </StatusText>
    </template>
  </Card>

  <Snackbar
    :show="showSuccessSnackbar"
    :message="submissionFeedback || 'Submission stored.'"
    variant="success"
    @close="showSuccessSnackbar = false"
  />
</template>

<style scoped>
/* Responsive header layout for mobile */
@media (max-width: 768px) {
  header {
    flex-direction: column;
  }
}
</style>
