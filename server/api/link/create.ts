import { nanoid } from '@/schemas/link'

export default eventHandler(async (event) => {
  const { url, captchaToken } = await readBody(event)
  const { cfPrivateKey } = useRuntimeConfig()

  const captchaResponse = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: {
      secret: cfPrivateKey,
      response: captchaToken,
    },
  })

  if (!captchaResponse.success) {
    throw createError({ statusCode: 400, message: 'CAPTCHA verification failed.' })
  }

  const slug = nanoid()
  const shortLink = `${useRuntimeConfig().public.baseUrl}/${slug}`

  const { cloudflare } = event.context
  const { KV } = cloudflare.env

  const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days expiration
  await KV.put(`link:${slug}`, JSON.stringify({ url, slug }), {
    expiration,
    metadata: {
      url,
    },
  })

  return {
    statusCode: 201,
    body: {
      shortLink,
      slug,
    },
  }
})
