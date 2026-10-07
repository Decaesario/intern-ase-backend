import express from 'express';
import { getMe, updateProfile, getAllUsers, updateUserRole } from '../controllers/userController.js';
import { deleteMyAccount } from '../controllers/accountController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', verifyToken, getMe);
router.delete('/me', verifyToken, authorize('USER'), deleteMyAccount);
router.patch('/profile', verifyToken, updateProfile);
router.get('/', verifyToken, authorize('ADMIN'), getAllUsers);
router.patch('/:id/role', verifyToken, authorize('ADMIN'), updateUserRole);

export default router;
