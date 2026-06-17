import { useState, useEffect } from 'react';
import { Save, Lock, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../api/auth';
import { getUsers, getRoles, UserConfig, RoleConfig } from '../../api/config';

const tabs = ['General', 'Seguridad', 'Permisos'];

function GeneralTab() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    nombreCompleto: user?.name || '',
    email: user?.email || '',
    telefono: '+57 310 123 4567', // Hardcoded as DB doesn't have it yet
    departamento: 'Administración de Compras',
    empresa: 'JustTime Consulting Group',
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, nombreCompleto: user.name || '', email: user.email }));
    }
  }, [user]);

  const setField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#1A1F36] mb-5">Información Personal</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Nombre Completo</label>
            <input
              value={form.nombreCompleto}
              onChange={e => setField('nombreCompleto', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Teléfono</label>
            <input
              value={form.telefono}
              onChange={e => setField('telefono', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Departamento</label>
            <input
              disabled
              value={form.departamento}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Empresa</label>
            <input
              disabled
              value={form.empresa}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#B0003A] rounded-lg hover:bg-[#B0003A]/90 transition-colors">
            <Save size={16} />
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1A1F36] mb-4">Idioma y Zona Horaria</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">Idioma</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]">
                <option>Español (Colombia)</option>
                <option>Inglés</option>
                <option>Portugués</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">Zona Horaria</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]">
                <option>GMT -5 (Bogotá)</option>
                <option>GMT -4 (Caracas)</option>
                <option>GMT -3 (Buenos Aires)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeguridadTab() {
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwords, setPasswords] = useState({
    actual: '',
    nueva: '',
    confirmacion: '',
  });

  const setField = (field: string, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await changePassword(passwords.actual, passwords.nueva);
      setSuccess('Contraseña actualizada correctamente');
      setPasswords({ actual: '', nueva: '', confirmacion: '' });
    } catch (err: any) {
      setError(err.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#1A1F36] mb-5">Cambiar Contraseña</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>}
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={passwords.actual}
                onChange={e => setField('actual', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={passwords.nueva}
                onChange={e => setField('nueva', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={passwords.confirmacion}
              onChange={e => setField('confirmacion', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
            />
          </div>
          <button
            type="submit"
            disabled={!passwords.actual || !passwords.nueva || passwords.nueva !== passwords.confirmacion || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#B0003A] rounded-lg hover:bg-[#B0003A]/90 transition-colors disabled:bg-[#B0003A]/40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Actualizar Contraseña
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1A1F36] mb-4">Sesiones Activas</h3>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Chrome en Windows</p>
                  <p className="text-xs text-gray-400">Última actividad hace 5 minutos</p>
                </div>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">Activa</span>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Safari en iOS</p>
                  <p className="text-xs text-gray-400">Última actividad hace 2 horas</p>
                </div>
                <button className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermisosTab() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, usersData] = await Promise.all([getRoles(), getUsers()]);
        setRoles(rolesData);
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching config data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
        No tienes permisos para ver esta sección. Solo los Administradores pueden gestionar roles y usuarios.
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-[#B0003A]" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#1A1F36] mb-5 flex items-center gap-2">
          <Users size={20} />
          Roles y Permisos
        </h3>
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#B0003A]/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1F36]">{role.nombre}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{role.descripcion}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permisos.map(perm => (
                  <span key={perm} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#1A1F36] mb-4">Usuarios del Sistema</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActivo = !u.deletedAt;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{u.name}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${isActivo
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                        }`}>
                        {isActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-[#B0003A] hover:underline font-medium disabled:opacity-50" disabled>Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1F36]">Configuraciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panel de administración principal del sistema.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === i
                  ? 'text-[#B0003A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#B0003A]'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 && <GeneralTab />}
      {activeTab === 1 && <SeguridadTab />}
      {activeTab === 2 && <PermisosTab />}
    </div>
  );
}
