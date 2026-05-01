const config = require('../config');

async function sendMail({ to, subject, html, text }) {
  if (!config.smtp.pass) {
    console.warn('[mailer] API Key not set — emails will be logged to console only.');
    console.log('[mailer:dev]', { to, subject });
    return { accepted: [to], messageId: 'dev' };
  }

  let senderName = 'Attendance';
  let senderEmail = config.smtp.user || 'no-reply@example.com';
  
  if (config.smtp.from) {
    const fromMatch = config.smtp.from.match(/(.*)<(.*)>/);
    if (fromMatch) {
      senderName = fromMatch[1].trim().replace(/^"|"$/g, '').trim() || senderName;
      senderEmail = fromMatch[2].trim() || senderEmail;
    } else {
      senderEmail = config.smtp.from.trim();
    }
  }

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: subject,
    };
    if (html) payload.htmlContent = html;
    if (text) payload.textContent = text;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': config.smtp.pass,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Brevo API Error: ${data.message || JSON.stringify(data)}`);
    }
    return data;
  } catch (error) {
    console.error('[mailer] Error sending email:', error.message);
    throw error;
  }
}

async function sendApprovalEmail({ to, firstName, mobile, password }) {
  const subject = 'Your attendance account has been approved';
  const html = `
    <p>Hi ${firstName},</p>
    <p>Your employee account has been <b>approved</b>. You can now sign in to the Attendance app.</p>
    <p><b>Mobile:</b> ${mobile}<br/>
       <b>Temporary password:</b> <code>${password}</code></p>
    <p>For security, you will be asked to change your password on first login.</p>
    <p>— Attendance Team</p>
  `;
  return sendMail({ to, subject, html, text: `Mobile: ${mobile}\nPassword: ${password}` });
}

async function sendRejectionEmail({ to, firstName, reason }) {
  const subject = 'Your attendance account request was not approved';
  const html = `
    <p>Hi ${firstName},</p>
    <p>Unfortunately, your registration request was not approved.</p>
    ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
    <p>Please contact your administrator if you believe this is a mistake.</p>
  `;
  return sendMail({ to, subject, html });
}

module.exports = { sendMail, sendApprovalEmail, sendRejectionEmail };
