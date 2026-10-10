import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { forgotPassword, resetPassword } from '../controllers/resetPasswordController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { limitLengths } from '../middleware/validateLength.js';

const router = express.Router();

router.post('/register', limitLengths({ name: 191, email: 191 }), register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
