import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { MyWoundsPage } from './pages/patient/MyWoundsPage';
import { WoundDetailPage } from './pages/patient/WoundDetailPage';
import { CapturePage } from './pages/patient/CapturePage';
import { AnalysisResultPage } from './pages/patient/AnalysisResultPage';
import { ProgressPage } from './pages/patient/ProgressPage';
import { CompareImagesPage } from './pages/patient/CompareImagesPage';
import { DoctorsSharingPage } from './pages/patient/DoctorsSharingPage';
import { ReportsPage } from './pages/patient/ReportsPage';
import { ProfilePage } from './pages/patient/ProfilePage';
import { SettingsPage } from './pages/patient/SettingsPage';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage';
import { DoctorReviewPage } from './pages/doctor/DoctorReviewPage';
import { ModelValidationPage } from './pages/doctor/ModelValidationPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'patient' | 'doctor' }> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-3 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export const App: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Root Redirection */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace />
          ) : (
            <Navigate to="/landing" replace />
          )
        }
      />

      {/* Patient Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wounds"
        element={
          <ProtectedRoute>
            <MyWoundsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wounds/:id"
        element={
          <ProtectedRoute>
            <WoundDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/capture"
        element={
          <ProtectedRoute>
            <CapturePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis-result"
        element={
          <ProtectedRoute>
            <AnalysisResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compare"
        element={
          <ProtectedRoute>
            <CompareImagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <ProtectedRoute>
            <DoctorsSharingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback for old notifications path */}
      <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />

      {/* Doctor Routes */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorPatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/review/:woundId"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/evaluation"
        element={
          <ProtectedRoute requiredRole="doctor">
            <ModelValidationPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
