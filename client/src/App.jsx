import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'

function ProtectedRoute({ children, requireRescueTeam = false }) {
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  if (requireRescueTeam && userType !== 'rescue_team') {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRescueTeam={true}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
