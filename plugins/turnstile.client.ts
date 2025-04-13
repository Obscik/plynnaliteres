import { defineNuxtPlugin } from '#app'
import Turnstile from 'vue-turnstile'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('cf-turnstile', Turnstile)
})
