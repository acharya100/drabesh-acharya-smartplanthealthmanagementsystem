/**
 * Main Application Routing Component
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Plants from "./pages/Plants";
import DiseaseDetection from "./pages/DiseaseDetection";
import Diseases from "./pages/Diseases";
import Treatment from "./pages/Treatment";
import Settings from "./pages/Settings";
import History from "./pages/History";
import { useEffect } from "react";
import "./App.css";

/**
 * Protected Route Wrapper
 * 
 * A security guard component that checks if the user is logged in.
 * If they are authenticated, it lets them through to the child component.
 * If not, it politely redirects them back to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem("isAuthenticated");
  return isAuth ? children : <Navigate to="/" />;
};

const App = () => {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/plants"
          element={
            <ProtectedRoute>
              <Plants />
            </ProtectedRoute>
          }
        />

        <Route
          path="/diseases"
          element={
            <ProtectedRoute>
              <Diseases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/disease"
          element={
            <ProtectedRoute>
              <DiseaseDetection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/treatment"
          element={
            <ProtectedRoute>
              <Treatment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
