<script setup>
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const url = ref('')
const captchaToken = ref(null)

async function onSubmit() {
  if (!url.value) {
    toast.error('Please enter a valid URL.')
    return
  }

  try {
    const response = await useAPI('/api/link/create', {
      method: 'POST',
      body: {
        url: url.value,
        captchaToken: captchaToken.value,
      },
    })
    toast.success('Link shortened successfully!', {
      description: `Shortened URL: ${response.shortLink}`,
    })
    url.value = ''
  }
  catch (error) {
    toast.error('Failed to shorten the link.', {
      description: error.message,
    })
  }
}
</script>

<template>
  <div class="flex flex-col items-center space-y-4">
    <h1 class="text-2xl font-bold">
      Shorten Your Link
    </h1>
    <input
      v-model="url"
      type="url"
      placeholder="Enter your URL"
      class="w-full max-w-md p-2 border rounded"
    >
    <div id="captcha-container" class="my-4" />
    <Button class="w-full max-w-md" @click="onSubmit">
      Shorten Link
    </Button>
  </div>
</template>
