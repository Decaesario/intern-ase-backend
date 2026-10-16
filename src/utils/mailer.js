import nodemailer from 'nodemailer';

// Penyedia email, dipilih otomatis dari .env:
// 1) Resend (HTTPS, port 443)  -> kalau RESEND_API_KEY diisi
// 2) SMTP (mis. Gmail)         -> kalau SMTP_HOST, SMTP_USER, SMTP_PASS diisi
const useResend = () => Boolean(process.env.RESEND_API_KEY);
const useSmtp = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const isMailConfigured = () => useResend() || useSmtp();

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const buildResetEmail = ({ name, token, ttlMinutes }) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const link = `${frontendUrl}/reset-password?token=${token}`;

  return {
    subject: 'Reset Kata Sandi OceanGuard',
    text:
      `Halo ${name},\n\n` +
      `Kami menerima permintaan reset kata sandi untuk akun OceanGuard kamu.\n` +
      `Buka tautan berikut untuk membuat kata sandi baru (berlaku ${ttlMinutes} menit):\n${link}\n\n` +
      `Kalau kamu tidak merasa memintanya, abaikan email ini.`,
    html:
      `<p>Halo ${escapeHtml(name)},</p>` +
      `<p>Kami menerima permintaan reset kata sandi untuk akun OceanGuard kamu.</p>` +
      `<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#0b7285;color:#fff;border-radius:6px;text-decoration:none">Atur Kata Sandi Baru</a></p>` +
      `<p>Tautan berlaku ${ttlMinutes} menit. Kalau tombol tidak berfungsi, salin alamat ini ke browser:<br>${link}</p>` +
      `<p>Kalau kamu tidak merasa memintanya, abaikan email ini.</p>`,
  };
};

const sendViaResend = async ({ to, subject, text, html }) => {
  const from = process.env.RESEND_FROM || 'OceanGuard <onboarding@resend.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.message || JSON.stringify(body);
    } catch (e) {
      detail = response.statusText;
    }
    throw new Error(`Resend ${response.status}: ${detail}`);
  }
};

const sendViaSmtp = async ({ to, subject, text, html }) => {
  const port = Number(process.env.SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.MAIL_FROM || `OceanGuard <${process.env.SMTP_USER}>`;
  await transporter.sendMail({ from, to, subject, text, html });
};

export const sendResetPasswordEmail = async ({ to, name, token, ttlMinutes }) => {
  const message = { to, ...buildResetEmail({ name, token, ttlMinutes }) };
  if (useResend()) return sendViaResend(message);
  return sendViaSmtp(message);
};
