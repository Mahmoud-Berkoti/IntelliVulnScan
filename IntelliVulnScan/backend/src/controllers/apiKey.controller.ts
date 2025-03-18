import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../db';

// Generate a random API key
const generateApiKey = (): string => {
  return `key_${crypto.randomBytes(16).toString('hex')}`;
};

export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: userIdNum,
      },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
        expiresAt: true,
        lastUsed: true,
      },
    });

    res.status(200).json({ apiKeys });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, expiresInDays = 365 } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!name) {
      return res.status(400).json({ message: 'API key name is required' });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Generate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Generate unique API key
    const key = generateApiKey();

    // Create the API key
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId: userIdNum,
        expiresAt,
      },
    });

    res.status(201).json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      },
      message: 'API key created successfully',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const keyId = parseInt(id, 10);
    if (isNaN(keyId)) {
      return res.status(400).json({ message: 'Invalid API key ID' });
    }

    // Check if the API key exists and belongs to the user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: userIdNum,
      },
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: {
        id: keyId,
      },
    });

    res.status(200).json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateApiKeyUsage = async (keyString: string): Promise<boolean> => {
  try {
    // Find the API key
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: keyString,
      },
    });

    if (!apiKey) {
      return false;
    }

    // Update the last used timestamp for the API key
    const updatedKey = await prisma.apiKey.update({
      where: {
        id: apiKey.id,
      },
      data: {
        lastUsed: new Date(),
      },
    });

    return !!updatedKey;
  } catch (error) {
    console.error('Update API key usage error:', error);
    return false;
  }
}; 