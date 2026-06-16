import { Request, Response } from 'express';
import { pool } from '../config/db';

/**
 * GET /analytics
 * Computes dashboard statistics using optimized SQL GROUP BY queries.
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM students');
    const totalStudents = totalResult.rows[0].count;

    // Group students by course and count them
    const courseResult = await pool.query(`
      SELECT course AS "_id", COUNT(*)::int AS count
      FROM students
      GROUP BY course
      ORDER BY count DESC
    `);
    const courseBreakdown = courseResult.rows;

    // Group students by year of study (1, 2, 3, 4)
    const yearResult = await pool.query(`
      SELECT year AS "_id", COUNT(*)::int AS count
      FROM students
      GROUP BY year
      ORDER BY year ASC
    `);
    const yearBreakdown = yearResult.rows;

    // Group students by gender
    const genderResult = await pool.query(`
      SELECT gender AS "_id", COUNT(*)::int AS count
      FROM students
      GROUP BY gender
      ORDER BY count DESC
    `);
    const genderBreakdown = genderResult.rows;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        courseBreakdown,
        yearBreakdown,
        genderBreakdown,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
