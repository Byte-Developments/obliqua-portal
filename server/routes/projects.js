import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as projectController from '../controllers/projectController.js';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

// Project routes
router.get('/', authenticateToken, projectController.getAllProjects);
router.post('/', authenticateToken, projectController.createProject);
router.get('/:id', authenticateToken, projectController.getProject);
router.put('/:id', authenticateToken, projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);

// Project files
router.post('/:projectId/files', authenticateToken, projectController.uploadFile);
router.get('/:projectId/files', authenticateToken, projectController.getFiles);
router.delete('/:projectId/files/:fileId', authenticateToken, projectController.deleteFile);

// Chat routes
router.get('/:projectId/messages', authenticateToken, chatController.getMessages);
router.post('/:projectId/messages', authenticateToken, chatController.sendMessage);
router.delete('/:projectId/messages/:messageId', authenticateToken, chatController.deleteMessage);

export default router;