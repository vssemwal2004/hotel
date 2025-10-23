// Vercel serverless entrypoint wrapping the Express app
let cachedHandler

export default async function handler(req, res) {
  try {
    if (!cachedHandler) {
      const { default: serverless } = await import('serverless-http')
      const mod = await import('../src/app.js')
      // Allow health checks to succeed even if DB is not configured
      if (!req.url.startsWith('/health')) {
        await mod.ensureDb()
      }
      cachedHandler = serverless(mod.app)
    }
    
    //
    return cachedHandler(req, res)
  } catch (e) {
    console.error('Serverless handler error:', e?.message)
    res.status(500).json({ message: e?.message || 'Internal server error' })
  }
}
