<script setup lang="ts">
import { OdkWebForm } from '@getodk/web-forms'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteForm, getForm, updateForm, type Form, type FormSubmission } from '../api/forms'
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Snackbar,
  StatusText,
  Table,
  TableCell,
  TableHeader,
  Textarea,
  Tooltip
} from '../components/ui'
import { Eye } from 'lucide-vue-next'

const props = defineProps<{
  formId: string
}>()

const router = useRouter()

const formData = reactive({
  name: '',
  description: '',
})

const xlsFile = ref<File | null>(null)
const currentForm = ref<Form | null>(null)
const loading = ref(true)
const submitting = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)
const showSuccessSnackbar = ref(false)
const showDeleteModal = ref(false)
const showPreviewModal = ref(false)
const previewSubmission = ref<FormSubmission | null>(null)

async function loadForm() {
  loading.value = true
  error.value = null

  try {
    currentForm.value = await getForm(Number(props.formId))
    formData.name = currentForm.value.name
    formData.description = currentForm.value.description || ''
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load form. Please try again.'
  } finally {
    loading.value = false
  }
}

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

  submitting.value = true

  try {
    await updateForm(Number(props.formId), {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      xls_file: xlsFile.value || undefined,
    })

    showSuccessSnackbar.value = true
    // Reload form data to reflect changes
    await loadForm()
    xlsFile.value = null
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to update the form. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  error.value = null

  try {
    await deleteForm(Number(props.formId))
    showDeleteModal.value = false
    // Navigate to form list after successful deletion
    router.push({ name: 'form-list' })
  } catch (err) {
    showDeleteModal.value = false
    error.value =
      err instanceof Error ? err.message : 'Failed to delete the form. Please try again.'
  } finally {
    deleting.value = false
  }
}

function openPreview(submission: FormSubmission) {
  previewSubmission.value = submission
  showPreviewModal.value = true
  // log the xml of the submission
  console.log(submission.xml_submission)
}

function closePreview() {
  showPreviewModal.value = false
  previewSubmission.value = null
}

const fetchFormAttachment = async () => new Response('', { status: 404 })

onMounted(loadForm)
</script>

<template>
  <Card>
    <div v-if="loading">
      <StatusText>Loading form…</StatusText>
    </div>
    <div v-else-if="error && !currentForm">
      <StatusText variant="error">{{ error }}</StatusText>
      <Button variant="text" @click="loadForm" class="mt-3">Try again</Button>
    </div>
    <div v-else>
      <h1 class="text-3xl font-semibold text-gray-900 mb-3">Edit form</h1>

      <p class="text-gray-600 mb-7">
        Update the form details or upload a new XLSForm file (.xlsx or .xls) to update the
        form definition. Uploading a new file will replace the current form definition.
      </p>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <FormField label="Form name" required>
          <Input v-model="formData.name" required />
        </FormField>

        <FormField label="Description">
          <Textarea v-model="formData.description" :rows="3" />
        </FormField>

        <FormField label="Current XLSForm file">
          <p class="text-sm text-gray-600">
            <template v-if="currentForm?.xls_form">
              {{ currentForm.xls_form.split('/').pop() }}
            </template>
            <template v-else> No file uploaded </template>
          </p>
        </FormField>

        <FormField label="Upload new XLSForm file (optional)">
          <input
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileChange"
            class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p v-if="xlsFile" class="mt-2 text-sm text-gray-600">
            Selected: {{ xlsFile.name }} ({{ (xlsFile.size / 1024).toFixed(1) }} KB)
          </p>
        </FormField>

        <StatusText v-if="error" variant="error">{{ error }}</StatusText>

        <div v-if="currentForm?.submissions && currentForm.submissions.length > 0" class="mt-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Recent Submissions</h2>
          <p class="text-sm text-gray-600 mb-4">
            Showing the 10 most recent submissions for this form.
          </p>
          <Table>
            <thead>
              <tr>
                <TableHeader>Submission ID</TableHeader>
                <TableHeader>Submitted By</TableHeader>
                <TableHeader>Submitted At</TableHeader>
                <TableHeader align="center">Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              <tr v-for="submission in currentForm.submissions" :key="submission.submission_id">
                <TableCell label="Submission ID">{{ submission.submission_id }}</TableCell>
                <TableCell label="Submitted By">
                  <template v-if="submission.username">
                    {{ submission.username }}
                  </template>
                  <span v-else class="italic text-gray-400">Anonymous</span>
                </TableCell>
                <TableCell label="Submitted At">
                  {{ new Date(submission.submitted_at).toLocaleString() }}
                </TableCell>
                <TableCell label="Actions" align="center">
                <div class="flex gap-2 items-center justify-center">
                  <Tooltip text="Preview">
                      <div class="cursor-pointer text-blue-600 hover:text-blue-800">
                        <Eye class="mr-2" @click="openPreview(submission)" />
                      </div>
                  </Tooltip>
                  </div>
                </TableCell>
              </tr>
            </tbody>
          </Table>
        </div>
        <div v-else-if="currentForm?.submissions && currentForm.submissions.length === 0" class="mt-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Submissions</h2>
          <p class="text-sm text-gray-600">No submissions yet for this form.</p>
        </div>

        <div class="flex gap-3 justify-between mt-8">
          <Button type="button" variant="danger" @click="showDeleteModal = true">
            Delete form
          </Button>
          <div class="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              @click="router.push({ name: 'form-list' })"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="submitting">
              {{ submitting ? 'Saving…' : 'Save changes' }}
            </Button>
          </div>
        </div>
      </form>
    </div>
  </Card>

  <Modal
    :show="showDeleteModal"
    title="Delete form"
    confirm-text="Delete"
    cancel-text="Cancel"
    confirm-variant="danger"
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
    @close="showDeleteModal = false"
  >
    <p>
      Are you sure you want to delete the form
      <strong>{{ currentForm?.name }}</strong
      >?
    </p>
    <p class="mt-2 text-sm text-gray-600">
      This action cannot be undone. All submissions associated with this form will also be
      deleted.
    </p>
  </Modal>

  <Snackbar
    :show="showSuccessSnackbar"
    message="Successfully updated form"
    variant="success"
    @close="showSuccessSnackbar = false"
  />

  <Modal
    :show="showPreviewModal"
    :title="`Preview Submission ${previewSubmission?.submission_id}`"
    @close="closePreview"
    size="large"
  >
    <div v-if="previewSubmission && currentForm" class="max-h-[70vh] overflow-y-auto">
      <OdkWebForm
        :form-xml="currentForm.xml_definition"
        :edit-instance="{
          resolveInstance: () => previewSubmission!.xml_submission,
          attachmentFileNames: [],
          resolveAttachment: () => {
            throw new Error('Attachments not supported yet')
          },
        }"
        :fetch-form-attachment="fetchFormAttachment"
      />
    </div>
    <template #footer>
      <div class="flex justify-end">
        <Button variant="secondary" @click="closePreview">Close</Button>
      </div>
    </template>
  </Modal>
</template>


<style scoped>
/* hide send button */
.odk-form .footer {
  display: none !important;
}
</style>
