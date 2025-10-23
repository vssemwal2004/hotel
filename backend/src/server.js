import { app, ensureDb } from './app.js'
import { startAvailabilityResetJob } from './scheduler/availabilityReset.js'

// Local/Server deployment entrypoint (not used on Vercel serverless)
ensureDb()
  .then(() => {
    startAvailabilityResetJob()
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`API listening on :${PORT}`))
  })
  .catch((e) => {
    console.error('Failed to start server:', e)
    process.exit(1)
  })
