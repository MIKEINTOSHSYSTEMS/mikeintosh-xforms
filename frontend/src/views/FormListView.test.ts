import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import FormListView from './FormListView.vue'
import * as formsApi from '../api/forms'
import type { Form } from '../api/forms'

// Mock the forms API
vi.mock('../api/forms', () => ({
  listForms: vi.fn(),
}))

const mockForms: Form[] = [
  {
    id: 1,
    name: 'Patient Survey',
    description: 'Survey for patient feedback',
    xls_form: '/media/xlsforms/patient-survey.xlsx',
    version: '1.0',
    xml_definition: '<form></form>',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-02T15:30:00Z',
  },
  {
    id: 2,
    name: 'Health Assessment',
    description: '',
    xls_form: null,
    version: '2.1',
    xml_definition: '<form></form>',
    created_at: '2025-09-15T08:00:00Z',
    updated_at: '2025-10-01T09:00:00Z',
  },
]

// Create a mock router
function createMockRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'form-list', component: { template: '<div></div>' } },
      { path: '/forms/new', name: 'form-create', component: { template: '<div></div>' } },
      {
        path: '/forms/:formId/edit',
        name: 'form-edit',
        component: { template: '<div></div>' },
      },
      {
        path: '/forms/:formId/submit',
        name: 'form-submit',
        component: { template: '<div></div>' },
      },
    ],
  })
  return router
}

describe('FormListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    vi.mocked(formsApi.listForms).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Loading forms')
  })

  it('displays forms in a table after loading', async () => {
    vi.mocked(formsApi.listForms).mockResolvedValue(mockForms)

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Patient Survey')
    expect(wrapper.text()).toContain('Health Assessment')
    expect(wrapper.text()).toContain('Survey for patient feedback')
    expect(wrapper.text()).toContain('1.0')
    expect(wrapper.text()).toContain('2.1')
  })

  it('displays empty state when no forms exist', async () => {
    vi.mocked(formsApi.listForms).mockResolvedValue([])

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No forms available yet')
  })

  it('displays error message when loading fails', async () => {
    vi.mocked(formsApi.listForms).mockRejectedValue(new Error('Network error'))

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Network error')
    expect(wrapper.text()).toContain('Try again')
  })

  it('retries loading when try again button is clicked', async () => {
    vi.mocked(formsApi.listForms).mockRejectedValueOnce(new Error('Network error'))

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // First load fails
    expect(wrapper.text()).toContain('Network error')

    // Mock successful response for retry
    vi.mocked(formsApi.listForms).mockResolvedValue(mockForms)

    // Click try again
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Should now show forms
    expect(wrapper.text()).toContain('Patient Survey')
  })

  it('displays dash for missing description and version', async () => {
    const formsWithMissingData: Form[] = [
      {
        id: 3,
        name: 'Minimal Form',
        description: '',
        xls_form: null,
        version: '',
        xml_definition: '<form></form>',
        created_at: '2025-10-01T10:00:00Z',
        updated_at: '2025-10-02T15:30:00Z',
      },
    ]

    vi.mocked(formsApi.listForms).mockResolvedValue(formsWithMissingData)

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Minimal Form')
    // Check for em dash character
    expect(text).toMatch(/—/)
  })

  it('formats dates correctly', async () => {
    vi.mocked(formsApi.listForms).mockResolvedValue(mockForms)

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // The exact format depends on locale, but should contain date parts
    const text = wrapper.text()
    expect(text).toMatch(/Oct|10/)
    expect(text).toMatch(/2025/)
  })

  it('renders create form link', async () => {
    vi.mocked(formsApi.listForms).mockResolvedValue(mockForms)

    const router = createMockRouter()
    const wrapper = mount(FormListView, {
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.html()).toContain('Create form')
  })
})
