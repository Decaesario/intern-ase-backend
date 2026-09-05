import express from 'express';
import { getAdminDashboard } from '../controllers/dashboardController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', verifyToken, authorize('ADMIN'), getAdminDashboard);

export default router;
