import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/', authenticateToken, isAdmin, analyticsController.getAnalytics);

export default router;