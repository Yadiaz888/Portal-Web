import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Receipt,
  Users,
  Download,
  FileCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../../components/UI/StatCard';
import CircularProgress from '../../components/UI/CircularProgress';
import Modal from '../../components/UI/Modal';
import { getDashboardHome, DashboardHome } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getLegalizaciones } from '../../api/legalizacion';
import StatusBadge from '../../components/UI/StatusBadge';
import { Legalizacion } from '../../models/Legalizacion';

const emptyDashboard: DashboardHome = {
  stats: {
    total: 0,
    approved: 0,
    rejected: 0,
  },
  chartData: [],
  activities: [],
  myRequests: [],
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const [legalizarModal, setLegalizarModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [legalizaciones, setLegalizaciones] = useState<Legalizacion[]>([]);
  const [mostrarMas, setMostrarMas] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardHome>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDashboardHome();
        if (isMounted) setDashboard(data);
      } catch (err: any) {
        if (isMounted) {
          setDashboard(emptyDashboard);
          setError(err.response?.data?.error || err.message || 'No fue posible cargar el inicio.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedActivities = mostrarMas ? dashboard.activities : dashboard.activities.slice(0, 3);
  const chartData = dashboard.chartData.length > 0
    ? dashboard.chartData
    : [{ mes: 'Sin datos', Solicitudes: 0, Aprobaciones: 0 }];

  const openLegalizarModal = async () => {
    setBusqueda('');
    setErrorBusqueda('');
    setLegalizarModal(true);

    try {
      const data = await getLegalizaciones();
      setLegalizaciones(data);
    } catch {
      setErrorBusqueda('No fue posible cargar las solicitudes para legalizar.');
    }
  };

  const handleBuscarLegalizacion = () => {
    if (!busqueda.trim()) {
      setErrorBusqueda('Por favor, ingresa un número de solicitud.');
      return;
    }

    const cleanSearch = busqueda.replace(/n(?:Â°|°|o|\.)/i, '').trim();
    const match = legalizaciones.find(item => {
      const cleanSol = item.nSolicitud.replace(/n(?:Â°|°|o|\.)/i, '').trim();
      return cleanSol === cleanSearch || item.id === cleanSearch;
    });

    if (!match) {
      setErrorBusqueda('La solicitud ingresada no existe o no fue encontrada.');
      return;
    }

    const solId = match.nSolicitud.replace(/n(?:Â°|°|o|\.)/i, '').trim();
    setErrorBusqueda('');
    setLegalizarModal(false);
    navigate(`/legalizacion-viaticos/${solId}?mode=edit`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1F36]">
          Bienvenida {user?.name || user?.email || ''}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Panel para cargar y gestionar anticipos</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Acciones Rapidas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: 'Solicitar Anticipo', action: () => navigate('/gestor-anticipos?tab=solicitar') },
                { icon: Receipt, label: 'Legalizar pagos', action: openLegalizarModal },
                { icon: Users, label: 'Gestionar proveedor', action: () => {} },
                { icon: Download, label: 'Descargar Informe', action: () => notify('El informe se está preparando para descarga.', 'info') },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-[#B0003A]/30 hover:bg-orange-50/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-[#B0003A]/10 flex items-center justify-center transition-colors">
                    <Icon size={20} className="text-[#1A1F36] group-hover:text-[#B0003A] transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Ultima actividad
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <p className="text-sm text-gray-500">Cargando actividad...</p>
              ) : displayedActivities.length === 0 ? (
                <p className="text-sm text-gray-500">Aun no hay actividad registrada.</p>
              ) : (
                displayedActivities.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#B0003A] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-medium">{item.label}</p>
                    </div>
                    <CircularProgress percentage={item.percent} size={40} />
                  </div>
                ))
              )}
            </div>
            {dashboard.activities.length > 3 && (
              <button
                className="mt-3 text-sm text-[#B0003A] font-medium hover:underline"
                onClick={() => setMostrarMas(!mostrarMas)}
              >
                {mostrarMas ? 'Ver menos' : 'Ver mas'}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Estado de mis solicitudes
            </h2>
            <div className="space-y-3">
              <StatCard icon={<FileCheck size={22} />} label="Solicitudes Radicadas" value={isLoading ? '...' : dashboard.stats.total} variant="default" />
              <StatCard icon={<FileCheck size={22} />} label="Solicitudes Aprobadas" value={isLoading ? '...' : dashboard.stats.approved} variant="success" />
              <StatCard icon={<FileCheck size={22} />} label="Solicitudes Rechazadas" value={isLoading ? '...' : dashboard.stats.rejected} variant="danger" />
            </div>
            {!isLoading && (
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mis solicitudes recientes</p>
                {dashboard.myRequests.slice(0, 5).map(request => (
                  <button
                    key={`${request.entity}-${request.id}`}
                    onClick={() => navigate(request.detailPath)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-left transition-colors hover:border-[#B0003A]/30 hover:bg-orange-50/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1A1F36]">{request.number}</p>
                      <p className="truncate text-xs text-gray-500">{request.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={request.statusLabel} />
                    </div>
                  </button>
                ))}
                {dashboard.myRequests.length === 0 && (
                  <p className="text-sm text-gray-500">No tienes solicitudes registradas.</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Estadisticas
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={8}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} align="right" />
                <Bar dataKey="Solicitudes" fill="#B0003A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Aprobaciones" fill="#EAB308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Modal isOpen={legalizarModal} onClose={() => setLegalizarModal(false)} title="Selecciona una Solicitud">
        <div className="space-y-3">
          <input
            type="text"
            value={busqueda}
            onChange={e => {
              setBusqueda(e.target.value);
              setErrorBusqueda('');
            }}
            placeholder="Buscar por No. de Solicitud / Expediente"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B0003A]/20 focus:border-[#B0003A]"
          />
          {errorBusqueda && (
            <p className="text-xs font-medium text-red-500">{errorBusqueda}</p>
          )}
          <button
            onClick={handleBuscarLegalizacion}
            className="w-full py-2.5 bg-[#1A1F36] text-white text-sm font-semibold rounded-lg hover:bg-[#1A1F36]/90 transition-colors"
          >
            Buscar
          </button>
        </div>
      </Modal>
    </div>
  );
}
