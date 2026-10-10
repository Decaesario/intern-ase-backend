import express from 'express';
import {
  createChallenge,
  getAllChallenges,
  getMyChallenges,
  deleteChallenge,
} from '../controllers/challengeController.js';
import { runChallengeReminders } from '../controllers/challengeReminderController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';
import { adminOrCron } from '../middleware/cronAuth.js';
import { limitLengths } from '../middleware/validateLength.js';

const router = express.Router();

router.get('/', getAllChallenges);
router.get('/me', verifyToken, authorize('USER'), getMyChallenges);
router.get('/reminders', adminOrCron, runChallengeReminders);
router.post('/reminders', adminOrCron, runChallengeReminders);
router.post('/', verifyToken, authorize('ADMIN'), limitLengths({ name: 191, description: 191 }), createChallenge);
router.delete('/:id', verifyToken, authorize('ADMIN'), deleteChallenge);

export default router;
