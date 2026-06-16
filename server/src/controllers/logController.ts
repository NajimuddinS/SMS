import { Request, Response } from 'express';
import { pool } from '../config/db';

export const toCamelLog = (row: any) => {
  if (!row) return null;
  return {
    _id: row.id,
    action: row.action,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    timestamp: row.timestamp,
  };
};

/**
 * GET /logs
 * Retrieves activity logs, ordered newest first, with server-side pagination.
 */
export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const offset = (page - 1) * limit;

    const dataPromise = pool.query(
      'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countPromise = pool.query('SELECT COUNT(*)::int AS count FROM activity_logs');

    const [dataRes, countRes] = await Promise.all([dataPromise, countPromise]);

    const total = countRes.rows[0].count;
    const logs = dataRes.rows.map(toCamelLog);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        logs,
        total,
        page,
        pages,
        limit,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
