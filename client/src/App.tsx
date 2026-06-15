import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StudentList } from './components/StudentList';
import { StudentFormModal } from './components/StudentFormModal';
import { ActivityLogs } from './components/ActivityLogs';
import type { Student } from './services/api';


function App() {
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

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Visual background ambient glow circles for premium styling */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onAddStudentClick={handleOpenAddStudent}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative z-10">
        {currentView === 'dashboard' && <AnalyticsDashboard />}
        
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
