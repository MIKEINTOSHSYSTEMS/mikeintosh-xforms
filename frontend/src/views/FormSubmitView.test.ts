import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormSubmitView from './FormSubmitView.vue'
import * as formsApi from '../api/forms'
import type { Form } from '../api/forms'

// Mock the forms API
vi.mock('../api/forms', () => ({
  getForm: vi.fn(),
  submitForm: vi.fn(),
}))

// Mock the OdkWebForm component
vi.mock('@getodk/web-forms', () => ({
  OdkWebForm: {
    name: 'OdkWebForm',
    props: ['formXml', 'fetchFormAttachment'],
    emits: ['submit'],
    template: '<div class="mock-odk-form">ODK Form Component</div>',
  },
  POST_SUBMIT__NEW_INSTANCE: 'new-instance',
}))

const mockForm: Form = {
  id: 1,
  name: 'Patient Survey',
  description: 'Survey for patient feedback',
  xls_form: '/media/xlsforms/patient-survey.xlsx',
  version: '1.0',
  xml_definition: '<h:html xmlns:h="http://www.w3.org/1999/xhtml"><h:head><h:title>Patient Survey</h:title></h:head></h:html>',
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-02T15:30:00Z',
}

describe('FormSubmitView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays form information', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Submit data for Patient Survey')
    expect(wrapper.text()).toContain('Version: 1.0')
    expect(wrapper.text()).toContain('Description: Survey for patient feedback')
  })

  it('displays loading state initially', () => {
    vi.mocked(formsApi.getForm).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    expect(wrapper.text()).toContain('Loading form definition')
  })

  it('displays error when form loading fails', async () => {
    vi.mocked(formsApi.getForm).mockRejectedValue(new Error('Form not found'))

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Form not found')
  })

  it('shows error for invalid form ID', async () => {
    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 'invalid' as any,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Invalid form identifier')
  })

  it('renders ODK web form component with form XML', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    expect(wrapper.find('.mock-odk-form').exists()).toBe(true)
  })

  it('handles successful form submission', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)
    vi.mocked(formsApi.submitForm).mockResolvedValue({
      submission_id: 123,
      form_id: 1,
      submitted_at: '2025-10-01T12:00:00Z',
    })

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    // Simulate ODK form submission
    const xmlContent = '<data><field>value</field></data>'
    const xmlFile = new File([xmlContent], 'submission.xml', {
      type: 'text/xml',
    })
    
    // Mock the text() method on the File
    xmlFile.text = vi.fn().mockResolvedValue(xmlContent)

    const formData = new FormData()
    formData.append('xml_submission_file', xmlFile)

    const mockCallback = vi.fn()
    
    // Get the component instance
    const vm = wrapper.vm as any
    await vm.handleSubmit(
      {
        status: 'ready',
        data: [formData],
      },
      mockCallback
    )

    await flushPromises()

    expect(formsApi.submitForm).toHaveBeenCalledWith(1, xmlContent)
    expect(wrapper.text()).toContain('Submission stored with ID 123')
    expect(wrapper.text()).toContain('Last submission ID: 123')
    expect(mockCallback).toHaveBeenCalledWith({ next: 'new-instance' })
  })

  it('displays submitting state during submission', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)
    vi.mocked(formsApi.submitForm).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    // Simulate submission
    const xmlContent = '<data><field>value</field></data>'
    const xmlFile = new File([xmlContent], 'submission.xml', {
      type: 'text/xml',
    })
    xmlFile.text = vi.fn().mockResolvedValue(xmlContent)

    const formData = new FormData()
    formData.append('xml_submission_file', xmlFile)

    const vm = wrapper.vm as any
    vm.handleSubmit({
      status: 'ready',
      data: [formData],
    })

    // Wait for text() to be called but before submission completes
    await new Promise(resolve => setTimeout(resolve, 0))
    await flushPromises()

    expect(wrapper.text()).toContain('Sending submission')
  })

  it('displays error when submission fails', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)
    vi.mocked(formsApi.submitForm).mockRejectedValue(new Error('Submission failed'))

    // Suppress expected console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    // Simulate submission
    const xmlContent = '<data><field>value</field></data>'
    const xmlFile = new File([xmlContent], 'submission.xml', {
      type: 'text/xml',
    })
    xmlFile.text = vi.fn().mockResolvedValue(xmlContent)

    const formData = new FormData()
    formData.append('xml_submission_file', xmlFile)

    const vm = wrapper.vm as any
    await vm.handleSubmit({
      status: 'ready',
      data: [formData],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Submission failed')
    
    consoleErrorSpy.mockRestore()
  })

  it('handles payload not ready error', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    // Suppress expected console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    const formData = new FormData()
    const vm = wrapper.vm as any
    
    await vm.handleSubmit({
      status: 'pending',
      data: [formData],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Submission payload is not ready')
    
    consoleErrorSpy.mockRestore()
  })

  it('handles missing XML file error', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    // Suppress expected console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    // Submit with missing XML file
    const formData = new FormData()
    formData.append('other_field', 'value')

    const vm = wrapper.vm as any
    await vm.handleSubmit({
      status: 'ready',
      data: [formData],
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Submission payload missing XML file')
    
    consoleErrorSpy.mockRestore()
  })

  it('reloads form when formId prop changes', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()
    expect(formsApi.getForm).toHaveBeenCalledWith(1)

    // Change formId
    const otherForm: Form = { ...mockForm, id: 2, name: 'Other Form' }
    vi.mocked(formsApi.getForm).mockResolvedValue(otherForm)

    await wrapper.setProps({ formId: 2 })
    await flushPromises()

    expect(formsApi.getForm).toHaveBeenCalledWith(2)
    expect(wrapper.text()).toContain('Submit data for Other Form')
  })

  it('does not display version or description if missing', async () => {
    const formWithoutMetadata: Form = {
      ...mockForm,
      version: '',
      description: '',
    }
    vi.mocked(formsApi.getForm).mockResolvedValue(formWithoutMetadata)

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    expect(wrapper.text()).not.toContain('Version:')
    expect(wrapper.text()).not.toContain('Description:')
  })

  it('has back to forms link', async () => {
    vi.mocked(formsApi.getForm).mockResolvedValue(mockForm)

    const wrapper = mount(FormSubmitView, {
      props: {
        formId: 1,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('← Back to forms')
  })
})
