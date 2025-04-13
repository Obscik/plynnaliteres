<script setup>
import { ref } from 'vue'
import { toast } from 'vue-sonner'

let TurnstileComponent
try {
  TurnstileComponent = await import('cf-turnstile')
}
catch (error) {
  console.error('Failed to load cf-turnstile module:', error)
}

const url = ref('')
const captchaToken = ref(null)
const bearerToken = ref('')
const publicSiteKey = String(useRuntimeConfig().public.cfSiteKey)

function onCaptchaSuccess(token) {
  captchaToken.value = token
}

async function onSubmit() {
  if (!url.value) {
    toast.error('Please enter a valid URL.')
    return
  }

  if (!captchaToken.value) {
    toast.error('Please complete the CAPTCHA challenge.')
    console.error(captchaToken.value)
    return
  }

  try {
    const response = await $fetch('/api/link/create', {
      method: 'POST',
      body: {
        url: url.value,
        captchaToken: captchaToken.value,
      },
      headers: bearerToken.value ? { Authorization: `Bearer ${bearerToken.value}` } : {},
    })
    toast.success('Link shortened successfully!', {
      description: `Shortened URL: ${response.shortLink}`,
    })
    url.value = ''
    captchaToken.value = null
    bearerToken.value = ''
  }
  catch (error) {
    toast.error('Failed to shorten the link.', {
      description: error.message,
    })
  }
}
</script>

<template>
  <main class="flex flex-col items-center justify-center min-h-screen">
    <div class="flex flex-col items-center space-y-4">
      <input
        v-model="url"
        type="url"
        placeholder="Enter your URL"
        class="w-full max-w-md p-2 border rounded"
      >
      <div
        id="captcha-container"
        class="my-4 p-4 border rounded bg-gray-100 shadow-md flex items-center justify-center"
        style="min-height: 100px; min-width: 300px;"
      >
        <component
          :is="TurnstileComponent ? 'cf-turnstile' : 'div'"
          v-if="TurnstileComponent"
          :public-site-key="publicSiteKey"
          @success="onCaptchaSuccess"
        />
        <div v-else class="text-red-500">
          CAPTCHA component failed to load.
        </div>
      </div>
      <button class="w-full max-w-md p-2 bg-blue-500 text-white rounded" @click="onSubmit">
        Shorten Link
      </button>
    </div>
  </main>
</template>
