import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { updateApiKeyUsage } from '../controllers/apiKey.controller';

// Extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: number;
        userId: number;
        name: string;
      };
    }
  }
}

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ message: 'API key is required' });
  }

  try {
    // Find the API key in the database
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!key) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    // Check if the key has expired
    if (key.expiresAt < new Date()) {
      return res.status(401).json({ message: 'API key has expired' });
    }

    // Update last used timestamp
    await updateApiKeyUsage(apiKey);

    // Add API key info to request
    req.apiKey = {
      id: key.id,
      userId: key.userId,
      name: key.name,
    };

    // Also add user info
    req.user = {
      userId: key.userId.toString(),
      email: key.user.email,
      role: key.user.role,
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
}; 