export interface FormSubmission {
  submission_id: number
  form_id: number
  submitted_at: string
  username: string | null
  xml_submission: string
}

export interface Form {
  id: number
  name: string
  description: string
  xls_form: string | null
  version: string
  xml_definition: string
  created_at: string
  updated_at: string
  submissions?: FormSubmission[]
}

export interface CreateFormPayload {
  name: string
  xls_file: File
  description?: string
}

export interface UpdateFormPayload {
  name?: string | null
  description?: string | null
  xls_file?: File | null
}

export interface FormSubmissionResponse {
  submission_id: number
  form_id: number
  submitted_at: string
  username: string | null
  xml_submission: string
}

const API_BASE = '/api/forms'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = await response.json()
      if (typeof payload?.detail === 'string' && payload.detail) {
        message = payload.detail
      }
    } catch {
      const text = (await response.text()).trim()
      if (text) {
        message = text
      }
    }
    throw new Error(message)
  }

  const text = (await response.text()).trim()

  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(text)
  }
}

export async function listForms(): Promise<Form[]> {
  const response = await fetch(`${API_BASE}/`)
  return handleResponse<Form[]>(response)
}

export async function createForm(payload: CreateFormPayload): Promise<Form> {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('xls_file', payload.xls_file)
  
  if (payload.description) {
    formData.append('description', payload.description)
  }

  const response = await fetch(`${API_BASE}/`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse<Form>(response)
}

export async function getForm(formId: number): Promise<Form> {
  const response = await fetch(`${API_BASE}/${formId}/`)
  return handleResponse<Form>(response)
}

export async function submitForm(
  formId: number,
  xmlPayload: string,
): Promise<FormSubmissionResponse> {
  const response = await fetch(`${API_BASE}/${formId}/submissions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
    body: xmlPayload,
  })

  return handleResponse<FormSubmissionResponse>(response)
}

export async function updateForm(
  formId: number,
  payload: UpdateFormPayload,
): Promise<Form> {
  // If an XLS file is provided, send multipart/form-data so the backend can process files.
  if (payload.xls_file) {
    const formData = new FormData()
    if (payload.name !== undefined && payload.name !== null) {
      formData.append('name', payload.name)
    }
    if (payload.description !== undefined && payload.description !== null) {
      formData.append('description', payload.description)
    }
    formData.append('xls_file', payload.xls_file)

    const response = await fetch(`${API_BASE}/${formId}/`, {
      method: 'PATCH',
      body: formData,
    })
    return handleResponse<Form>(response)
  }

  // Otherwise, send JSON partial update.
  const jsonBody: Record<string, string> = {}
  if (payload.name !== undefined && payload.name !== null) {
    jsonBody.name = payload.name
  }
  if (payload.description !== undefined && payload.description !== null) {
    jsonBody.description = payload.description
  }

  const response = await fetch(`${API_BASE}/${formId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  })

  return handleResponse<Form>(response)
}

export async function deleteForm(formId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${formId}/`, {
    method: 'DELETE',
  })
  return handleResponse<void>(response)
}
