import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_sementara');
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kadaluarsa' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Akun tidak aktif atau tidak ditemukan' });
    }

    req.user = { userId: decoded.userId, role: user.role };
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Belum login' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Kamu tidak punya akses untuk aksi ini' });
    }

    next();
  };
};
