import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './components/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { UsersPage } from './components/dashboard/users/UsersPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AgendamentosPage } from './components/dashboard/agendamentos/AgendamentosPage';
import { FeriadosPage } from './components/dashboard/feriados/FeriadosPage';
import { ProconsPage } from './components/dashboard/procons/ProconsPage';
import { AuditPage } from './components/dashboard/audit/AuditPage';
import { PerguntasPage } from './components/dashboard/perguntas/PerguntasPage';

// Componente que contém as rotas e usa os toasts
function AppRoutes() {

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agendamentos"
          element={
            <ProtectedRoute>
              <AgendamentosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feriados"
          element={
            <ProtectedRoute>
              <FeriadosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/procons"
          element={
            <ProtectedRoute>
              <ProconsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/auditoria"
          element={
            <ProtectedRoute>
              <AuditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perguntas"
          element={
            <ProtectedRoute>
              <PerguntasPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

// Componente principal
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;