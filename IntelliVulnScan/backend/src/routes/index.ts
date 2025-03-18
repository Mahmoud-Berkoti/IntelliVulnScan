import express from 'express';
import authRoutes from './auth.routes';
import settingsRoutes from './settings.routes';
import reportsRoutes from './reports.routes';
import apiKeyRoutes from './apiKey.routes';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Register routes
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportsRoutes);
router.use('/api-keys', apiKeyRoutes);

export default router; 