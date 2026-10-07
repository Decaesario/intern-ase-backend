import express from 'express';
import { getAdminDashboard, getUserDashboard } from '../controllers/dashboardController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', verifyToken, authorize('ADMIN'), getAdminDashboard);
router.get('/user', verifyToken, authorize('USER'), getUserDashboard);

export default router;
