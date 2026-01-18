import 'vite/modulepreload-polyfill'
import { createApp } from 'vue'
import { webFormsPlugin } from '@getodk/web-forms'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(webFormsPlugin)
app.use(router)
app.mount('#app')
