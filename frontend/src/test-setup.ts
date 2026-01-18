import { config } from '@vue/test-utils'

// Stub RouterLink and RouterView globally for all tests
config.global.stubs = {
  RouterLink: {
    template: '<a><slot /></a>',
  },
  RouterView: true,
}
