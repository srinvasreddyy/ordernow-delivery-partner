import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import GlobalLoader from './components/ui/GlobalLoader';

const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

// Simple Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  // Check for token in cookies or local storage logic here
  const token = document.cookie.includes('token'); 
  // Note: For robust check use a context, this is simplified
  // If you used the AuthContext from admin, import and use it here.
  return token ? children : <Navigate to="/login" />; 
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;