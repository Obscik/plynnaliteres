import { LinkSchema } from '@/schemas/link'
import { nanoid } from 'nanoid'
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
    try {
      const captchaResponse = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: {
          secret: cfCaptchaSecret,
          response: captchaToken,
        },
      })
      isAuthenticated = captchaResponse.success
      console.log('CAPTCHA validation result:', captchaResponse) // Debugging log
    }
    catch (error) {
      console.error('CAPTCHA validation error:', error) // Debugging log
    }
  }

  // Validate Bearer token only if CAPTCHA is invalid or not provided
  if (!isAuthenticated && authorizationHeader === siteToken) {
    isAuthenticated = true
    console.log('Bearer token validated successfully.') // Debugging log
  }
  else if (!isAuthenticated) {
    console.warn('Invalid or missing Bearer token.') // Debugging log
  }

  if (!isAuthenticated) {
    console.error('Authentication failed. CAPTCHA or Bearer token invalid.') // Debugging log
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

  // Generate unique ID and timestamps
  const id = nanoid()
  const timestamp = Math.floor(Date.now() / 1000)
  linkData.id = id
  linkData.createdAt = timestamp
  linkData.updatedAt = timestamp

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
