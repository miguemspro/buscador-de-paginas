import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/Admin/ProtectedRoute';
import Index from '@/pages/Index';
import AdminLayout from '@/pages/admin/AdminLayout';
import CasesPage from '@/pages/admin/CasesPage';
import SolucoesPage from '@/pages/admin/SolucoesPage';
import LoginPage from '@/pages/admin/LoginPage';
import { MetricsDashboard } from '@/components/Dashboard/MetricsDashboard';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App */}
          <Route path="/" element={<Index />} />
          
          {/* Dashboard de Métricas */}
          <Route path="/dashboard" element={<MetricsDashboard />} />
          
          {/* Admin Login */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/cases" replace />} />
            <Route path="cases" element={<CasesPage />} />
            <Route path="solucoes" element={<SolucoesPage />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
