import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated, getRole } from '@/lib/auth'
import Login from '@/pages/Login'
import ApplicantView from '@/pages/ApplicantView'
import AuditorView from '@/pages/AuditorView'
import RegulatorView from '@/pages/RegulatorView'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({ children, allowedRole }) => {
  const auth = isAuthenticated()
  const role = getRole()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={`/${role}`} replace />
  }

  return <>{children}</>
}

// Root Redirect Component
const RootRedirect: React.FC = () => {
  const auth = isAuthenticated()
  const role = getRole()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={`/${role}`} replace />
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/applicant" 
          element={
            <ProtectedRoute allowedRole="applicant">
              <ApplicantView />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/auditor/*" 
          element={
            <ProtectedRoute allowedRole="auditor">
              <AuditorView />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/regulator/*" 
          element={
            <ProtectedRoute allowedRole="regulator">
              <RegulatorView />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
