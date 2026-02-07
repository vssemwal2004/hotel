import nodemailer from 'nodemailer'

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
    }
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-id { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
        .total-row { background: #f0f0f0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .success-badge { display: inline-block; background: #4caf50; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Krishna</h1>
          <p>Booking Confirmation</p>
        </div>
        <div class="content">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Thank you for choosing Hotel Krishna! Your booking has been <span class="success-badge">CONFIRMED</span></p>
          
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
              <tr class="total-row">
                <td colspan="2" style="padding: 12px;"><strong>Total Amount</strong></td>
                <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(booking.total)}</strong></td>
              </tr>
            </tbody>
          </table>

          <h3>💳 Payment Details</h3>
          <table style="width: 100%;">
            <tr>
              <td><strong>Payment Status:</strong></td>
              <td style="color: #4caf50; font-weight: bold;">PAID ✓</td>
            </tr>
            <tr>
              <td><strong>Payment ID:</strong></td>
              <td>${booking.payment?.paymentId || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Payment Method:</strong></td>
              <td>Razorpay (Online)</td>
            </tr>
          </table>

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
    subject: `✅ Booking Confirmed - ${booking._id}`,
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #2196f3; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 25px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th { background: #2196f3; color: white; padding: 10px; text-align: left; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; }
        .amount { font-size: 24px; color: #4caf50; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 New Booking Alert</h2>
          <p>A new room booking has been confirmed</p>
        </div>
        <div class="content">
          <div class="highlight">
            <table style="width: 100%;">
              <tr>
                <td><strong>Booking ID:</strong> ${booking._id}</td>
                <td style="text-align: right;"><strong>Total:</strong> <span class="amount">${formatCurrency(booking.total)}</span></td>
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
              <tr><td><strong>Status:</strong></td><td style="color: #4caf50; font-weight: bold;">PAID ✓</td></tr>
              <tr><td><strong>Provider:</strong></td><td>Razorpay</td></tr>
              <tr><td><strong>Order ID:</strong></td><td>${booking.payment?.orderId || 'N/A'}</td></tr>
              <tr><td><strong>Payment ID:</strong></td><td>${booking.payment?.paymentId || 'N/A'}</td></tr>
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
    subject: `🔔 New Booking: ${user.name} - ${formatCurrency(booking.total)}`,
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
