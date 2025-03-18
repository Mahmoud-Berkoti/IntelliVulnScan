import { Router } from 'express';
import * as apiKeyController from '../controllers/apiKey.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All API key routes require authentication
router.use(authenticateToken);

// List API keys
router.get('/', apiKeyController.listApiKeys);

// Create API key
router.post('/', apiKeyController.createApiKey);

// Delete API key
router.delete('/:id', apiKeyController.deleteApiKey);

export default router; 