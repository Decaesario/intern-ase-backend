import express from 'express';
import { getMe, getAllUsers, updateUserRole } from '../controllers/userController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', verifyToken, getMe);
router.get('/', verifyToken, authorize('SUPER_ADMIN'), getAllUsers);
router.patch('/:id/role', verifyToken, authorize('SUPER_ADMIN'), updateUserRole);

export default router;
