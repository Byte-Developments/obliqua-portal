import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as clientController from '../controllers/clientController.js';

const router = express.Router();

router.get('/', authenticateToken, clientController.getAllClients);
router.get('/:id', authenticateToken, clientController.getClient);

export default router;