import express from 'express';
import { getWasteTypes } from '../controllers/wasteTypeController.js';

const router = express.Router();

router.get('/', getWasteTypes);

export default router;
