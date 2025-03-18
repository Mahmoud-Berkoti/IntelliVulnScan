import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All settings routes require authentication
router.use(authenticateToken);

// Get user settings
router.get('/', settingsController.getUserSettings);

// Update user settings
router.put('/', settingsController.updateUserSettings);

export default router; 