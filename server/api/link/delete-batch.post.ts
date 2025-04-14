export default eventHandler(async (event) => {
  const { slugs } = await readBody(event)
  if (!Array.isArray(slugs) || !slugs.length) {
    throw createError({
      status: 400,
      statusText: 'Invalid request: No slugs provided.',
    })
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env

  for (const slug of slugs) {
    await KV.delete(`link:${slug}`)
  }

  return { success: true }
})
