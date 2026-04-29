import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./lib/auth"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import ApplicantView from "./pages/ApplicantView"
import AuditorView from "./pages/AuditorView"
import RegulatorView from "./pages/RegulatorView"
import { ProtectedRoute } from "./lib/auth"

const AppRoutes: React.FC = () => {
  const { role, isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<Layout />}>
        <Route
          path="/applicant/*"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditor/*"
          element={
            <ProtectedRoute allowedRoles={["auditor"]}>
              <AuditorView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/regulator/*"
          element={
            <ProtectedRoute allowedRoles={["regulator"]}>
              <RegulatorView />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={`/${role}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
