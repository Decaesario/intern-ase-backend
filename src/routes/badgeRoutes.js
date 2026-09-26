import express from 'express';
import {
  createBadge,
  getAllBadges,
  getMyBadges,
  deleteBadge,
} from '../controllers/badgeController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllBadges);
router.post('/', verifyToken, authorize('ADMIN'), createBadge);
router.delete('/:id', verifyToken, authorize('ADMIN'), deleteBadge);
router.get('/me', verifyToken, getMyBadges);

export default router;
