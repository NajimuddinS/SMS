import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Student } from '../services/api';
import { StudentIdCardModal } from './StudentIdCardModal';
import { getPhotoUrl } from '../utils/url';

import { Search, Filter, Trash2, Edit2, Eye, ChevronLeft, ChevronRight, User, GraduationCap, Calendar, Phone, Mail, MapPin } from 'lucide-react';


interface StudentListProps {
  onEditStudent: (student: Student) => void;
  refreshTrigger: number;
  onRefresh: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  onEditStudent,
  refreshTrigger,
  onRefresh,
}) => {
  // State for data
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [searchDebounced, setSearchDebounced] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const limit = 8;

  // State for active delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // State for viewing student ID card
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Course options derived for filters (standard list, can expand based on DB too)
  const courseOptions = [
    'Computer Science',
    'Information Technology',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Business Administration',
    'Data Science',
    'Cyber Security',
  ];

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1); // reset to page 1 on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch student data from server
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        page,
        limit,
        search: searchDebounced,
        course,
        year,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data.students) {
        setStudents(res.data.students);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading students.');
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, course, year, sortBy, sortOrder]);

  // Trigger fetch on query param change or explicit refresh
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, refreshTrigger]);

  // Handle student record deletion
  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      const res = await api.deleteStudent(id);
      if (res.success) {
        setDeletingId(null);
        onRefresh(); // refresh data
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setDeleteLoading(false);
    }
  };



  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Student Directory</h2>
          <p className="text-slate-500 text-sm mt-1">Manage, filter, and modify enrolled student records.</p>
        </div>
        <div className="text-slate-500 text-xs font-semibold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Total Records: <span className="text-slate-800 font-bold">{total}</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, admission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm placeholder-slate-400"
          />
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Course filter */}
          <div className="relative flex-1 sm:flex-none">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select
              value={course}
              onChange={(e) => { setCourse(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2.5 w-full glass-input rounded-xl text-sm appearance-none cursor-pointer"
            >
              <option value="">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
          </div>

          {/* Year filter */}
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
              className="pl-9 pr-8 py-2.5 w-full glass-input rounded-xl text-sm appearance-none cursor-pointer"
            >
              <option value="">All Years</option>
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
          </div>
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-slate-500 text-sm font-medium">Updating catalog view...</span>
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center rounded-2xl border-red-100">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-100 text-slate-400 rounded-full border border-slate-200">
            <User size={32} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">No Students Found</h4>
            <p className="text-slate-500 text-xs mt-1">Try resetting your search query or directory filters.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Table for larger devices, Cards for smaller ones */}
          <div className="hidden lg:block glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('admissionNumber')}>
                    Admission No {sortBy === 'admissionNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('course')}>
                    Course {sortBy === 'course' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('year')}>
                    Year {sortBy === 'year' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-sm text-slate-650">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-all duration-150">
                    {/* Info */}
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 flex items-center justify-center font-bold">
                        {student.photoUrl ? (
                          <img
                            src={getPhotoUrl(student.photoUrl)}
                            alt={student.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = ''; // Clear source to trigger fallback icon
                            }}
                          />
                        ) : (
                          student.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 font-bold truncate leading-snug">{student.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Born {new Date(student.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                    </td>

                    {/* Admission Number */}
                    <td className="p-4 font-mono font-semibold text-slate-600 text-xs">
                      {student.admissionNumber}
                    </td>

                    {/* Course */}
                    <td className="p-4 text-xs font-semibold text-slate-700">
                      {student.course}
                    </td>

                    {/* Year */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100/50 rounded-lg text-xs font-bold text-indigo-600">
                        Year {student.year}
                      </span>
                    </td>

                    {/* Contact Details */}
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {student.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {student.mobileNumber}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="p-2 bg-indigo-50 hover:bg-slate-800 hover:border-slate-800 text-indigo-600 hover:text-white rounded-lg border border-indigo-100 transition-all cursor-pointer"
                          title="View ID Card"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-2 bg-indigo-50 hover:bg-slate-800 hover:border-slate-800 text-indigo-600 hover:text-white rounded-lg border border-indigo-100 transition-all cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setDeletingId(student._id); setDeletingName(student.name); }}
                          className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg border border-rose-100 transition-all cursor-pointer"
                          title="Drop Student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for mobile view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {students.map((student) => (
              <div key={student._id} className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 flex items-center justify-center font-bold text-lg">
                    {student.photoUrl ? (
                      <img
                        src={getPhotoUrl(student.photoUrl)}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                        }}
                      />
                    ) : (
                      student.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-extrabold">{student.name}</h4>
                    <span className="font-mono text-slate-400 text-xs font-semibold">{student.admissionNumber}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 text-xs text-slate-600">
                  <p className="flex items-center gap-2 text-slate-500"><GraduationCap size={14} /> {student.course} (Year {student.year})</p>
                  <p className="flex items-center gap-2 text-slate-500"><Mail size={14} /> {student.email}</p>
                  <p className="flex items-center gap-2 text-slate-500"><Phone size={14} /> {student.mobileNumber}</p>
                  <p className="flex items-center gap-2 text-slate-500"><MapPin size={14} /> {student.address}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex gap-2">
                  <button
                    onClick={() => setViewingStudent(student)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-slate-800 hover:border-slate-800 text-indigo-600 hover:text-white rounded-xl text-xs font-bold border border-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Eye size={12} /> ID Card
                  </button>
                  <button
                    onClick={() => onEditStudent(student)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-slate-800 hover:border-slate-800 text-indigo-600 hover:text-white rounded-xl text-xs font-bold border border-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => { setDeletingId(student._id); setDeletingName(student.name); }}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold border border-rose-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} /> Drop
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 px-2">
            <span className="text-xs text-slate-400 font-semibold">
              Showing page <span className="text-slate-800 font-bold">{page}</span> of <span className="text-slate-800 font-bold">{pages}</span>
            </span>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop Student Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-100 glow-indigo">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Drop Action</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to drop <span className="text-slate-800 font-bold">{deletingName}</span> from the Student Management System? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end text-sm">
              <button
                disabled={deleteLoading}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={() => deletingId && handleDelete(deletingId)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Dropping...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student ID Card Modal */}
      <StudentIdCardModal
        student={viewingStudent}
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
      />
    </div>
  );
};
