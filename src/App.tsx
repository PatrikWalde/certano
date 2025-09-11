import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Pages
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ActivityPage from './pages/ActivityPage';
import ChaptersPage from './pages/ChaptersPage';
import ErrorReviewPage from './pages/ErrorReviewPage';
import LeaderboardPage from './pages/LeaderboardPage';
import UpgradePage from './pages/UpgradePage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineStatus from './components/OfflineStatus';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <OfflineStatus />
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/confirm" element={<EmailConfirmationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="activity" element={
                  <ProtectedRoute>
                    <ActivityPage />
                  </ProtectedRoute>
                } />
                <Route path="chapters" element={
                  <ProtectedRoute>
                    <ChaptersPage />
                  </ProtectedRoute>
                } />
                <Route path="errors" element={
                  <ProtectedRoute>
                    <ErrorReviewPage />
                  </ProtectedRoute>
                } />
                <Route path="leaderboard" element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                } />
                <Route path="upgrade" element={
                  <ProtectedRoute>
                    <UpgradePage />
                  </ProtectedRoute>
                } />
              </Route>
              </Routes>
              <PWAInstallPrompt />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
