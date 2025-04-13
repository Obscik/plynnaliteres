import { LinkSchema } from '@/schemas/link'

export default eventHandler(async (event) => {
  const { captchaToken, ...linkData } = await readValidatedBody(event, LinkSchema.extend({
    captchaToken: z.string().nonempty(),
  }).parse)

  // Validate CAPTCHA token with Cloudflare
  const { cfCaptchaSecret } = useRuntimeConfig(event)
  const captchaResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: {
      secret: cfCaptchaSecret,
      response: captchaToken,
    },
  })

  if (!captchaResponse.success) {
    throw createError({
      status: 403,
      statusText: 'CAPTCHA validation failed.',
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
