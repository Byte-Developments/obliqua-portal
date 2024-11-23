import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import * as banController from '../controllers/banController.js';

const router = express.Router();

router.post('/users/:userId', authenticateToken, isAdmin, banController.banUser);
router.post('/ips', authenticateToken, isAdmin, banController.banIp);
router.get('/users', authenticateToken, isAdmin, banController.getUserBans);
router.get('/ips', authenticateToken, isAdmin, banController.getIpBans);
router.delete('/users/:userId', authenticateToken, isAdmin, banController.unbanUser);
router.delete('/ips/:banId', authenticateToken, isAdmin, banController.unbanIp);

export default router;