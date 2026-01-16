import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import AdminLayout from '@/pages/admin/AdminLayout';
import CasesPage from '@/pages/admin/CasesPage';
import SolucoesPage from '@/pages/admin/SolucoesPage';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main App */}
        <Route path="/" element={<Index />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/cases" replace />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="solucoes" element={<SolucoesPage />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
