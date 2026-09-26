import express from 'express';
import {
  createChallenge,
  getAllChallenges,
  deleteChallenge,
  joinChallenge,
  getMyChallengeProgress,
} from '../controllers/challengeController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllChallenges);
router.post('/', verifyToken, authorize('ADMIN'), createChallenge);
router.delete('/:id', verifyToken, authorize('ADMIN'), deleteChallenge);
router.post('/:id/join', verifyToken, joinChallenge);
router.get('/me/progress', verifyToken, getMyChallengeProgress);

export default router;
