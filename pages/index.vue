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
const slug = ref('')
const expiryDate = ref('')
const publicSiteKey = String(useRuntimeConfig().public.cfSiteKey)

async function onSubmit(event) {
  event.preventDefault() // Prevent default form submission behavior

  if (!url.value) {
    toast.error('Please enter a valid URL.')
    return
  }

  try {
    const formData = new FormData(event.target)
    const captchaToken = formData.get('cf-turnstile-response') // Get the CAPTCHA token from the hidden input

    if (!captchaToken) {
      toast.error('Please complete the CAPTCHA challenge.')
      console.error('CAPTCHA token is missing.') // Debugging log
      return
    }

    const body = {
      url: url.value,
      captchaToken, // Ensure CAPTCHA token is included
    }

    // Include optional fields if provided
    if (slug.value)
      body.slug = slug.value
    if (expiryDate.value)
      body.expiryDate = expiryDate.value

    console.log('Submitting request body:', body) // Debugging log

    const response = await $fetch('/api/link/create', {
      method: 'POST',
      body,
    })

    console.log('Link creation response:', response) // Debugging log

    toast.success('Link shortened successfully!', {
      description: `Shortened URL: ${response.shortLink}`,
    })

    // Display the full link details
    console.log('Link details:', response.link)

    url.value = ''
    slug.value = ''
    expiryDate.value = ''
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
    <form
      class="flex flex-col items-center space-y-4"
      @submit="onSubmit"
    >
      <input
        v-model="url"
        type="url"
        placeholder="Enter your URL"
        class="w-full max-w-md p-2 border rounded"
        required
      >

      <input
        v-model="slug"
        type="text"
        placeholder="Custom slug (optional)"
        class="w-full max-w-md p-2 border rounded"
      >

      <input
        v-model="expiryDate"
        type="date"
        placeholder="Expiry date (optional)"
        class="w-full max-w-md p-2 border rounded"
      >

      <component
        :is="TurnstileComponent ? 'cf-turnstile' : 'div'"
        v-if="TurnstileComponent"
        :site-key="publicSiteKey"
      />
      <div v-else class="text-red-500">
        CAPTCHA component failed to load.
      </div>

      <button
        type="submit"
        class="w-full max-w-md p-2 bg-blue-500 text-white rounded"
      >
        Shorten Link
      </button>
    </form>
  </main>
</template>
