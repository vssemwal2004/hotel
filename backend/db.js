const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')
const path = require('path')
const fs = require('fs')

const file = path.join(__dirname, 'db.json')

// Ensure directory and file exist
try {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ testimonials: [], messages: [] }, null, 2))
  }
} catch (_) {}

const adapter = new JSONFile(file)
const db = new Low(adapter, { testimonials: [], messages: [] })

async function initDB() {
  await db.read()
  db.data ||= { testimonials: [], messages: [] }
  await db.write()
}

module.exports = { db, initDB }
