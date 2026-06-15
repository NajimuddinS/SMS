import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { Student } from '../services/api';

import { X, UploadCloud, AlertCircle, Save } from 'lucide-react';

interface StudentFormModalProps {
  student: Student | null; // Null means create mode, otherwise edit mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const courses = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Data Science',
  'Cyber Security',
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [customCourseText, setCustomCourseText] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [address, setAddress] = useState('');

  // Image Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Pre-fill form if editing a student
  useEffect(() => {
    if (student) {
      setName(student.name);
      if (courses.includes(student.course)) {
        setCourse(student.course);
        setCustomCourseText('');
      } else {
        setCourse('Others');
        setCustomCourseText(student.course);
      }
      setYear(student.year);
      // Format Date of Birth to YYYY-MM-DD for date inputs
      setDateOfBirth(student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '');
      setEmail(student.email);
      setMobileNumber(student.mobileNumber);
      setGender(student.gender);
      setAddress(student.address);

      if (student.photoUrl) {
        // Resolve URL (handling local fallback URL)
        let resolvedUrl = student.photoUrl;
        if (resolvedUrl.startsWith('/uploads')) {
          const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
          resolvedUrl = `${apiBaseUrl.replace('/api', '')}${resolvedUrl}`;
        }
        setPhotoPreview(resolvedUrl);
      } else {
        setPhotoPreview('');
      }
    } else {
      // Clear fields for Add Mode
      setName('');
      setCourse('');
      setCustomCourseText('');
      setYear('');
      setDateOfBirth('');
      setEmail('');
      setMobileNumber('');
      setGender('');
      setAddress('');
      setPhotoFile(null);
      setPhotoPreview('');
    }
    setValidationErrors({});
    setServerError('');
  }, [student, isOpen]);

  if (!isOpen) return null;

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    // Validate image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, photo: 'Only JPEG, PNG, or WEBP images are allowed.' }));
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors((prev) => ({ ...prev, photo: 'File size must be less than 5MB.' }));
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full name is required.';
    else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';

    if (!course) {
      errors.course = 'Please select a course.';
    } else if (course === 'Others' && !customCourseText.trim()) {
      errors.course = 'Please specify your course name.';
    }

    if (!year) errors.year = 'Please select a year of study.';

    if (!dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
    else {
      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      if (dobDate >= today) errors.dateOfBirth = 'Date of birth must be in the past.';
      
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 5) errors.dateOfBirth = 'Student must be at least 5 years old.';
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email.trim()) errors.email = 'Email address is required.';
    else if (!emailRegex.test(email)) errors.email = 'Please enter a valid email format.';

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required.';
    else if (!mobileRegex.test(mobileNumber)) errors.mobileNumber = 'Mobile number must be exactly 10 digits.';

    if (!gender) errors.gender = 'Please select a gender.';

    if (!address.trim()) errors.address = 'Home address is required.';
    else if (address.trim().length < 5) errors.address = 'Address must be at least 5 characters.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    const formData = new FormData();
    formData.append('name', name.trim());
    const finalCourse = course === 'Others' ? customCourseText.trim() : course;
    formData.append('course', finalCourse);
    formData.append('year', String(year));
    formData.append('dateOfBirth', dateOfBirth);
    formData.append('email', email.trim().toLowerCase());
    formData.append('mobileNumber', mobileNumber.trim());
    formData.append('gender', gender);
    formData.append('address', address.trim());

    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      if (student) {
        // Edit mode
        const res = await api.updateStudent(student._id, formData);
        if (res.success) {
          onSuccess();
          onClose();
        }
      } else {
        // Create mode
        const res = await api.createStudent(formData);
        if (res.success) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while saving the record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50 transition-all duration-300">
      <div className="w-full max-w-xl glass-panel h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto duration-300 animate-slide-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-850">
              {student ? 'Edit Student Details' : 'Register New Student'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {student ? `Modify details for Admission: ${student.admissionNumber}` : 'Enter student info and drag a photo.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 py-6 flex flex-col gap-5 text-sm">
          {/* Server Error Notification */}
          {serverError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Drag & Drop Photo Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Profile Image</label>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              {photoPreview ? (
                <div className="flex items-center gap-4 w-full">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="text-xs font-semibold text-slate-700 block truncate">
                      {photoFile ? photoFile.name : 'Current student photo'}
                    </span>
                    <span className="text-[10px] text-indigo-650 font-semibold cursor-pointer hover:underline">
                      Click or drag to replace image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <UploadCloud className="text-slate-400" size={32} />
                  <p className="text-slate-700 font-medium text-xs">Drag & drop image or browse</p>
                  <p className="text-[10px] text-slate-450">Supports JPEG, PNG, WEBP up to 5MB</p>
                </div>
              )}
            </div>
            {validationErrors.photo && (
              <span className="text-rose-600 text-xs font-medium mt-1">{validationErrors.photo}</span>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800"
              />
              {validationErrors.name && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.name}</span>
              )}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@university.edu"
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800"
              />
              {validationErrors.email && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.email}</span>
              )}
            </div>

            {/* Course */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Department</label>
              <select
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  if (e.target.value !== 'Others') setCustomCourseText('');
                }}
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800 cursor-pointer"
              >
                <option value="" disabled>Select Department</option>
                {courses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Others">Others</option>
              </select>
              {validationErrors.course && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.course}</span>
              )}
            </div>

            {/* Custom Course Text Input */}
            {course === 'Others' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specify Course Name</label>
                <input
                  type="text"
                  value={customCourseText}
                  onChange={(e) => setCustomCourseText(e.target.value)}
                  placeholder="e.g. Aerospace Engineering"
                  className="py-2.5 px-3 glass-input rounded-xl text-slate-800"
                />
              </div>
            )}

            {/* Year of study */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year of Study</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800 cursor-pointer"
              >
                <option value="" disabled>Select Year</option>
                <option value={1}>Year 1 (Freshman)</option>
                <option value={2}>Year 2 (Sophomore)</option>
                <option value={3}>Year 3 (Junior)</option>
                <option value={4}>Year 4 (Senior)</option>
              </select>
              {validationErrors.year && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.year}</span>
              )}
            </div>

            {/* Mobile number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile Number</label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) {
                    setMobileNumber(val);
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 9876543210"
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800"
              />
              {validationErrors.mobileNumber && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.mobileNumber}</span>
              )}
            </div>

            {/* Date of birth */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800 cursor-pointer"
              />
              {validationErrors.dateOfBirth && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.dateOfBirth}</span>
              )}
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
              <div className="flex gap-4 mt-1">
                {['Male', 'Female', 'Other'].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g as any)}
                      className="w-4 h-4 text-indigo-650 bg-white border-slate-300"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
              {validationErrors.gender && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.gender}</span>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Residential Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, State, ZIP"
                rows={3}
                className="py-2.5 px-3 glass-input rounded-xl text-slate-800 resize-none"
              />
              {validationErrors.address && (
                <span className="text-rose-600 text-[11px] font-medium">{validationErrors.address}</span>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="border-t border-slate-200 pt-4 flex gap-3 justify-end text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving Record...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{student ? 'Update Changes' : 'Register Student'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
