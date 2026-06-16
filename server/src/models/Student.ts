export interface Student {
  _id: string; // maps to Postgres id (UUID)
  admissionNumber: string;
  name: string;
  course: string;
  year: number;
  dateOfBirth: Date | string;
  email: string;
  mobileNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  photoUrl?: string;
  photoPublicId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
