import nodemailer from 'nodemailer'
import dns from 'dns'

// Force IPv4 to avoid ENETUNREACH errors with IPv6
dns.setDefaultResultOrder('ipv4first')

// Create reusable transporter
function getTransporter() {
  // Use Gmail SMTP or custom SMTP based on env
  const transportConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.ADMIN_EMAIL,
      pass: process.env.SMTP_PASS || process.env.SMTP_APP_PASSWORD
    },
    // Force IPv4
    family: 4
  }
  
  return nodemailer.createTransport(transportConfig)
}

// Format date for display
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

// Send booking confirmation to user
export async function sendBookingConfirmationToUser(booking, user) {
  const transporter = getTransporter()
  
  const roomDetails = booking.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const guestDetails = booking.items.flatMap(item => 
    (item.guests || []).map(g => `${g.name} (${g.type}, Age: ${g.age})`)
  ).join(', ') || 'Not specified'

  const isPaid = booking.status === 'paid'
  const amountPaid = Math.max(0, Number(booking.amountPaid || 0))
  const remainingAmount = Math.max(0, Number(booking.total || 0) - amountPaid)
  const hasAdvance = !isPaid && amountPaid > 0
  const isReserved = isPaid || !!booking.inventoryCommitted || hasAdvance
  const paymentProvider = booking.payment?.provider || 'N/A'
  const paymentMethod = paymentProvider === 'razorpay' ? 'Razorpay (Online)' : paymentProvider === 'offline' ? 'Offline (At Hotel)' : paymentProvider

  const paymentSection = isPaid ? `
          <h3>💳 Payment Details</h3>
          <table style="width: 100%;">
            <tr>
              <td><strong>Payment Status:</strong></td>
              <td style="color: #4caf50; font-weight: bold;">PAID ✓</td>
            </tr>
            <tr>
              <td><strong>Amount Paid:</strong></td>
              <td style="font-weight: bold;">${formatCurrency(amountPaid)}</td>
            </tr>
            <tr>
              <td><strong>Remaining:</strong></td>
              <td style="font-weight: bold;">${formatCurrency(remainingAmount)}</td>
            </tr>
            ${booking.payment?.paymentId ? `<tr>
              <td><strong>Payment ID:</strong></td>
              <td>${booking.payment.paymentId}</td>
            </tr>` : ''}
            <tr>
              <td><strong>Payment Method:</strong></td>
              <td>${paymentMethod}</td>
            </tr>
          </table>
  ` : hasAdvance ? `
          <h3>💳 Payment Details</h3>
          <div style="background: #e8f5e9; border: 2px solid #4caf50; padding: 20px; border-radius: 10px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; color: #1b5e20;">✅ Advance Payment Received</p>
            <p style="margin: 0; color: #2e7d32; font-size: 14px;">Your room is <strong>reserved</strong>. Remaining balance can be paid at the hotel.</p>
          </div>
          <table style="width: 100%; margin-top: 10px;">
            <tr>
              <td><strong>Amount Paid:</strong></td>
              <td style="font-weight: bold;">${formatCurrency(amountPaid)}</td>
            </tr>
            <tr>
              <td><strong>Remaining Due:</strong></td>
              <td style="color: #e65100; font-weight: bold; font-size: 16px;">${formatCurrency(remainingAmount)}</td>
            </tr>
          </table>
  ` : `
          <h3>💳 Payment Details</h3>
          <div style="background: #fff3e0; border: 2px solid #ff9800; padding: 20px; border-radius: 10px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; color: #e65100;">⚠️ Payment Required</p>
            <p style="margin: 0; color: #bf360c; font-size: 14px;">Your room is <strong>NOT reserved</strong> yet. Room will only be reserved after payment is received.</p>
            <p style="margin: 10px 0 0 0; color: #e65100; font-weight: bold; font-size: 15px;">Please confirm your payment to reserve your room.</p>
          </div>
          <table style="width: 100%; margin-top: 10px;">
            <tr>
              <td><strong>Amount Due:</strong></td>
              <td style="color: #e65100; font-weight: bold; font-size: 16px;">${formatCurrency(booking.total)}</td>
            </tr>
          </table>
  `

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${isPaid ? '#667eea 0%, #764ba2 100%' : '#ff9800 0%, #f57c00 100%'}); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-id { background: ${isPaid ? '#e8f5e9' : '#fff3e0'}; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
        .total-row { background: #f0f0f0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Krishna</h1>
          <p>${isPaid ? 'Booking Confirmation' : 'Action Required: Confirm Payment to Reserve Room'}</p>
        </div>
        <div class="content">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Thank you for choosing Hotel Krishna! Your booking request has been 
            <span class="status-badge" style="background: ${isPaid ? '#4caf50' : '#ff9800'}; color: white;">
              ${isPaid ? 'CONFIRMED & PAID ✓' : (isReserved ? 'RESERVED — ADVANCE RECEIVED' : 'RECEIVED — AWAITING PAYMENT')}
            </span>
          </p>
          ${(!isPaid && !isReserved) ? `<p style="color: #e65100; font-weight: bold;">⚠️ Your room is <u>NOT reserved</u> yet. Please confirm your payment to reserve your room.</p>` : ''}
          
          <div class="booking-id">
            <p style="margin: 0; color: #666;">Booking Reference</p>
            <h2 style="margin: 5px 0; color: #333;">${booking._id}</h2>
          </div>

          <h3>📅 Stay Details</h3>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td><strong>Check-in:</strong></td>
              <td>${formatDate(booking.checkIn)}</td>
            </tr>
            <tr>
              <td><strong>Check-out:</strong></td>
              <td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day Booking'}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td>
            </tr>
            <tr>
              <td><strong>Guests:</strong></td>
              <td>${guestDetails}</td>
            </tr>
          </table>

          <h3>🛏️ Room Details</h3>
          <table class="details-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${roomDetails}
              ${booking.gstAmount > 0 ? `
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">Subtotal</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">GST (${booking.gstPercentage}%)</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.gstAmount)}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td colspan="2" style="padding: 12px;"><strong>Total Amount</strong></td>
                <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(booking.total)}</strong></td>
              </tr>
            </tbody>
          </table>

          ${paymentSection}

          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h4 style="margin-top: 0;">📞 Contact Us</h4>
            <p style="margin-bottom: 0;">
              For any queries, please contact us at:<br>
              Email: krishnahotelandrestaurants@gmail.com<br>
              We look forward to hosting you!
            </p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply directly.</p>
          <p>© ${new Date().getFullYear()} Hotel Krishna. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: user.email,
    subject: `${isPaid ? '✅' : '⚠️'} ${isPaid ? 'Booking Confirmed' : 'Action Required: Confirm Payment to Reserve Your Room'} - ${booking._id}`,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Booking confirmation email sent to ${user.email}`)
    return true
  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    return false
  }
}

