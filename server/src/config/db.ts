import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

export const connectDB = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    console.log('Successfully connected to PostgreSQL Database');

    // Run schema creation DDL
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS admission_number_seq START WITH 1;

      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admission_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        course VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
        date_of_birth DATE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile_number VARCHAR(10) NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
        address TEXT NOT NULL,
        photo_url TEXT DEFAULT '',
        photo_public_id TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
      CREATE INDEX IF NOT EXISTS idx_students_course ON students(course);
      CREATE INDEX IF NOT EXISTS idx_students_year ON students(year);

      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        details TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
    `);
    console.log('Database tables verified/created successfully');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};
