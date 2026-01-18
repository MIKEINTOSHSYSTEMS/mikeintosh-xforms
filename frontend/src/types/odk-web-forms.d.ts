declare module '@getodk/web-forms' {
  import type { DefineComponent, Plugin } from 'vue'

  export type SubmissionPayload = {
    status: 'pending' | 'ready'
    data: readonly [FormData]
  }

  export const POST_SUBMIT__NEW_INSTANCE: string

  export const webFormsPlugin: Plugin

  export const OdkWebForm: DefineComponent<
    {
      formXml: string
      fetchFormAttachment: (filename: string) => Promise<Response>
    },
    {},
    {},
    {},
    {},
    {},
    {},
    {
      submit: (payload: SubmissionPayload, callback?: (result?: unknown) => void) => void
    }
  >
}
