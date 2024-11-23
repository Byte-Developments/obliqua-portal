import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;