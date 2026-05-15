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
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CookiesPage from './pages/CookiesPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<><DiscoverPage /><DirectoryPage /></>} />
          <Route path="/field/:id" element={<FieldDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Owner registration — public, creates a new owner account */}
          <Route path="/register" element={<OwnerRegistration />} />

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
        <MobileNav />
      </AuthProvider>
    </BrowserRouter>
  )
}
