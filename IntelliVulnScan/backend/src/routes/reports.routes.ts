import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/reports - Get all reports
router.get('/', (req, res) => {
  // This is a placeholder until we implement the controller
  res.status(200).json({ message: 'List of reports will be implemented soon' });
});

// GET /api/reports/:id - Get a specific report
router.get('/:id', (req, res) => {
  // This is a placeholder until we implement the controller
  res.status(200).json({ message: `Report ${req.params.id} details will be implemented soon` });
});

export default router; 