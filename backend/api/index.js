// Vercel serverless entrypoint wrapping the Express app
let cachedHandler

export default async function handler(req, res) {
  try {
    if (!cachedHandler) {
      const { default: serverless } = await import('serverless-http')
      const mod = await import('../src/app.js')
      await mod.ensureDb()
      cachedHandler = serverless(mod.app)
    }
    return cachedHandler(req, res)
  } catch (e) {
    console.error('Serverless handler error:', e)
    res.status(500).json({ message: 'Internal server error' })
  }
}
