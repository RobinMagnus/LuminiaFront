import React from 'react';
import { Navigate, RouterProvider, createBrowserRouter, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CalendarDays, CheckSquare, FileText, Home, User } from 'lucide-react';
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
  TeacherSchedule,
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
import { ErrorState, LoadingState } from './components/feedback';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BackendRole, roleHomePath } from './services/authService';

const NAV_ITEMS = {
  teacher: [
    { id: 'home', icon: Home, label: 'Início', path: '/teacher' },
    { id: 'activities', icon: FileText, label: 'Atividades', path: '/teacher/activities' },
    { id: 'contents', icon: BookOpen, label: 'Conteúdos', path: '/teacher/contents' },
    { id: 'schedule', icon: CalendarDays, label: 'Agenda', path: '/teacher/schedule' },
    { id: 'corrections', icon: CheckSquare, label: 'Correções', path: '/teacher/corrections' },
    { id: 'profile', icon: User, label: 'Perfil', path: '/teacher/profile' },
  ],
  student: [
    { id: 'home', icon: Home, label: 'Início', path: '/student' },
    { id: 'content', icon: BookOpen, label: 'Conteúdos', path: '/student/contents' },
    { id: 'activities', icon: FileText, label: 'Atividades', path: '/student/activities' },
    { id: 'feedback', icon: Bell, label: 'Feedback', path: '/student/feedback' },
    { id: 'profile', icon: User, label: 'Perfil', path: '/student/profile' },
  ],
} as const;

const BottomNav = ({ role }: { role: 'teacher' | 'student' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = NAV_ITEMS[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 pb-safe pt-2 md:hidden" aria-label="Navegação principal">
      <div className="flex items-center h-14 gap-1 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path || (tab.path !== `/${role}` && location.pathname.startsWith(tab.path));
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center min-w-14 gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
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

const DesktopSidebar = ({ role }: { role: 'teacher' | 'student' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = NAV_ITEMS[role];
  const subtitle = role === 'teacher' ? 'Painel do professor' : 'Painel do aluno';

  return (
    <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-screen md:w-72 lg:w-80 border-r border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex w-full flex-col px-6 py-8 overflow-y-auto">
        <div className="mb-8 rounded-2xl border border-border bg-background p-4 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Luminia</p>
          <h1 className="text-xl font-semibold text-foreground">Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <nav className="space-y-2" aria-label="Navegação principal desktop">
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path || (tab.path !== `/${role}` && location.pathname.startsWith(tab.path));
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${isActive
                    ? 'border-primary/40 bg-primary-light text-primary'
                    : 'border-transparent bg-transparent text-foreground hover:border-border hover:bg-background'
                  }`}
              >
                <span className="flex items-center gap-3">
                  <tab.icon size={18} aria-hidden="true" />
                  <span className="font-medium">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

const DesktopTopbar = ({ role }: { role: 'teacher' | 'student' }) => {
  const location = useLocation();
  const { user } = useAuth();
  const roleLabel = role === 'teacher' ? 'Professor' : 'Aluno';
  const section = NAV_ITEMS[role].find(item => location.pathname === item.path || (item.path !== `/${role}` && location.pathname.startsWith(item.path)));

  return (
    <header className="hidden md:flex sticky top-0 z-20 h-20 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{roleLabel}</p>
        <h2 className="text-lg font-semibold text-foreground">{section?.label || 'Dashboard'}</h2>
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
        {user?.nome || roleLabel}
      </div>
    </header>
  );
};

export const LoadingScreen = () => (
  <div className="min-h-screen bg-background p-6 flex items-center justify-center text-muted-foreground">
    <LoadingState message="Carregando sessão..." />
  </div>
);

export const ProtectedRoute = ({ role, children }: { role: BackendRole; children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <ErrorState
            title="Acesso negado"
            message="Você não tem permissão para acessar esta área."
            status={403}
            onBack={() => navigate(roleHomePath(user.role), { replace: true })}
            backLabel="Ir para minha área"
            page
            focusOnMount
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const Layout = ({ role }: { role: 'teacher' | 'student' }) => (
  <div className="min-h-screen bg-background font-sans">
    <DesktopSidebar role={role} />
    <div className="min-h-screen md:pl-72 lg:pl-80">
      <DesktopTopbar role={role} />
      <main className="px-4 pb-24 pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-8 lg:px-10">
        <Outlet />
      </main>
      <BottomNav role={role} />
    </div>
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
      { path: 'schedule', element: <TeacherSchedule /> },
      { path: 'content/new', element: <TeacherContentForm /> },
      { path: 'content/:id/edit', element: <TeacherContentForm /> },
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
