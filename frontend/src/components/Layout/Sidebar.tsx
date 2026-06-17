import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyPermission } from '../../utils/permissions';

const navItems = [
  { to: '/inicio', icon: Home, label: 'Inicio', permissions: [] },
  { to: '/gestor-anticipos', icon: FileText, label: 'Gestor de Anticipos', permissions: ['read:anticipo'] },
  { to: '/legalizacion-viaticos', icon: Receipt, label: 'Legalizacion de Viaticos', permissions: ['read:legalizacion', 'read:viatico'] },
  { to: '/registro-gastos', icon: CreditCard, label: 'Registro de Gastos', permissions: ['read:gasto'] },
  { to: '/configuraciones', icon: Settings, label: 'Configuraciones', permissions: ['read:user'] },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const { user, logout } = useAuth();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const visibleItems = navItems.filter(
    item => item.permissions.length === 0 || hasAnyPermission(user, item.permissions)
  );

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} min-h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300 relative`}>
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'} border-b border-gray-100 transition-all`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-8 h-8 shrink-0">
            <circle cx="16" cy="16" r="16" fill="#B0003A"/>
            <text x="16" y="21" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="white" textAnchor="middle">cos</text>
          </svg>
          {!isCollapsed && (
            <span className="text-lg leading-none transition-opacity duration-300 whitespace-nowrap font-normal">
              <span className="text-[#B0003A] font-light tracking-tight">ceres</span><span className="text-[#B0003A] font-bold">cos</span>
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-gray-50">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#B0003A] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#1A1F36]'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate transition-opacity duration-300">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center py-4' : 'p-4'}`}>
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-[#1A1F36] truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={isCollapsed ? 'Cerrar Sesion' : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5 w-full'} rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all`}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Cerrar Sesion</span>}
        </button>

        {!isCollapsed && (
          <div className="mt-4 px-2 text-center">
            <p className="text-[10px] text-gray-400">
              Copyright 2025 Ceresco
            </p>
            <p className="text-[10px] text-[#B0003A] mt-1 cursor-pointer hover:underline">
              Politica de Privacidad
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
