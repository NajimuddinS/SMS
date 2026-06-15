import { Request, Response } from 'express';
import { Student } from '../models/Student';

/**
 * GET /analytics
 * Computes dashboard statistics using MongoDB aggregation pipelines.
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalStudents = await Student.countDocuments();

    // Group students by course and count them
    const courseBreakdown = await Student.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Group students by year of study (1, 2, 3, 4)
    const yearBreakdown = await Student.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Group students by gender
    const genderBreakdown = await Student.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

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
