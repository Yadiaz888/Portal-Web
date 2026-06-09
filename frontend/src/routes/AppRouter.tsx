import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import HomePage from '../pages/Home/HomePage';
import AnticiposPage from '../pages/Anticipos/AnticiposPage';
import AnticipoDetallePage from '../pages/Anticipos/AnticipoDetallePage';
import LegalizacionPage from '../pages/Legalizacion/LegalizacionPage';
import LegalizacionDetalle from '../pages/Legalizacion/LegalizacionDetalle';
import GastosPage from '../pages/Facturas/GastosPage';
import ConfiguracionesPage from '../pages/Configuraciones/ConfiguracionesPage';
import LoginPage from '../pages/Auth/LoginPage';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8450A]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<HomePage />} />
          <Route path="gestor-anticipos" element={<AnticiposPage />} />
          <Route path="gestor-anticipos/:id" element={<AnticipoDetallePage />} />
          <Route path="legalizacion-viaticos" element={<LegalizacionPage />} />
          <Route path="legalizacion-viaticos/:id" element={<LegalizacionDetalle />} />
          <Route path="registro-gastos" element={<GastosPage />} />
          <Route path="registro-facturas" element={<Navigate to="/registro-gastos" replace />} />
          <Route path="configuraciones" element={<ConfiguracionesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

