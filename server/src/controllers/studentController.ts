import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { uploadPhoto, deletePhoto } from '../config/cloudinary';
import { logActivity } from '../middleware/logger';

// Helper for sending validation error messages
const sendValidationError = (res: Response, message: string) => {
  return res.status(400).json({ success: false, error: message });
};

/**
 * GET /students
 * Fetch all students with pagination, sorting, search, and filtering.
 */
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const course = (req.query.course as string) || '';
    const year = parseInt(req.query.year as string) || null;

    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

    // Build query filter object
    const filterQuery: any = {};

    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
      ];
    }

    if (course) {
      filterQuery.course = course;
    }

    if (year) {
      filterQuery.year = year;
    }

    // Run parallel count and query
    const [students, total] = await Promise.all([
      Student.find(filterQuery)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(filterQuery),
    ]);

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        students,
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

/**
 * GET /students/:id
 * Fetch single student details.
 */
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /students
 * Create a new student with photo upload.
 */
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, course, year, dateOfBirth, email, mobileNumber, gender, address } = req.body;

    // Validate inputs
    if (!name || !course || !year || !dateOfBirth || !email || !mobileNumber || !gender || !address) {
      sendValidationError(res, 'All fields are required.');
      return;
    }

    // Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      sendValidationError(res, 'Please enter a valid email address.');
      return;
    }

    // Mobile validation
    const mobileRegex = /^\+?[0-9\s-]{8,15}$/;
    if (!mobileRegex.test(mobileNumber)) {
      sendValidationError(res, 'Please enter a valid mobile number (8-15 digits).');
      return;
    }

    // Year validation
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      sendValidationError(res, 'Year must be a number between 1 and 4.');
      return;
    }

    // Check unique email
    const emailExists = await Student.findOne({ email });
    if (emailExists) {
      sendValidationError(res, 'A student with this email address already exists.');
      return;
    }

    let photoUrl = '';
    let photoPublicId = '';

    // Handle file upload
    if (req.file) {
      try {
        const uploadResult = await uploadPhoto(req.file.buffer, req.file.originalname);
        photoUrl = uploadResult.url;
        photoPublicId = uploadResult.publicId;
      } catch (err: any) {
        console.error('File upload failed:', err);
        res.status(500).json({ success: false, error: `Failed to upload student photo: ${err.message}` });
        return;
      }
    }

    const student = new Student({
      name,
      course,
      year: yearNum,
      dateOfBirth,
      email,
      mobileNumber,
      gender,
      address,
      photoUrl,
      photoPublicId,
    });

    await student.save();

    // Log this activity
    await logActivity(
      req,
      'CREATE_STUDENT',
      `Created student ${student.name} with Admission No: ${student.admissionNumber}`
    );

    res.status(201).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /students/:id
 * Update student details.
 */
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, course, year, dateOfBirth, email, mobileNumber, gender, address } = req.body;
    const studentId = req.params.id;

    // Find student first
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    // Validate inputs
    if (!name || !course || !year || !dateOfBirth || !email || !mobileNumber || !gender || !address) {
      sendValidationError(res, 'All fields are required.');
      return;
    }

    // Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      sendValidationError(res, 'Please enter a valid email address.');
      return;
    }

    // Mobile validation
    const mobileRegex = /^\+?[0-9\s-]{8,15}$/;
    if (!mobileRegex.test(mobileNumber)) {
      sendValidationError(res, 'Please enter a valid mobile number (8-15 digits).');
      return;
    }

    // Year validation
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      sendValidationError(res, 'Year must be a number between 1 and 4.');
      return;
    }

    // Check unique email (excluding current student)
    const emailExists = await Student.findOne({ email, _id: { $ne: studentId } });
    if (emailExists) {
      sendValidationError(res, 'Another student is already using this email address.');
      return;
    }

    let photoUrl = student.photoUrl || '';
    let photoPublicId = student.photoPublicId || '';

    // If new file is uploaded
    if (req.file) {
      try {
        // Upload new photo
        const uploadResult = await uploadPhoto(req.file.buffer, req.file.originalname);
        
        // Delete old photo if it exists
        if (student.photoPublicId) {
          await deletePhoto(student.photoPublicId);
        }

        photoUrl = uploadResult.url;
        photoPublicId = uploadResult.publicId;
      } catch (err: any) {
        console.error('File upload failed:', err);
        res.status(500).json({ success: false, error: `Failed to upload new student photo: ${err.message}` });
        return;
      }
    }

    // Update details
    student.name = name;
    student.course = course;
    student.year = yearNum;
    student.dateOfBirth = dateOfBirth;
    student.email = email;
    student.mobileNumber = mobileNumber;
    student.gender = gender;
    student.address = address;
    student.photoUrl = photoUrl;
    student.photoPublicId = photoPublicId;

    await student.save();

    // Log this activity
    await logActivity(
      req,
      'UPDATE_STUDENT',
      `Updated student ${student.name} (Admission No: ${student.admissionNumber})`
    );

    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /students/:id
 * Delete student record and their photo.
 */
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);

    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    // Delete photo from storage (Cloudinary or local)
    if (student.photoPublicId) {
      await deletePhoto(student.photoPublicId);
    }

    // Delete record from DB
    await Student.findByIdAndDelete(studentId);

    // Log this activity
    await logActivity(
      req,
      'DELETE_STUDENT',
      `Deleted student ${student.name} (Admission No: ${student.admissionNumber})`
    );

    res.status(200).json({ success: true, message: 'Student record deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