// Send booking update email to user
export async function sendBookingUpdateToUser(booking, user, options = {}) {
  const transporter = getTransporter()

  const changedFields = Array.isArray(options.changedFields) ? options.changedFields : []
  const actorName = options.actor?.name ? String(options.actor.name) : ''
  const actorRole = options.actor?.role ? String(options.actor.role) : ''

  const roomDetails = booking.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const amountPaid = Math.max(0, Number(booking.amountPaid || 0))
  const remainingAmount = Math.max(0, Number(booking.total || 0) - amountPaid)
  const paymentSummary = (amountPaid > 0 || remainingAmount > 0) ? `
    <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid #eee;margin:16px 0;">
      <p style="margin:0 0 6px 0;font-weight:bold;">💳 Payment Summary</p>
      <table style="width:100%;">
        <tr><td><strong>Amount Paid:</strong></td><td style="text-align:right;">${formatCurrency(amountPaid)}</td></tr>
        <tr><td><strong>Remaining Due:</strong></td><td style="text-align:right;">${formatCurrency(remainingAmount)}</td></tr>
      </table>
    </div>
  ` : ''

  const changedSummary = changedFields.length > 0
    ? `<div style="background:#e3f2fd;border:1px solid #bbdefb;padding:12px;border-radius:8px;margin:16px 0;">
        <p style="margin:0 0 6px 0;font-weight:bold;color:#0d47a1;">Updated Details</p>
        <p style="margin:0;color:#0d47a1;font-size:13px;">${changedFields.map(f => String(f).replace(/_/g, ' ')).join(', ')}</p>
      </div>`
    : ''

  const editedBy = actorName || actorRole
    ? `<p style="margin:0 0 12px 0;color:#666;font-size:13px;">Edited by: <strong>${actorName || 'Staff'}</strong>${actorRole ? ` (${actorRole})` : ''}</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1565c0 0%, #283593 100%); color: white; padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .details-table th { background: #1565c0; color: white; padding: 12px; text-align: left; }
        .total-row { background: #f0f0f0; font-weight: bold; }
        .footer { text-align: center; margin-top: 26px; color: #666; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">🏨 Hotel Krishna</h1>
          <p style="margin:6px 0 0 0;">Booking Updated</p>
        </div>
        <div class="content">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your booking has been updated. Please find the latest details below.</p>
          ${editedBy}

          <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid #eee;margin:16px 0;">
            <p style="margin:0;color:#666;">Booking Reference</p>
            <p style="margin:4px 0 0 0;font-weight:bold;">${booking._id}</p>
          </div>

          ${changedSummary}

          <h3 style="margin:18px 0 8px 0;">📅 Stay Details</h3>
          <table style="width:100%;">
            <tr><td><strong>Check-in:</strong></td><td>${formatDate(booking.checkIn)}</td></tr>
            <tr><td><strong>Check-out:</strong></td><td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day Booking'}</td></tr>
            <tr><td><strong>Duration:</strong></td><td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td></tr>
          </table>

          <h3 style="margin:18px 0 8px 0;">🛏️ Room Details</h3>
          <table class="details-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${roomDetails}
              ${booking.gstAmount > 0 ? `
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">Subtotal</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">GST (${booking.gstPercentage}%)</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.gstAmount)}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td colspan="2" style="padding: 12px;"><strong>Total Amount</strong></td>
                <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(booking.total)}</strong></td>
              </tr>
            </tbody>
          </table>

          ${paymentSummary}

          <div style="background:#fff3e0;padding:14px;border-radius:8px;margin-top:18px;border-left:4px solid #ff9800;">
            <p style="margin:0;"><strong>Need help?</strong> Contact us at: ${process.env.ADMIN_EMAIL || 'krishnahotelandrestaurants@gmail.com'}</p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated email. Please do not reply directly.</p>
          <p>© ${new Date().getFullYear()} Hotel Krishna. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: user.email,
    subject: `✏️ Booking Updated - ${booking._id}`,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Booking update email sent to ${user.email}`)
    return true
  } catch (error) {
    console.error('Error sending booking update email:', error)
    return false
  }
}

// Send booking notification to admin
export async function sendBookingNotificationToAdmin(booking, user) {
  const transporter = getTransporter()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('Admin email not configured')
    return false
  }

  const roomDetails = booking.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const guestList = booking.items.flatMap(item => 
    (item.guests || []).map(g => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${g.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${g.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${g.age}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${g.email || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${g.phone || '-'}</td>
      </tr>
    `)
  ).join('') || '<tr><td colspan="5" style="padding: 10px; text-align: center;">No guest details provided</td></tr>'

  const isPaid = booking.status === 'paid'
  const amountPaid = Math.max(0, Number(booking.amountPaid || 0))
  const remainingAmount = Math.max(0, Number(booking.total || 0) - amountPaid)
  const hasAdvance = !isPaid && amountPaid > 0
  const isReserved = isPaid || !!booking.inventoryCommitted || hasAdvance
  const paymentProvider = booking.payment?.provider || 'N/A'
  const paymentMethod = paymentProvider === 'razorpay' ? 'Razorpay (Online)' : paymentProvider === 'offline' ? 'Offline (At Hotel)' : paymentProvider

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: ${isPaid ? '#2196f3' : '#ff9800'}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 25px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th { background: #2196f3; color: white; padding: 10px; text-align: left; }
        .highlight { background: ${isPaid ? '#e3f2fd' : '#fff3e0'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${isPaid ? '#2196f3' : '#ff9800'}; }
        .amount { font-size: 24px; color: ${isPaid ? '#4caf50' : '#e65100'}; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${isPaid ? '🔔 New Booking Alert' : '🕐 New Booking Request — Payment Pending'}</h2>
          <p>A new room booking has been ${isPaid ? 'confirmed & paid' : (isReserved ? 'received — <strong>advance received (room reserved)</strong>' : 'received — <strong>room is NOT reserved until payment is confirmed</strong>')}</p>
        </div>
        <div class="content">
          <div class="highlight">
            <table style="width: 100%;">
              <tr>
                <td><strong>Booking ID:</strong> ${booking._id}</td>
                <td style="text-align: right;"><strong>Total:</strong> <span class="amount">${formatCurrency(booking.total)}</span></td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 8px;">
                  <strong>Status:</strong> 
                  <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; background: ${isPaid ? '#4caf50' : '#ff9800'};">
                    ${isPaid ? 'PAID ✓' : (isReserved ? 'RESERVED (ADVANCE)' : 'PAYMENT PENDING')}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>👤 Customer Details</h3>
            <table style="width: 100%;">
              <tr><td><strong>Name:</strong></td><td>${user.name}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
              <tr><td><strong>Phone:</strong></td><td>${user.phone || 'Not provided'}</td></tr>
              <tr><td><strong>User ID:</strong></td><td>${user._id}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>📅 Booking Details</h3>
            <table style="width: 100%;">
              <tr><td><strong>Check-in:</strong></td><td>${formatDate(booking.checkIn)}</td></tr>
              <tr><td><strong>Check-out:</strong></td><td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day'}</td></tr>
              <tr><td><strong>Duration:</strong></td><td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td></tr>
              <tr><td><strong>Booking Time:</strong></td><td>${new Date().toLocaleString('en-IN')}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>🛏️ Room Details</h3>
            <table class="details-table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${roomDetails}
                ${booking.gstAmount > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">Subtotal</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">GST (${booking.gstPercentage}%)</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.gstAmount)}</td>
                </tr>` : ''}
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td colspan="2" style="padding: 12px;"><strong>Total</strong></td>
                  <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(booking.total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>👥 Guest List</h3>
            <table class="details-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Age</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                ${guestList}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>💳 Payment Details</h3>
            <table style="width: 100%;">
              <tr>
                <td><strong>Status:</strong></td>
                <td style="color: ${isPaid ? '#4caf50' : '#e65100'}; font-weight: bold;">${isPaid ? 'PAID ✓' : (isReserved ? 'ADVANCE RECEIVED' : 'UNPAID — PENDING')}</td>
              </tr>
              <tr><td><strong>Amount Paid:</strong></td><td style="text-align:right;">${formatCurrency(amountPaid)}</td></tr>
              <tr><td><strong>Remaining Due:</strong></td><td style="text-align:right;">${formatCurrency(remainingAmount)}</td></tr>
              ${isPaid ? `
              <tr><td><strong>Provider:</strong></td><td>${paymentMethod}</td></tr>
              ${booking.payment?.orderId ? `<tr><td><strong>Order ID:</strong></td><td>${booking.payment.orderId}</td></tr>` : ''}
              ${booking.payment?.paymentId ? `<tr><td><strong>Payment ID:</strong></td><td>${booking.payment.paymentId}</td></tr>` : ''}
              ` : `
              ${!isReserved ? `<tr><td><strong>Amount Due:</strong></td><td style="color: #e65100; font-weight: bold;">${formatCurrency(booking.total)}</td></tr>
              <tr><td colspan="2" style="padding-top: 8px;"><span style="background: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 4px; font-weight: bold;">⛔ Room NOT reserved — awaiting customer payment</span></td></tr>` : ''}
              `}
            </table>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna System" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: adminEmail,
    subject: `${isPaid ? '🔔' : '⚠️'} ${isPaid ? 'New Booking' : 'New Booking Request (Room NOT Reserved — Awaiting Payment)'}: ${user.name} - ${formatCurrency(booking.total)}`,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Booking notification sent to admin: ${adminEmail}`)
    return true
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return false
  }
}

