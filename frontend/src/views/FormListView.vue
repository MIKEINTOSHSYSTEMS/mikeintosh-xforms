<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listForms, type Form } from '../api/forms'
import { FilePlus, Pencil } from 'lucide-vue-next'
import {
  Button,
  Card,
  CardHeader,
  Link,
  StatusText,
  Table,
  TableCell,
  TableHeader,
  Tooltip,
} from '../components/ui'

const forms = ref<Form[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

async function loadForms() {
  loading.value = true
  error.value = null

  try {
    forms.value = await listForms()
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load forms. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(loadForms)
</script>

<template>
  <Card>
    <CardHeader title="Forms">
      <template #actions>
        <Link to="/forms/new" variant="button">Create form</Link>
      </template>
    </CardHeader>

    <StatusText v-if="loading">Loading forms…</StatusText>
    <div v-else-if="error">
      <StatusText variant="error">
        {{ error }}
        <Button variant="text" @click="loadForms" class="ml-3">Try again</Button>
      </StatusText>
    </div>
    <StatusText v-else-if="forms.length === 0">
      No forms available yet. Create one to get started.
    </StatusText>
    <Table v-else>
      <thead>
        <tr>
          <TableHeader>Name</TableHeader>
          <TableHeader>Version</TableHeader>
          <TableHeader>Description</TableHeader>
          <TableHeader>Updated</TableHeader>
          <TableHeader align="center">Actions</TableHeader>
        </tr>
      </thead>
      <tbody>
        <tr v-for="form in forms" :key="form.id">
          <TableCell label="Name">{{ form.name }}</TableCell>
          <TableCell label="Version">{{ form.version || '—' }}</TableCell>
          <TableCell label="Description">{{ form.description || '—' }}</TableCell>
          <TableCell label="Updated">
            {{ dateFormatter.format(new Date(form.updated_at)) }}
          </TableCell>
          <TableCell label="Actions" align="center">
            <div class="flex gap-2 justify-end items-center">
              <Tooltip text="Edit">
                <Link
                  :to="{ name: 'form-edit', params: { formId: form.id } }"
                  variant="primary"
                >
                  <Pencil class="mr-2" />
                </Link>
              </Tooltip>
              <Tooltip text="Submit data">
                <Link
                  :to="{ name: 'form-submit', params: { formId: form.id } }"
                  variant="primary"
                >
                  <FilePlus class="mr-2" />
                </Link>
              </Tooltip>
            </div>
          </TableCell>
        </tr>
      </tbody>
    </Table>
  </Card>
</template>

<style scoped>
/* Responsive table styles for mobile */
@media (max-width: 640px) {
  :deep(thead) {
    display: none;
  }

  :deep(tbody tr) {
    display: block;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1rem;
  }

  :deep(td) {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0.5rem !important;
    text-align: left !important;
  }

  :deep(td::before) {
    content: attr(data-label);
    font-weight: 600;
    margin-right: 1rem;
    color: #4b5563;
  }
}
</style>
