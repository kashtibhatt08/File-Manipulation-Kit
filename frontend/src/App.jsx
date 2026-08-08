import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PDFTools from './pages/PDFTools';
import ImageTools from './pages/ImageTools';
import AudioTools from './pages/AudioTools';
import ZIPTools from './pages/ZIPTools';
import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <Register />
                </AuthLayout>
              }
            />

            {/* Dashboard and Toolkit Routes */}
            <Route
              path="/"
              element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/pdf"
              element={
                <DashboardLayout>
                  <PDFTools />
                </DashboardLayout>
              }
            />
            <Route
              path="/image"
              element={
                <DashboardLayout>
                  <ImageTools />
                </DashboardLayout>
              }
            />
            <Route
              path="/audio"
              element={
                <DashboardLayout>
                  <AudioTools />
                </DashboardLayout>
              }
            />
            <Route
              path="/zip"
              element={
                <DashboardLayout>
                  <ZIPTools />
                </DashboardLayout>
              }
            />

            {/* Protected User Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
