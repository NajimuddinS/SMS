import { Schema, model, Document } from 'mongoose';
import { Counter } from './Counter';

export interface IStudent extends Document {
  admissionNumber: string;
  name: string;
  course: string;
  year: number;
  dateOfBirth: Date;
  email: string;
  mobileNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  photoUrl?: string;
  photoPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    admissionNumber: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      index: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Year of study is required'],
      min: [1, 'Year must be between 1 and 4'],
      max: [4, 'Year must be between 1 and 4'],
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
      index: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^\+?[0-9\s-]{8,15}$/, 'Please fill a valid mobile number'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender',
      },
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    photoPublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate unique auto-incremented Admission Number
StudentSchema.pre('save', async function (next) {
  const student = this;
  
  // Only generate admission number if it doesn't exist yet
  if (student.admissionNumber) {
    return next();
  }

  try {
    const currentYear = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { id: 'admissionNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const seqStr = String(counter.seq).padStart(4, '0');
    student.admissionNumber = `SMS-${currentYear}-${seqStr}`;
    next();
  } catch (error: any) {
    next(error);
  }
});

export const Student = model<IStudent>('Student', StudentSchema);
