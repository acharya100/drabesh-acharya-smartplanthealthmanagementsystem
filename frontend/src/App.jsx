import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Plants from "./pages/Plants";
import DiseaseDetection from "./pages/DiseaseDetection";
import Treatment from "./pages/Treatment";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("isAuthenticated");
  return isAuth ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

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
          path="/disease"
          element={
            <ProtectedRoute>
              <DiseaseDetection />
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;
