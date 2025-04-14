export default eventHandler(async (event) => {
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
  const body = await readBody(event)
  const captchaToken = body?.captchaToken

  const { siteToken, cfCaptchaSecret } = useRuntimeConfig(event)

  let isAuthenticated = false

  // Validate Bearer token
  if (token === siteToken) {
    isAuthenticated = true
  }
  else if (token && token.length < 8) {
    throw createError({
      status: 401,
      statusText: 'Token is too short',
    })
  }

  // Validate CAPTCHA token if Bearer token is invalid
  if (!isAuthenticated && captchaToken) {
    try {
      const captchaResponse = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: {
          secret: cfCaptchaSecret,
          response: captchaToken,
        },
      })
      isAuthenticated = captchaResponse.success
    }
    catch (error) {
      console.error('CAPTCHA validation error:', error)
    }
  }

  if (!isAuthenticated) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized: Invalid Bearer or CAPTCHA token.',
    })
  }
})
