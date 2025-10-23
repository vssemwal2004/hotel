// Vercel might import this file if the project is misconfigured. Provide a serverless-compatible handler.
export default async function handler(req, res) {
  try {
    const { default: serverless } = await import('serverless-http')
    const mod = await import('./src/app.js')
    if (!req.url.startsWith('/health')) {
      await mod.ensureDb()
    }
    const wrapped = serverless(mod.app)
    return wrapped(req, res)
  } catch (e) {
    console.error('Fallback server.js handler error:', e?.message)
    res.status(500).json({ message: e?.message || 'Internal server error' })
  }
}
