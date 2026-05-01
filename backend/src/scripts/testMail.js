/* eslint-disable no-console */
require('dotenv').config();
const nodemailer = require('nodemailer');
const config = require('../config');

(async () => {
  console.log('[test] SMTP config:', {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    user: config.smtp.user,
    from: config.smtp.from,
  });

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });

  try {
    await transporter.verify();
    console.log('[test] ✅ SMTP connection verified successfully');

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: config.smtp.user,   // send test email to self
      subject: 'Ziya Traders — Brevo SMTP Test',
      html: '<h2>✅ Brevo email is working!</h2><p>This is a test email from the Ziya Traders attendance system.</p>',
      text: 'Brevo email is working! This is a test email from the Ziya Traders attendance system.',
    });

    console.log('[test] ✅ Email sent! MessageId:', info.messageId);
    console.log('[test] Accepted:', info.accepted);
  } catch (err) {
    console.error('[test] ❌ Failed:', err.message);
    process.exitCode = 1;
  }
})();
