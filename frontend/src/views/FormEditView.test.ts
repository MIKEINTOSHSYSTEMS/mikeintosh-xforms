import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormEditView from './FormEditView.vue'
import * as formsApi from '../api/forms'
import type { Form } from '../api/forms'

// Vitest executes tests as ES modules, where `__dirname` is undefined, and @getodk/web-forms depends on it. Mocking to avoid the crash.
vi.mock('@getodk/web-forms', () => ({
  OdkWebForm: {
    name: 'OdkWebForm',
    template: '<div />',
  },
}))

// Mock the forms API
vi.mock('../api/forms', () => ({
  getForm: vi.fn(),
  updateForm: vi.fn(),
  deleteForm: vi.fn(),
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  }
})

const mockForm: Form = {
  id: 1,
  name: 'Test Form',
  description: 'Test description',
  xls_form: '/media/xlsforms/test.xlsx',
  version: '1.0',
  xml_definition: '<form></form>',
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-02T15:30:00Z',
}

describe('FormEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays form data', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Edit form')
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Test Form')
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Test description')
    expect(wrapper.text()).toContain('test.xlsx')
  })

  it('displays loading state initially', () => {
    vi.mocked(formsApi.getForm).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    expect(wrapper.text()).toContain('Loading form')
  })

  it('displays error when form loading fails', async () => {
    vi.mocked(formsApi.getForm).mockRejectedValue(new Error('Form not found'))

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Form not found')
    expect(wrapper.text()).toContain('Try again')
  })

  it('shows validation error when name is empty', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    // Clear the name
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Please provide a name for the form')
  })

  it('successfully updates form with only text fields', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const updatedForm: Form = {
      ...mockForm,
      name: 'Updated Form',
      description: 'Updated description',
    }
    vi.mocked(formsApi.updateForm).mockResolvedValue(updatedForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    // Update fields
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('Updated Form')

    const descriptionTextarea = wrapper.find('textarea')
    await descriptionTextarea.setValue('Updated description')

    // Submit
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(formsApi.updateForm).toHaveBeenCalledWith(1, {
      name: 'Updated Form',
      description: 'Updated description',
      xls_file: undefined,
    })

    expect(wrapper.text()).toContain('Successfully updated form')
  })

  it('successfully updates form with new XLS file', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const updatedForm: Form = {
      ...mockForm,
      xls_form: '/media/xlsforms/updated.xlsx',
    }
    vi.mocked(formsApi.updateForm).mockResolvedValue(updatedForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    // Upload new file
    const file = new File(['content'], 'updated.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')
    await flushPromises()

    // Check file is shown
    expect(wrapper.text()).toContain('updated.xlsx')

    // Submit
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(formsApi.updateForm).toHaveBeenCalledWith(1, {
      name: 'Test Form',
      description: 'Test description',
      xls_file: file,
    })

    expect(wrapper.text()).toContain('Successfully updated form')
  })

  it('displays error when update fails', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)
    vi.mocked(formsApi.updateForm).mockRejectedValue(new Error('Update failed'))

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    // Submit
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Update failed')
  })

  it('opens delete modal when delete button is clicked', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    // Find and click delete button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete form'))
    expect(deleteButton).toBeTruthy()

    await deleteButton!.trigger('click')
    await flushPromises()

    // Modal should be visible
    expect(wrapper.text()).toContain('Are you sure you want to delete the form')
    expect(wrapper.text()).toContain('Test Form')
  })

  it('successfully deletes form', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)
    vi.mocked(formsApi.deleteForm).mockResolvedValue(undefined)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    // Open delete modal
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete form'))
    await deleteButton!.trigger('click')
    await flushPromises()

    // Confirm deletion - find button by variant/confirm action
    const allButtons = wrapper.findAll('button')
    const confirmButton = allButtons.find((btn) => {
      const text = btn.text()
      return text.includes('Delete') && !text.includes('Delete form')
    })
    
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(formsApi.deleteForm).toHaveBeenCalledWith(1)
    expect(mockPush).toHaveBeenCalledWith({ name: 'form-list' })
  })

  it('displays error when deletion fails', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)
    vi.mocked(formsApi.deleteForm).mockRejectedValue(new Error('Cannot delete'))

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    // Open delete modal
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete form'))
    await deleteButton!.trigger('click')
    await flushPromises()

    // Confirm deletion
    const allButtons = wrapper.findAll('button')
    const confirmButton = allButtons.find((btn) => {
      const text = btn.text()
      return text.includes('Delete') && !text.includes('Delete form')
    })
    
    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Cannot delete')
  })

  it('resets file input after successful update', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const updatedForm: Form = {
      ...mockForm,
      xls_form: '/media/xlsforms/updated.xlsx',
    }
    vi.mocked(formsApi.updateForm).mockResolvedValue(updatedForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    // Upload file
    const file = new File(['content'], 'updated.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    // Submit
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // File input should be reset
    expect(inputElement.value).toBe('')
  })

  it('displays current XLS file name or "No file uploaded"', async () => {
    const formWithoutFile: Form = {
      ...mockForm,
      xls_form: null,
    }
    vi.mocked(formsApi.getForm).mockResolvedValue(formWithoutFile)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No file uploaded')
  })

  it('navigates to form list when cancel is clicked', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormEditView, {
      props: {
        formId: '1',
      },
    })

    await flushPromises()

    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'form-list' })
  })
})
