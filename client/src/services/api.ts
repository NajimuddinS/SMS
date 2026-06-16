export interface Student {
  _id: string;
  admissionNumber: string;
  name: string;
  course: string;
  year: number;
  dateOfBirth: string;
  email: string;
  mobileNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  photoUrl: string;
  photoPublicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface CourseStat {
  _id: string;
  count: number;
}

export interface YearStat {
  _id: number;
  count: number;
}

export interface GenderStat {
  _id: string;
  count: number;
}

export interface AnalyticsData {
  totalStudents: number;
  courseBreakdown: CourseStat[];
  yearBreakdown: YearStat[];
  genderBreakdown: GenderStat[];
}

export interface PaginatedResult<T> {
  success: boolean;
  data: {
    students?: T[];
    logs?: T[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

/**
 * Custom fetch wrapper to handle JSON responses and errors, appending the auth token.
 */
const fetcher = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('sms_auth_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.error || `HTTP error! status: ${response.status}`);
  }
  
  return json as T;
};

export const api = {
  /**
   * Fetch all students with pagination, search and filtering
   */
  getStudents: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    course?: string;
    year?: number | '';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResult<Student>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.course) query.append('course', params.course);
    if (params.year) query.append('year', String(params.year));
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetcher<PaginatedResult<Student>>(`${API_BASE}/students?${query.toString()}`);
  },

  /**
   * Fetch a student by id
   */
  getStudentById: async (id: string): Promise<{ success: boolean; data: Student }> => {
    return fetcher<{ success: boolean; data: Student }>(`${API_BASE}/students/${id}`);
  },

  /**
   * Add a new student (using FormData for file upload)
   */
  createStudent: async (formData: FormData): Promise<{ success: boolean; data: Student }> => {
    return fetcher<{ success: boolean; data: Student }>(`${API_BASE}/students`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Update an existing student (using FormData)
   */
  updateStudent: async (id: string, formData: FormData): Promise<{ success: boolean; data: Student }> => {
    return fetcher<{ success: boolean; data: Student }>(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  /**
   * Delete a student
   */
  deleteStudent: async (id: string): Promise<{ success: boolean; message: string }> => {
    return fetcher<{ success: boolean; message: string }>(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch analytics data for the dashboard charts
   */
  getAnalytics: async (): Promise<{ success: boolean; data: AnalyticsData }> => {
    return fetcher<{ success: boolean; data: AnalyticsData }>(`${API_BASE}/analytics`);
  },

  /**
   * Fetch paginated activity logs
   */
  getActivityLogs: async (page: number = 1, limit: number = 15): Promise<PaginatedResult<ActivityLog>> => {
    return fetcher<PaginatedResult<ActivityLog>>(`${API_BASE}/logs?page=${page}&limit=${limit}`);
  },

  signup: async (data: any): Promise<AuthResponse> => {
    return fetcher<AuthResponse>(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: any): Promise<AuthResponse> => {
    return fetcher<AuthResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    return fetcher<{ success: boolean; data: User }>(`${API_BASE}/auth/me`);
  },
};
