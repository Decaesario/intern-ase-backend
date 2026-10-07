import express from 'express';
import {
  createChallenge,
  getAllChallenges,
  getMyChallenges,
  deleteChallenge,
} from '../controllers/challengeController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllChallenges);
router.get('/me', verifyToken, authorize('USER'), getMyChallenges);
router.post('/', verifyToken, authorize('ADMIN'), createChallenge);
router.delete('/:id', verifyToken, authorize('ADMIN'), deleteChallenge);

export default router;
