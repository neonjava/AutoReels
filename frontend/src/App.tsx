import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import AdminLayout from './layouts/AdminLayout'
import SubmitterLayout from './layouts/SubmitterLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import PlatformsPage from './pages/PlatformsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import SubmitPage from './pages/SubmitPage'
import MyUploadsPage from './pages/MyUploadsPage'

function Protected({
  children,
  role,
}: {
  children: React.ReactNode
  role?: 'admin' | 'submitter'
}) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-[var(--muted)]">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/' : '/submit'} replace />
  }
  return children
}

export default function App() {
  useTheme()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/platforms" element={<PlatformsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route
        element={
          <Protected role="submitter">
            <SubmitterLayout />
          </Protected>
        }
      >
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/my-uploads" element={<MyUploadsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
