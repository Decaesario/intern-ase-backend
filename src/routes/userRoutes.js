import express from 'express';
import { getMe, updateProfile, getAllUsers, updateUserRole } from '../controllers/userController.js';
import { deleteMyAccount } from '../controllers/accountController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';
import { limitLengths } from '../middleware/validateLength.js';

const router = express.Router();

router.get('/me', verifyToken, getMe);
router.delete('/me', verifyToken, authorize('USER'), deleteMyAccount);
router.patch('/profile', verifyToken, limitLengths({ name: 191, profilePicture: 191 }), updateProfile);
router.get('/', verifyToken, authorize('ADMIN'), getAllUsers);
router.patch('/:id/role', verifyToken, authorize('ADMIN'), updateUserRole);

export default router;
