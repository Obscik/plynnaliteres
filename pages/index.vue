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
  console.log('CAPTCHA success token:', token) // Debugging log
  captchaToken.value = token
}

// Add a fallback for debugging if the event is not triggered
function onCaptchaError(error) {
  console.error('CAPTCHA error:', error) // Debugging log
}

async function onSubmit() {
  console.log('Submitting with CAPTCHA token:', captchaToken.value) // Debugging log

  if (!url.value) {
    toast.error('Please enter a valid URL.')
    return
  }

  if (!captchaToken.value) {
    toast.error('Please complete the CAPTCHA challenge.')
    console.error('token: ', captchaToken.value)
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
    captchaToken.value = null // Reset after successful submission
    bearerToken.value = ''
  }
  catch (error) {
    console.error('Submission error:', error) // Debugging log
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

      <component
        :is="TurnstileComponent ? 'cf-turnstile' : 'div'"
        v-if="TurnstileComponent"
        :site-key="publicSiteKey"
        @success="onCaptchaSuccess"
        @error="onCaptchaError"
      />
      <div v-else class="text-red-500">
        CAPTCHA component failed to load.
      </div>

      <button class="w-full max-w-md p-2 bg-blue-500 text-white rounded" @click="onSubmit">
        Shorten Link
      </button>
    </div>
  </main>
</template>
