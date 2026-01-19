import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/forms',
    },
    {
      path: '/forms',
      name: 'form-list',
      component: () => import('../views/FormListView.vue'),
    },
    {
      path: '/forms/new',
      name: 'form-create',
      component: () => import('../views/FormCreateView.vue'),
    },
    {
      path: '/forms/:formId/edit',
      name: 'form-edit',
      props: true,
      component: () => import('../views/FormEditView.vue'),
    },
    {
      path: '/forms/:formId/submit',
      name: 'form-submit',
      props: true,
      component: () => import('../views/FormSubmitView.vue'),
    },
    {
      path: '/xlsplay',
      name: 'xlsplay',
      component: () => import('../views/XLSPlayView.vue'),
    },
  ],
})

export default router