import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Version Demo
      </span>

      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-90 select-none"
        >
          <div className="w-9 h-9 rounded-full bg-[#E8450A] flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1A1F36] leading-tight">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-gray-500 leading-tight">{user?.role || 'Rol'}</p>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
            <div className="px-4 py-2 border-b border-gray-50 sm:hidden">
              <p className="text-sm font-bold text-[#1A1F36]">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'Rol'}</p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                notify('El perfil de usuario se habilitará en configuración.', 'info');
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium"
            >
              <User size={15} className="text-gray-400" />
              Mi Perfil
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/configuraciones');
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium"
            >
              <Settings size={15} className="text-gray-400" />
              Configuracion
            </button>

            <hr className="my-1 border-gray-100" />

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
                notify('Sesión cerrada correctamente.', 'success');
                navigate('/login');
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
            >
              <LogOut size={15} className="text-red-400" />
              Cerrar Sesion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
