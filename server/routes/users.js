import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Admin routes
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);
router.post('/', authenticateToken, isAdmin, userController.createUser);
router.put('/:id', authenticateToken, isAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

// User settings routes
router.get('/settings', authenticateToken, userController.getUserSettings);
router.put('/settings', authenticateToken, userController.updateUserSettings);
router.post('/avatar', authenticateToken, userController.uploadAvatar);
router.get('/:userId/avatar', userController.getAvatarUrl);

export default router;