// Send booking update notification to admin
export async function sendBookingUpdateNotificationToAdmin(booking, user, options = {}) {
  const transporter = getTransporter()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('Admin email not configured')
    return false
  }

  const changedFields = Array.isArray(options.changedFields) ? options.changedFields : []
  const actorName = options.actor?.name ? String(options.actor.name) : ''
  const actorRole = options.actor?.role ? String(options.actor.role) : ''

  const roomDetails = booking.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const amountPaid = Math.max(0, Number(booking.amountPaid || 0))
  const remainingAmount = Math.max(0, Number(booking.total || 0) - amountPaid)
  const paymentSummary = (amountPaid > 0 || remainingAmount > 0) ? `
    <div class="section">
      <h3>💳 Payment Summary</h3>
      <table style="width:100%;">
        <tr><td><strong>Amount Paid:</strong></td><td style="text-align:right;">${formatCurrency(amountPaid)}</td></tr>
        <tr><td><strong>Remaining Due:</strong></td><td style="text-align:right;">${formatCurrency(remainingAmount)}</td></tr>
      </table>
    </div>
  ` : ''

  const changedList = changedFields.length > 0
    ? `<p style="margin:6px 0 0 0;color:#0d47a1;font-size:13px;"><strong>Changed:</strong> ${changedFields.map(f => String(f).replace(/_/g, ' ')).join(', ')}</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #1e88e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 25px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th { background: #1e88e5; color: white; padding: 10px; text-align: left; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1e88e5; }
        .amount { font-size: 22px; color: #2e7d32; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">✏️ Booking Updated</h2>
          <p style="margin:6px 0 0 0;">A booking was edited by staff</p>
        </div>
        <div class="content">
          <div class="highlight">
            <table style="width:100%;">
              <tr>
                <td><strong>Booking ID:</strong> ${booking._id}</td>
                <td style="text-align:right;"><strong>Total:</strong> <span class="amount">${formatCurrency(booking.total)}</span></td>
              </tr>
            </table>
            <p style="margin:8px 0 0 0;color:#555;font-size:13px;">Edited by: <strong>${actorName || 'Staff'}</strong>${actorRole ? ` (${actorRole})` : ''}</p>
            ${changedList}
          </div>

          <div class="section">
            <h3>👤 Customer</h3>
            <table style="width:100%;">
              <tr><td><strong>Name:</strong></td><td>${user.name}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
              <tr><td><strong>Phone:</strong></td><td>${user.phone || 'Not provided'}</td></tr>
              <tr><td><strong>User ID:</strong></td><td>${user._id}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>📅 Stay</h3>
            <table style="width:100%;">
              <tr><td><strong>Check-in:</strong></td><td>${formatDate(booking.checkIn)}</td></tr>
              <tr><td><strong>Check-out:</strong></td><td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day'}</td></tr>
              <tr><td><strong>Duration:</strong></td><td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td></tr>
              <tr><td><strong>Status:</strong></td><td>${booking.status}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>🛏️ Rooms</h3>
            <table class="details-table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${roomDetails}
                ${booking.gstAmount > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">Subtotal</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee;">GST (${booking.gstPercentage}%)</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(booking.gstAmount)}</td>
                </tr>` : ''}
                <tr style="background:#f0f0f0;font-weight:bold;">
                  <td colspan="2" style="padding: 12px;"><strong>Total</strong></td>
                  <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(booking.total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          ${paymentSummary}
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna System" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: adminEmail,
    subject: `✏️ Booking Updated: ${user.name} - ${formatCurrency(booking.total)}`,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Booking update notification sent to admin: ${adminEmail}`)
    return true
  } catch (error) {
    console.error('Error sending admin booking update notification:', error)
    return false
  }
}

// Send password reset email
export async function sendPasswordResetEmail(user, resetToken) {
  const transporter = getTransporter()
  const resetUrl = `${process.env.CLIENT_ORIGIN}/auth/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .warning { background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Krishna</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>

          <p>Or copy and paste this link in your browser:</p>
          <p style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${resetUrl}</p>

          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin-bottom: 0;">
              <li>This link will expire in <strong>1 hour</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you create a new one</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply directly.</p>
          <p>© ${new Date().getFullYear()} Hotel Krishna. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: user.email,
    subject: '🔐 Password Reset - Hotel Krishna',
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${user.email}`)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

// Send booking cancellation notification to user
export async function sendCancellationToUser(booking, user) {
  const transporter = getTransporter()
  
  const roomDetails = booking.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e53935 0%, #c62828 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-id { background: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #e53935; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th { background: #e53935; color: white; padding: 12px; text-align: left; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .cancel-badge { display: inline-block; background: #e53935; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
        .refund-info { background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Krishna</h1>
          <p>Booking Cancellation</p>
        </div>
        <div class="content">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your booking has been <span class="cancel-badge">CANCELLED</span> by our staff.</p>
          
          <div class="booking-id">
            <p style="margin: 0; color: #666;">Cancelled Booking Reference</p>
            <h2 style="margin: 5px 0; color: #333;">${booking._id}</h2>
          </div>

          <h3>📅 Booking Details</h3>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td><strong>Check-in:</strong></td>
              <td>${formatDate(booking.checkIn)}</td>
            </tr>
            <tr>
              <td><strong>Check-out:</strong></td>
              <td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day Booking'}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td>
            </tr>
          </table>

          <h3>🛏️ Cancelled Rooms</h3>
          <table class="details-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${roomDetails}
              <tr style="background: #ffebee; font-weight: bold;">
                <td colspan="2" style="padding: 12px;">Total Amount</td>
                <td style="padding: 12px; text-align: right;">${formatCurrency(booking.total)}</td>
              </tr>
            </tbody>
          </table>

          <div class="refund-info">
            <strong>💰 Refund Information:</strong>
            <p style="margin: 10px 0 0 0;">If you have made any payment, please contact us at ${process.env.ADMIN_EMAIL || 'hotelkrishna@example.com'} for refund processing. Our team will assist you with the refund within 5-7 business days.</p>
          </div>

          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p><strong>Contact Us:</strong> ${process.env.ADMIN_EMAIL || 'hotelkrishna@example.com'}</p>
          <p>© ${new Date().getFullYear()} Hotel Krishna. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: user.email,
    subject: '❌ Booking Cancelled - Hotel Krishna',
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Cancellation email sent to user: ${user.email}`)
    return true
  } catch (error) {
    console.error('Error sending cancellation email to user:', error)
    return false
  }
}

