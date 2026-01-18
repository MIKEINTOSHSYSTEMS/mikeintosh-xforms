import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listForms,
  createForm,
  getForm,
  submitForm,
  updateForm,
  deleteForm,
  type Form,
  type CreateFormPayload,
  type UpdateFormPayload,
} from './forms'

// Mock fetch globally
global.fetch = vi.fn()

function createMockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response
}

describe('forms API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listForms', () => {
    it('should fetch and return a list of forms', async () => {
      const mockForms: Form[] = [
        {
          id: 1,
          name: 'Test Form',
          description: 'A test form',
          xls_form: '/media/xlsforms/test.xlsx',
          version: '1.0',
          xml_definition: '<form></form>',
          created_at: '2025-10-01T00:00:00Z',
          updated_at: '2025-10-01T00:00:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockForms))

      const result = await listForms()

      expect(fetch).toHaveBeenCalledWith('/api/forms/')
      expect(result).toEqual(mockForms)
    })

    it('should handle empty response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse([]))

      const result = await listForms()

      expect(result).toEqual([])
    })

    it('should throw error on failed request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createMockResponse({ detail: 'Server error' }, 500)
      )

      await expect(listForms()).rejects.toThrow('Server error')
    })
  })

  describe('getForm', () => {
    it('should fetch a single form by ID', async () => {
      const mockForm: Form = {
        id: 1,
        name: 'Test Form',
        description: 'A test form',
        xls_form: '/media/xlsforms/test.xlsx',
        version: '1.0',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockForm))

      const result = await getForm(1)

      expect(fetch).toHaveBeenCalledWith('/api/forms/1/')
      expect(result).toEqual(mockForm)
    })

    it('should handle 404 errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createMockResponse({ detail: 'Form not found' }, 404)
      )

      await expect(getForm(999)).rejects.toThrow('Form not found')
    })
  })

  describe('createForm', () => {
    it('should create a form with all fields', async () => {
      const mockFile = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const payload: CreateFormPayload = {
        name: 'New Form',
        xls_file: mockFile,
        description: 'Test description',
      }

      const mockResponse: Form = {
        id: 1,
        name: 'New Form',
        description: 'Test description',
        xls_form: '/media/xlsforms/test.xlsx',
        version: '1.0',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await createForm(payload)

      expect(fetch).toHaveBeenCalledWith('/api/forms/', {
        method: 'POST',
        body: expect.any(FormData),
      })

      const [[, options]] = vi.mocked(fetch).mock.calls
      const formData = options?.body as FormData
      expect(formData.get('name')).toBe('New Form')
      expect(formData.get('description')).toBe('Test description')
      expect(formData.get('xls_file')).toBe(mockFile)

      expect(result).toEqual(mockResponse)
    })

    it('should create a form without description', async () => {
      const mockFile = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const payload: CreateFormPayload = {
        name: 'New Form',
        xls_file: mockFile,
      }

      const mockResponse: Form = {
        id: 1,
        name: 'New Form',
        description: '',
        xls_form: '/media/xlsforms/test.xlsx',
        version: '1.0',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse))

      await createForm(payload)

      const [[, options]] = vi.mocked(fetch).mock.calls
      const formData = options?.body as FormData
      expect(formData.get('description')).toBeNull()
    })
  })

  describe('updateForm', () => {
    it('should update form with XLS file', async () => {
      const mockFile = new File(['content'], 'updated.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const payload: UpdateFormPayload = {
        name: 'Updated Form',
        description: 'Updated description',
        xls_file: mockFile,
      }

      const mockResponse: Form = {
        id: 1,
        name: 'Updated Form',
        description: 'Updated description',
        xls_form: '/media/xlsforms/updated.xlsx',
        version: '1.1',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-02T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await updateForm(1, payload)

      expect(fetch).toHaveBeenCalledWith('/api/forms/1/', {
        method: 'PATCH',
        body: expect.any(FormData),
      })

      expect(result).toEqual(mockResponse)
    })

    it('should update form without XLS file (JSON)', async () => {
      const payload: UpdateFormPayload = {
        name: 'Updated Form',
        description: 'Updated description',
      }

      const mockResponse: Form = {
        id: 1,
        name: 'Updated Form',
        description: 'Updated description',
        xls_form: '/media/xlsforms/test.xlsx',
        version: '1.0',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-02T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await updateForm(1, payload)

      expect(fetch).toHaveBeenCalledWith('/api/forms/1/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Form',
          description: 'Updated description',
        }),
      })

      expect(result).toEqual(mockResponse)
    })

    it('should update only name', async () => {
      const payload: UpdateFormPayload = {
        name: 'Updated Name Only',
      }

      const mockResponse: Form = {
        id: 1,
        name: 'Updated Name Only',
        description: 'Original description',
        xls_form: '/media/xlsforms/test.xlsx',
        version: '1.0',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T00:00:00Z',
        updated_at: '2025-10-02T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse))

      await updateForm(1, payload)

      const [[, options]] = vi.mocked(fetch).mock.calls
      expect(JSON.parse(options?.body as string)).toEqual({
        name: 'Updated Name Only',
      })
    })
  })

  describe('deleteForm', () => {
    it('should delete a form', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      } as Response)

      await deleteForm(1)

      expect(fetch).toHaveBeenCalledWith('/api/forms/1/', {
        method: 'DELETE',
      })
    })

    it('should handle delete errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createMockResponse({ detail: 'Cannot delete form' }, 400)
      )

      await expect(deleteForm(1)).rejects.toThrow('Cannot delete form')
    })
  })

  describe('submitForm', () => {
    it('should submit form data as XML', async () => {
      const xmlPayload = '<data><field>value</field></data>'

      const mockResponse = {
        submission_id: 123,
        form_id: 1,
        submitted_at: '2025-10-01T12:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await submitForm(1, xmlPayload)

      expect(fetch).toHaveBeenCalledWith('/api/forms/1/submissions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: xmlPayload,
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle submission errors', async () => {
      const xmlPayload = '<data><field>value</field></data>'

      vi.mocked(fetch).mockResolvedValueOnce(
        createMockResponse({ detail: 'Invalid XML' }, 400)
      )

      await expect(submitForm(1, xmlPayload)).rejects.toThrow('Invalid XML')
    })
  })
})
