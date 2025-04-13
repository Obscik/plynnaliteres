import { LinkSchema } from '@/schemas/link'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { captchaToken, ...linkData } = await readValidatedBody(event, LinkSchema.extend({
    captchaToken: z.string().optional(), // Make CAPTCHA token optional
  }).parse)

  const { cfCaptchaSecret, siteToken } = useRuntimeConfig(event)
  const authorizationHeader = getHeader(event, 'Authorization')?.replace('Bearer ', '')

  let isAuthenticated = false

  // Validate CAPTCHA token if provided
  if (captchaToken) {
    const captchaResponse = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: {
        secret: cfCaptchaSecret,
        response: captchaToken,
      },
    })
    isAuthenticated = captchaResponse.success
  }

  // Validate Bearer token if CAPTCHA is not provided or invalid
  if (!isAuthenticated && authorizationHeader === siteToken) {
    isAuthenticated = true
  }

  if (!isAuthenticated) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: Invalid CAPTCHA or Bearer token.',
    })
  }

  // Proceed with link creation
  const { caseSensitive } = useRuntimeConfig(event)
  if (!caseSensitive) {
    linkData.slug = linkData.slug.toLowerCase()
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const existingLink = await KV.get(`link:${linkData.slug}`)
  if (existingLink) {
    throw createError({
      status: 409,
      statusText: 'Link already exists',
    })
  }

  const expiration = getExpiration(event, linkData.expiration)
  await KV.put(`link:${linkData.slug}`, JSON.stringify(linkData), {
    expiration,
    metadata: {
      expiration,
      url: linkData.url,
      comment: linkData.comment,
    },
  })

  setResponseStatus(event, 201)
  const shortLink = `${getRequestProtocol(event)}://${getRequestHost(event)}/${linkData.slug}`
  return { link: linkData, shortLink }
})
