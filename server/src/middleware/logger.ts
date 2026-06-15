import { Request } from 'express';
import { ActivityLog } from '../models/ActivityLog';

/**
 * Utility to log administrative actions (CREATE, UPDATE, DELETE) to the database.
 */
export const logActivity = async (
  req: Request,
  action: string,
  details: string
): Promise<void> => {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    await ActivityLog.create({
      action,
      details,
      ipAddress,
      userAgent,
    });
    
    console.log(`[ACTIVITY] ${action}: ${details}`);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