// Send booking cancellation notification to admin
export async function sendCancellationToAdmin(booking, user, cancelledBy) {
  const transporter = getTransporter()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('Admin email not configured')
    return false
  }

  const roomDetails = booking.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #e53935; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 25px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th { background: #e53935; color: white; padding: 10px; text-align: left; }
        .highlight { background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #e53935; }
        .amount { font-size: 24px; color: #e53935; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚫 Booking Cancellation Alert</h2>
          <p>A booking has been cancelled</p>
        </div>
        <div class="content">
          <div class="highlight">
            <table style="width: 100%;">
              <tr>
                <td><strong>Booking ID:</strong> ${booking._id}</td>
                <td style="text-align: right;"><strong>Amount:</strong> <span class="amount">${formatCurrency(booking.total)}</span></td>
              </tr>
              <tr>
                <td colspan="2"><strong>Cancelled By:</strong> ${cancelledBy.name} (${cancelledBy.role})</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>👤 Customer Details</h3>
            <table style="width: 100%;">
              <tr><td><strong>Name:</strong></td><td>${user.name}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
              <tr><td><strong>Phone:</strong></td><td>${user.phone || 'Not provided'}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>📅 Booking Details</h3>
            <table style="width: 100%;">
              <tr><td><strong>Check-in:</strong></td><td>${formatDate(booking.checkIn)}</td></tr>
              <tr><td><strong>Check-out:</strong></td><td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day'}</td></tr>
              <tr><td><strong>Duration:</strong></td><td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td></tr>
              <tr><td><strong>Original Status:</strong></td><td>${booking.statusBeforeCancel || booking.status}</td></tr>
              <tr><td><strong>Cancellation Time:</strong></td><td>${new Date().toLocaleString('en-IN')}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>🛏️ Room Details</h3>
            <table class="details-table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${roomDetails}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>⚠️ Action Required</h3>
            <p>Please follow up with the customer regarding refund processing if any payment was made.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna System" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: adminEmail,
    subject: `🚫 Booking Cancelled - ${booking._id}`,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Cancellation notification sent to admin: ${adminEmail}`)
    return true
  } catch (error) {
    console.error('Error sending cancellation notification to admin:', error)
    return false
  }
}

// Send booking restoration (undo-cancellation) notification to user
export async function sendUndoCancellationToUser(booking, user, restoredBy) {
  const transporter = getTransporter()

  const roomDetails = (booking.items || []).map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const actorLine = restoredBy?.name
    ? `<p style="margin: 0; color: #666; font-size: 13px;">Restored by: <strong>${restoredBy.name}</strong> (${restoredBy.role || 'staff'})</p>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-id { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #2e7d32; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th { background: #2e7d32; color: white; padding: 12px; text-align: left; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .badge { display: inline-block; background: #2e7d32; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Krishna</h1>
          <p>Booking Restored</p>
        </div>
        <div class="content">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your booking has been <span class="badge">RESTORED</span> and is confirmed again.</p>
          ${actorLine}

          <div class="booking-id">
            <p style="margin: 0; color: #666;">Booking Reference</p>
            <h2 style="margin: 5px 0; color: #333;">${booking._id}</h2>
          </div>

          <h3>📅 Booking Details</h3>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td><strong>Check-in:</strong></td>
              <td>${formatDate(booking.checkIn)}</td>
            </tr>
            <tr>
              <td><strong>Check-out:</strong></td>
              <td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day Booking'}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td>
            </tr>
            <tr>
              <td><strong>Status:</strong></td>
              <td>${(booking.status || 'pending').toUpperCase()}</td>
            </tr>
          </table>

          <h3>🛏️ Rooms</h3>
          <table class="details-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${roomDetails}
              <tr style="background: #e8f5e9; font-weight: bold;">
                <td colspan="2" style="padding: 12px;">Total Amount</td>
                <td style="padding: 12px; text-align: right;">${formatCurrency(booking.total)}</td>
              </tr>
            </tbody>
          </table>

          <p>If you have any questions, please reply to this email or contact us at ${process.env.ADMIN_EMAIL || 'hotelkrishna@example.com'}.</p>
        </div>
        <div class="footer">
          <p><strong>Contact Us:</strong> ${process.env.ADMIN_EMAIL || 'hotelkrishna@example.com'}</p>
          <p>© ${new Date().getFullYear()} Hotel Krishna. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: user.email,
    subject: '✅ Booking Restored - Hotel Krishna',
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Undo-cancellation email sent to user: ${user.email}`)
    return true
  } catch (error) {
    console.error('Error sending undo-cancellation email to user:', error)
    return false
  }
}

// Send booking restoration (undo-cancellation) notification to admin
export async function sendUndoCancellationToAdmin(booking, user, restoredBy) {
  const transporter = getTransporter()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('Admin email not configured')
    return false
  }

  const roomDetails = (booking.items || []).map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #2e7d32; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 25px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th { background: #2e7d32; color: white; padding: 10px; text-align: left; }
        .highlight { background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #2e7d32; }
        .amount { font-size: 24px; color: #2e7d32; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ Booking Restoration Alert</h2>
          <p>A cancelled booking has been restored</p>
        </div>
        <div class="content">
          <div class="highlight">
            <table style="width: 100%;">
              <tr>
                <td><strong>Booking ID:</strong> ${booking._id}</td>
                <td style="text-align: right;"><strong>Amount:</strong> <span class="amount">${formatCurrency(booking.total)}</span></td>
              </tr>
              <tr>
                <td colspan="2"><strong>Restored By:</strong> ${(restoredBy?.name || 'Staff')} (${restoredBy?.role || 'staff'})</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Restored Status:</strong> ${(booking.status || 'pending').toUpperCase()}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>👤 Customer Details</h3>
            <table style="width: 100%;">
              <tr><td><strong>Name:</strong></td><td>${user.name}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
              <tr><td><strong>Phone:</strong></td><td>${user.phone || 'Not provided'}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>📅 Booking Details</h3>
            <table style="width: 100%;">
              <tr><td><strong>Check-in:</strong></td><td>${formatDate(booking.checkIn)}</td></tr>
              <tr><td><strong>Check-out:</strong></td><td>${booking.checkOut ? formatDate(booking.checkOut) : 'Full Day'}</td></tr>
              <tr><td><strong>Duration:</strong></td><td>${booking.nights} ${booking.fullDay ? 'Day(s)' : 'Night(s)'}</td></tr>
              <tr><td><strong>Restoration Time:</strong></td><td>${new Date().toLocaleString('en-IN')}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>🛏️ Room Details</h3>
            <table class="details-table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${roomDetails}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Hotel Krishna System" <${process.env.SMTP_USER || process.env.ADMIN_EMAIL}>`,
    to: adminEmail,
    subject: `✅ Booking Restored - ${booking._id}`,
    html
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Undo-cancellation notification sent to admin: ${adminEmail}`)
    return true
  } catch (error) {
    console.error('Error sending undo-cancellation notification to admin:', error)
    return false
  }
}
