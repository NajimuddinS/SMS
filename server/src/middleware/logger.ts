import { Request } from 'express';
import { pool } from '../config/db';

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

    await pool.query(
      'INSERT INTO activity_logs (action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [action, details, ipAddress, userAgent]
    );
    
    console.log(`[ACTIVITY] ${action}: ${details}`);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
