import { Request, Response } from 'express';
import prisma from '../db';

// Helper to safely parse JSON strings
const safeJsonParse = (jsonString: string | null): Record<string, any> => {
  if (!jsonString) return {};
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return {};
  }
};

export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const settings = await prisma.settings.findUnique({
      where: { 
        userId: userIdNum 
      },
    });

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    // Parse JSON strings to objects for the response
    const settingsWithParsedJsons = {
      ...settings,
      scanSettings: safeJsonParse(settings.scanSettings as string),
      uiSettings: safeJsonParse(settings.uiSettings as string),
      integrations: safeJsonParse(settings.integrations as string),
    };

    res.status(200).json({ settings: settingsWithParsedJsons });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const settingsData = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if settings exist
    const existingSettings = await prisma.settings.findUnique({
      where: { 
        userId: userIdNum 
      },
    });

    if (!existingSettings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    // Extract JSON fields before removing them from settingsData for update
    const { scanSettings, uiSettings, integrations, ...otherSettingsData } = settingsData;

    // Prepare update data
    const updateData: any = { ...otherSettingsData };

    // Handle JSON fields
    if (scanSettings !== undefined) {
      updateData.scanSettings = typeof scanSettings === 'string' 
        ? scanSettings 
        : JSON.stringify(scanSettings);
    }

    if (uiSettings !== undefined) {
      updateData.uiSettings = typeof uiSettings === 'string' 
        ? uiSettings 
        : JSON.stringify(uiSettings);
    }

    if (integrations !== undefined) {
      updateData.integrations = typeof integrations === 'string' 
        ? integrations 
        : JSON.stringify(integrations);
    }

    // Update settings
    const updatedSettings = await prisma.settings.update({
      where: { 
        userId: userIdNum 
      },
      data: updateData,
    });

    // Parse JSON strings for the response
    const settingsWithParsedJsons = {
      ...updatedSettings,
      scanSettings: safeJsonParse(updatedSettings.scanSettings as string),
      uiSettings: safeJsonParse(updatedSettings.uiSettings as string),
      integrations: safeJsonParse(updatedSettings.integrations as string),
    };

    res.status(200).json({ settings: settingsWithParsedJsons });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 