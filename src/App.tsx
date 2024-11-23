import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Bans from './pages/Bans';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-white">
                      <Navbar />
                      <main className="flex-1 p-4 lg:p-8 ml-20 lg:ml-64">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/users" element={<Users />} />
                          <Route path="/projects" element={<Projects />} />
                          <Route path="/projects/:id" element={<ProjectDetails />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/bans" element={<Bans />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </main>
                    </div>
                  </PrivateRoute>
                }
              />
            </Routes>
          </ErrorBoundary>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;