import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StudentList } from './components/StudentList';
import { StudentFormModal } from './components/StudentFormModal';
import { ActivityLogs } from './components/ActivityLogs';
import { AuthPage } from './components/AuthPage';
import { api } from './services/api';
import type { Student, User } from './services/api';


function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sms_auth_token'));
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Navigation & Modal State
  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'logs'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Data refresh synchronizer
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('sms_auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('sms_auth_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.data);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        handleLogout();
      } finally {
        setAuthLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  if (authLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#f4f6fa] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm font-semibold">Initializing secure session...</span>
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden bg-[#f4f6fa] text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Visual background ambient glow circles for premium styling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/8 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/8 blur-[120px] animate-pulse-slow"></div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onAddStudentClick={handleOpenAddStudent}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative z-10">
        {currentView === 'dashboard' && <AnalyticsDashboard refreshTrigger={refreshTrigger} />}
        
        {currentView === 'students' && (
          <StudentList
            onEditStudent={handleEditStudent}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        )}
        
        {currentView === 'logs' && <ActivityLogs />}
      </main>

      {/* Slide-over Registration & Edit Form Modal */}
      <StudentFormModal
        student={editingStudent}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStudent(null);
        }}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

export default App;
