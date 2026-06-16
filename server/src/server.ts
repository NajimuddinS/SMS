import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { connectDB } from './config/db';
import { upload } from './middleware/upload';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from './controllers/studentController';
import { getAnalytics } from './controllers/analyticsController';
import { getActivityLogs } from './controllers/logController';
import { authMiddleware } from './middleware/auth';
import { signup, login, getMe } from './controllers/authController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB database
connectDB();

// Create uploads directory if it doesn't exist (useful for local fallback)
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded assets
app.use('/uploads', express.static(uploadsDir));

// Auth Routes
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authMiddleware as any, getMe as any);

// API Routes (Protected)
app.get('/api/students', authMiddleware as any, getStudents);
app.get('/api/students/:id', authMiddleware as any, getStudentById);
app.post('/api/students', authMiddleware as any, upload.single('photo'), createStudent);
app.put('/api/students/:id', authMiddleware as any, upload.single('photo'), updateStudent);
app.delete('/api/students/:id', authMiddleware as any, deleteStudent);

app.get('/api/analytics', authMiddleware as any, getAnalytics);
app.get('/api/logs', authMiddleware as any, getActivityLogs);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', time: new Date() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in development mode on port ${PORT}`);
});
