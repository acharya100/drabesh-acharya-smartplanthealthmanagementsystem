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
import TreatmentHistory from "./pages/TreatmentHistory";
import AdminPanel from "./pages/AdminPanel";
import Ecommerce from "./pages/Ecommerce";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Chat from "./pages/Chat";
import SoilAnalysis from "./pages/SoilAnalysis";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { OfflineSyncProvider } from "./context/OfflineSyncContext";

import { useEffect, useState } from "react";
import "./App.css";

/**
 * Protected Route Wrapper
 */
const ProtectedRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem("isAuthenticated");
  return isAuth ? children : <Navigate to="/" />;
};

// Admin-only route: must be authenticated AND be staff/superuser
const AdminRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem("isAuthenticated");
  const isStaff = sessionStorage.getItem("isStaff") === "true";
  const isSuperuser = sessionStorage.getItem("isSuperuser") === "true";
  if (!isAuth) return <Navigate to="/" />;
  if (!isStaff && !isSuperuser) return <Navigate to="/dashboard" />;
  return children;
};

/**
 * Global Error Boundary
 */
import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong.</h2>
          <p style={{ color: '#64748b', marginTop: '1rem' }}>We encountered an unexpected error. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#1a4d2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <OfflineSyncProvider>
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                {/* ... routes ... */}
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/plants" element={<ProtectedRoute><Plants /></ProtectedRoute>} />
                <Route path="/disease" element={<ProtectedRoute><DiseaseDetection /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/treatment" element={<Treatment />} />
                <Route path="/treatment-history" element={<ProtectedRoute><TreatmentHistory /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/diseases" element={<Diseases />} />

                {/* Marketplace & Soil */}
                <Route path="/store" element={<Ecommerce />} />
                <Route path="/store/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/soil" element={<ProtectedRoute><SoilAnalysis /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin-panel" element={<AdminRoute><AdminPanel /></AdminRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </OfflineSyncProvider>
  );
};

export default App;
