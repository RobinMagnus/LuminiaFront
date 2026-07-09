import React from 'react';
import { Navigate, RouterProvider, createBrowserRouter, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CheckSquare, FileText, Home, User } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import {
  TeacherActivities,
  TeacherActivityDetail,
  TeacherClassDetail,
  TeacherContentDetail,
  TeacherContentForm,
  TeacherContents,
  TeacherCorrection,
  TeacherCorrectionsClasses,
  TeacherCorrectionsList,
  TeacherCreateActivity,
  TeacherDashboard,
  TeacherProfile,
} from './components/TeacherScreens';
import {
  StudentActivities,
  StudentActivity,
  StudentContentDetail,
  StudentContents,
  StudentDashboard,
  StudentFeedbackView,
  StudentProfile,
} from './components/StudentScreens';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BackendRole, roleHomePath } from './services/authService';

const BottomNav = ({ role }: { role: 'teacher' | 'student' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const teacherTabs = [
    { id: 'home', icon: Home, label: 'Início', path: '/teacher' },
    { id: 'activities', icon: FileText, label: 'Atividades', path: '/teacher/activities' },
    { id: 'contents', icon: BookOpen, label: 'Conteúdos', path: '/teacher/contents' },
    { id: 'corrections', icon: CheckSquare, label: 'Correções', path: '/teacher/corrections' },
    { id: 'profile', icon: User, label: 'Perfil', path: '/teacher/profile' },
  ];

  const studentTabs = [
    { id: 'home', icon: Home, label: 'Início', path: '/student' },
    { id: 'content', icon: BookOpen, label: 'Conteúdos', path: '/student/contents' },
    { id: 'activities', icon: FileText, label: 'Atividades', path: '/student/activities' },
    { id: 'feedback', icon: Bell, label: 'Feedback', path: '/student/feedback' },
    { id: 'profile', icon: User, label: 'Perfil', path: '/student/profile' },
  ];

  const tabs = role === 'teacher' ? teacherTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 pb-safe pt-2" aria-label="Navegação principal">
      <div className="flex justify-between items-center max-w-md mx-auto h-14">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path || (tab.path !== `/${role}` && location.pathname.startsWith(tab.path));
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-w-14 gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <tab.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} aria-hidden="true" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-background p-6 flex items-center justify-center text-muted-foreground">
    Carregando...
  </div>
);

const ProtectedRoute = ({ role, children }: { role: BackendRole; children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return <>{children}</>;
};

const Layout = ({ role }: { role: 'teacher' | 'student' }) => (
  <div className="min-h-screen bg-background flex flex-col font-sans">
    <main className="flex-1 max-w-md mx-auto w-full p-6 pb-24">
      <Outlet />
    </main>
    <BottomNav role={role} />
  </div>
);

const router = createBrowserRouter([
  { path: '/', element: <LoginScreen /> },
  {
    path: '/teacher',
    element: (
      <ProtectedRoute role="professor">
        <Layout role="teacher" />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: 'activities', element: <TeacherActivities /> },
      { path: 'activity/:id', element: <TeacherActivityDetail /> },
      { path: 'create', element: <TeacherCreateActivity /> },
      { path: 'contents', element: <TeacherContents /> },
      { path: 'content/new', element: <TeacherContentForm /> },
      { path: 'content/:id', element: <TeacherContentDetail /> },
      { path: 'corrections', element: <TeacherCorrectionsClasses /> },
      { path: 'corrections/:classId', element: <TeacherCorrectionsList /> },
      { path: 'correction/:id', element: <TeacherCorrection /> },
      { path: 'profile', element: <TeacherProfile /> },
      { path: 'class/:classId', element: <TeacherClassDetail /> },
    ],
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute role="aluno">
        <Layout role="student" />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'contents', element: <StudentContents /> },
      { path: 'content/:id', element: <StudentContentDetail /> },
      { path: 'activities', element: <StudentActivities /> },
      { path: 'activity/:id', element: <StudentActivity /> },
      { path: 'feedback', element: <StudentFeedbackView /> },
      { path: 'profile', element: <StudentProfile /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
