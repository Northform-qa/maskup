import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import NavBar from './components/NavBar'
import MobileNav from './components/MobileNav'
import ProtectedRoute from './components/ProtectedRoute'
import DiscoverPage from './pages/DiscoverPage'
import DirectoryPage from './pages/DirectoryPage'
import FieldDetailPage from './pages/FieldDetailPage'
import OwnerRegistration from './pages/OwnerRegistration'
import AdminDashboard from './pages/AdminDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import EditListingPage from './pages/EditListingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CookiesPage from './pages/CookiesPage'
import AboutPage from './pages/AboutPage'
import PlayerProfilePage from './pages/PlayerProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="md:h-screen md:overflow-hidden md:flex md:flex-col">
        <NavBar />
        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto">
        <Routes>
          {/* Public */}
          <Route path="/" element={<><DiscoverPage /><DirectoryPage /></>} />
          <Route path="/field/:id" element={<FieldDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Owner registration — public, creates a new owner account */}
          <Route path="/register" element={<OwnerRegistration />} />

          {/* Profile */}
          <Route path="/profile" element={<PlayerProfilePage />} />

          {/* About */}
          <Route path="/about" element={<AboutPage />} />

          {/* Legal */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />

          {/* Owner only */}
          <Route
            path="/owner-dashboard"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-dashboard/edit"
            element={
              <ProtectedRoute requiredRole="owner">
                <EditListingPage />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
        </div>
        <MobileNav />
        </div>

      </AuthProvider>
    </BrowserRouter>
  )
}
