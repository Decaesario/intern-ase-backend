import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { isMailConfigured, sendResetPasswordEmail } from '../utils/mailer.js';

const RESET_TOKEN_TTL_MINUTES = 15;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email wajib diisi' });
    }

    const genericMessage = 'Jika email terdaftar, tautan reset kata sandi akan dikirim';

    const user = await prisma.user.findUnique({ where: { email: String(email).trim() } });

    if (!user || !user.isActive) {
      return res.json({ message: genericMessage });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: hashToken(token), resetTokenExpiry: expiry },
    });

    // Kirim tautan reset lewat email. Kalau gagal, jangan bocorkan ke user
    // (supaya email yang terdaftar tidak bisa ditebak), cukup catat di log server.
    if (isMailConfigured()) {
      try {
        await sendResetPasswordEmail({
          to: user.email,
          name: user.name,
          token,
          ttlMinutes: RESET_TOKEN_TTL_MINUTES,
        });
      } catch (mailError) {
        console.error('Gagal mengirim email reset password:', mailError.message);
      }
    }

    // Di luar production, token juga dikembalikan di respons untuk keperluan test (Postman).
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ message: genericMessage, resetToken: token, expiresAt: expiry });
    }

    res.json({ message: genericMessage });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token dan kata sandi baru wajib diisi' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Kata sandi baru minimal 8 karakter' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: hashToken(String(token)),
        resetTokenExpiry: { gt: new Date() },
        isActive: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Kata sandi berhasil diubah, silakan login dengan kata sandi baru' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
