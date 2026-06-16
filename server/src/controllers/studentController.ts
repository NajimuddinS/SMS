import { Request, Response } from 'express';
import { pool } from '../config/db';
import { uploadPhoto, deletePhoto } from '../config/cloudinary';
import { logActivity } from '../middleware/logger';

// Helper for sending validation error messages
const sendValidationError = (res: Response, message: string) => {
  return res.status(400).json({ success: false, error: message });
};

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to map DB row to client-compatible Student interface
export const toCamel = (row: any) => {
  if (!row) return null;
  return {
    _id: row.id,
    admissionNumber: row.admission_number,
    name: row.name,
    course: row.course,
    year: row.year,
    dateOfBirth: row.date_of_birth,
    email: row.email,
    mobileNumber: row.mobile_number,
    gender: row.gender,
    address: row.address,
    photoUrl: row.photo_url || '',
    photoPublicId: row.photo_public_id || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'ASC' : 'DESC';

    const sortMap: Record<string, string> = {
      name: 'name',
      email: 'email',
      admissionNumber: 'admission_number',
      course: 'course',
      year: 'year',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
    const sortColumn = sortMap[sortBy] || 'created_at';

    // Build dynamic query filters
    const queryParts: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      queryParts.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR admission_number ILIKE $${paramIndex} OR course ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (course) {
      queryParts.push(`course = $${paramIndex}`);
      queryParams.push(course);
      paramIndex++;
    }

    if (year) {
      queryParts.push(`year = $${paramIndex}`);
      queryParams.push(year);
      paramIndex++;
    }

    const whereClause = queryParts.length > 0 ? `WHERE ${queryParts.join(' AND ')}` : '';

    const dataQuery = `
      SELECT * FROM students
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS count FROM students
      ${whereClause}
    `;

    const [studentsRes, countRes] = await Promise.all([
      pool.query(dataQuery, [...queryParams, limit, skip]),
      pool.query(countQuery, queryParams),
    ]);

    const total = countRes.rows[0].count;
    const students = studentsRes.rows.map(toCamel);
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
    const studentId = req.params.id as string;

    if (!uuidRegex.test(studentId)) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    res.status(200).json({ success: true, data: toCamel(result.rows[0]) });
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
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      sendValidationError(res, 'Please enter a valid 10-digit mobile number.');
      return;
    }

    // Year validation
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      sendValidationError(res, 'Year must be a number between 1 and 4.');
      return;
    }

    // Check unique email
    const emailCheck = await pool.query('SELECT id FROM students WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
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

    // Generate admission number using database sequence
    const currentYear = new Date().getFullYear();
    const seqResult = await pool.query("SELECT nextval('admission_number_seq') AS seq");
    const seq = seqResult.rows[0].seq;
    const seqStr = String(seq).padStart(4, '0');
    const admissionNumber = `SMS-${currentYear}-${seqStr}`;

    const insertQuery = `
      INSERT INTO students (
        admission_number, name, course, year, date_of_birth, email, mobile_number, gender, address, photo_url, photo_public_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      admissionNumber,
      name,
      course,
      yearNum,
      dateOfBirth,
      email,
      mobileNumber,
      gender,
      address,
      photoUrl,
      photoPublicId,
    ]);

    const student = toCamel(result.rows[0]);

    // Log this activity
    await logActivity(
      req,
      'CREATE_STUDENT',
      `Created student ${student!.name} with Admission No: ${student!.admissionNumber}`
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
    const studentId = req.params.id as string;

    if (!uuidRegex.test(studentId)) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    // Find student first
    const studentRes = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    const student = studentRes.rows[0];

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
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      sendValidationError(res, 'Please enter a valid 10-digit mobile number.');
      return;
    }

    // Year validation
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      sendValidationError(res, 'Year must be a number between 1 and 4.');
      return;
    }

    // Check unique email (excluding current student)
    const emailCheck = await pool.query(
      'SELECT id FROM students WHERE email = $1 AND id <> $2',
      [email, studentId]
    );
    if (emailCheck.rows.length > 0) {
      sendValidationError(res, 'Another student is already using this email address.');
      return;
    }

    let photoUrl = student.photo_url || '';
    let photoPublicId = student.photo_public_id || '';

    // If new file is uploaded
    if (req.file) {
      try {
        // Upload new photo
        const uploadResult = await uploadPhoto(req.file.buffer, req.file.originalname);
        
        // Delete old photo if it exists
        if (student.photo_public_id) {
          await deletePhoto(student.photo_public_id);
        }

        photoUrl = uploadResult.url;
        photoPublicId = uploadResult.publicId;
      } catch (err: any) {
        console.error('File upload failed:', err);
        res.status(500).json({ success: false, error: `Failed to upload new student photo: ${err.message}` });
        return;
      }
    }

    // Update details in DB
    const updateQuery = `
      UPDATE students SET
        name = $1,
        course = $2,
        year = $3,
        date_of_birth = $4,
        email = $5,
        mobile_number = $6,
        gender = $7,
        address = $8,
        photo_url = $9,
        photo_public_id = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name,
      course,
      yearNum,
      dateOfBirth,
      email,
      mobileNumber,
      gender,
      address,
      photoUrl,
      photoPublicId,
      studentId,
    ]);

    const updatedStudent = toCamel(result.rows[0]);

    // Log this activity
    await logActivity(
      req,
      'UPDATE_STUDENT',
      `Updated student ${updatedStudent!.name} (Admission No: ${updatedStudent!.admissionNumber})`
    );

    res.status(200).json({ success: true, data: updatedStudent });
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
    const studentId = req.params.id as string;

    if (!uuidRegex.test(studentId)) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    const studentRes = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    const student = studentRes.rows[0];

    // Delete photo from storage (Cloudinary or local)
    if (student.photo_public_id) {
      await deletePhoto(student.photo_public_id);
    }

    // Delete record from DB
    await pool.query('DELETE FROM students WHERE id = $1', [studentId]);

    // Log this activity
    await logActivity(
      req,
      'DELETE_STUDENT',
      `Deleted student ${student.name} (Admission No: ${student.admission_number})`
    );

    res.status(200).json({ success: true, message: 'Student record deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
