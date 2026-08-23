const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendBookingEmail(toEmail, userName, booking, qrDataUrl) {
  const subject = `Your Booking Confirmed — ${booking.reference}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1a1a2e">Booking Confirmed!</h2>
      <p>Hi ${userName},</p>
      <p>Your booking <strong>${booking.reference}</strong> is confirmed.</p>
      <p>Show this QR code at the venue:</p>
      <img src="${qrDataUrl}" alt="QR Code" style="width:200px;height:200px" />
      <p>Enjoy the show!</p>
      <hr/>
      <small style="color:#888">Ticket Booking System</small>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('\n===== [DEV EMAIL] =====');
    console.log(`TO: ${toEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`Booking Reference: ${booking.reference}`);
    console.log(`QR generated — ${qrDataUrl.slice(0, 60)}...`);
    console.log('========================\n');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject,
    html,
    attachments: [{
      filename: `ticket-${booking.reference}.png`,
      path: qrDataUrl,
    }],
  });
}

async function sendWaitlistOfferEmail(toEmail, userName, eventTitle, offerExpiresAt) {
  const subject = `A seat is available — Act fast!`;
  const body = `Hi ${userName},\n\nA seat in your waitlisted category for "${eventTitle}" is now available.\n\nLog in and go to your waitlist to complete your booking.\n\nThis offer expires at: ${new Date(offerExpiresAt).toLocaleString()}\n\nTicket Booking System`;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('\n===== [DEV WAITLIST EMAIL] =====');
    console.log(`TO: ${toEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(body);
    console.log('================================\n');
    return;
  }
  await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to: toEmail, subject, text: body });
}

module.exports = { sendBookingEmail, sendWaitlistOfferEmail };