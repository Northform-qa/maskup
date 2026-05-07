import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import MobileNav from './components/MobileNav'
import DiscoverPage from './pages/DiscoverPage'
import DirectoryPage from './pages/DirectoryPage'
import FieldDetailPage from './pages/FieldDetailPage'
import OwnerRegistration from './pages/OwnerRegistration'
import AdminDashboard from './pages/AdminDashboard'
import OwnerDashboard from './pages/OwnerDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/field/:id" element={<FieldDetailPage />} />
        <Route path="/register" element={<OwnerRegistration />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
      </Routes>
      <MobileNav />
    </BrowserRouter>
  )
}
