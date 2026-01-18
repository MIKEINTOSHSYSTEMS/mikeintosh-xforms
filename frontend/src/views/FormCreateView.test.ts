import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormCreateView from './FormCreateView.vue'
import * as formsApi from '../api/forms'
import type { Form } from '../api/forms'

// Mock the forms API
vi.mock('../api/forms', () => ({
  createForm: vi.fn(),
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

describe('FormCreateView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with all fields', () => {
    const wrapper = mount(FormCreateView)

    expect(wrapper.text()).toContain('Create a new form')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })

  it('shows error when name is empty', async () => {
    const wrapper = mount(FormCreateView)

    // Try to submit without filling name
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Please provide a name for the form')
  })

  it('shows error when file is not selected', async () => {
    const wrapper = mount(FormCreateView)

    // Fill name but no file
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('Test Form')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Please select an XLSForm file')
  })

  it('displays selected file information', async () => {
    const wrapper = mount(FormCreateView)

    const file = new File(['content'], 'test-form.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement

    // Create a mock FileList
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })

    await fileInput.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('test-form.xlsx')
    expect(wrapper.text()).toMatch(/KB/)
  })

  it('successfully creates a form with all fields', async () => {
    const mockResponse: Form = {
      id: 1,
      name: 'New Form',
      description: 'Test description',
      xls_form: '/media/xlsforms/test.xlsx',
      version: '1.0',
      xml_definition: '<form></form>',
      created_at: '2025-10-01T10:00:00Z',
      updated_at: '2025-10-01T10:00:00Z',
    }

    vi.mocked(formsApi.createForm).mockResolvedValue(mockResponse)

    const wrapper = mount(FormCreateView)

    // Fill form fields
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('New Form')

    const descriptionTextarea = wrapper.find('textarea')
    await descriptionTextarea.setValue('Test description')

    const file = new File(['content'], 'test-form.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    // Submit form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Check API was called correctly
    expect(formsApi.createForm).toHaveBeenCalledWith({
      name: 'New Form',
      xls_file: file,
      description: 'Test description',
    })

    // Check success message is shown
    expect(wrapper.text()).toContain('Successfully created form')

    // Check navigation happens after delay
    await new Promise((resolve) => setTimeout(resolve, 1100))
    expect(mockPush).toHaveBeenCalledWith({ name: 'form-list' })
  })

  it('successfully creates a form without description', async () => {
    const mockResponse: Form = {
      id: 1,
      name: 'New Form',
      description: '',
      xls_form: '/media/xlsforms/test.xlsx',
      version: '1.0',
      xml_definition: '<form></form>',
      created_at: '2025-10-01T10:00:00Z',
      updated_at: '2025-10-01T10:00:00Z',
    }

    vi.mocked(formsApi.createForm).mockResolvedValue(mockResponse)

    const wrapper = mount(FormCreateView)

    // Fill only name
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('New Form')

    const file = new File(['content'], 'test-form.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    // Submit form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Check API was called without description
    expect(formsApi.createForm).toHaveBeenCalledWith({
      name: 'New Form',
      xls_file: file,
      description: undefined,
    })
  })

  it('displays error message when creation fails', async () => {
    vi.mocked(formsApi.createForm).mockRejectedValue(new Error('Server error'))

    const wrapper = mount(FormCreateView)

    // Fill form
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('New Form')

    const file = new File(['content'], 'test-form.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    // Submit form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Server error')
  })

  it('shows submitting state during form submission', async () => {
    vi.mocked(formsApi.createForm).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const wrapper = mount(FormCreateView)

    // Fill form
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('New Form')

    const file = new File(['content'], 'test-form.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    // Submit form
    const submitButton = wrapper.find('button[type="submit"]')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(submitButton.text()).toContain('Creating')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('trims whitespace from name and description', async () => {
    const mockResponse: Form = {
      id: 1,
      name: 'Trimmed Form',
      description: 'Trimmed description',
      xls_form: '/media/xlsforms/test.xlsx',
      version: '1.0',
      xml_definition: '<form></form>',
      created_at: '2025-10-01T10:00:00Z',
      updated_at: '2025-10-01T10:00:00Z',
    }

    vi.mocked(formsApi.createForm).mockResolvedValue(mockResponse)

    const wrapper = mount(FormCreateView)

    // Fill form with extra whitespace
    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('  Trimmed Form  ')

    const descriptionTextarea = wrapper.find('textarea')
    await descriptionTextarea.setValue('  Trimmed description  ')

    const file = new File(['content'], 'test-form.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.find('input[type="file"]')
    const inputElement = fileInput.element as HTMLInputElement
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    // Submit form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Check trimmed values were sent
    expect(formsApi.createForm).toHaveBeenCalledWith({
      name: 'Trimmed Form',
      xls_file: file,
      description: 'Trimmed description',
    })
  })
})
