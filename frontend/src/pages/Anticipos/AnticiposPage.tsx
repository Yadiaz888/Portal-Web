import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Download, Filter, FileCheck } from 'lucide-react';
import { Anticipo } from '../../models/Anticipo';
import { getAnticipos, deleteAnticipo } from '../../api/anticipos';
import DataTable, { Column } from '../../components/UI/DataTable';
import StatusBadge from '../../components/UI/StatusBadge';
import StatCard from '../../components/UI/StatCard';
import SearchInput from '../../components/UI/SearchInput';
import Modal from '../../components/UI/Modal';
import { formatCurrency } from '../../utils/formatters';
import SolicitarAnticipo from './SolicitarAnticipo';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

const tabs = ['General', 'Solicitar Anticipo'];

export default function AnticiposPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'solicitar' ? 1 : 0;
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'create:anticipo');

  useEffect(() => {
    getAnticipos().then(setAnticipos);
  }, []);

  const setTab = (i: number) => {
    setSearchParams(i === 1 ? { tab: 'solicitar' } : {});
  };

  const filtered = anticipos.filter(a =>
    a.nSolicitud.toLowerCase().includes(search.toLowerCase()) ||
    a.concepto.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Anticipo>[] = [
    { key: 'nSolicitud', header: 'N° Solicitud' },
    { key: 'concepto', header: 'Concepto' },
    {
      key: 'anticipoAprobado',
      header: 'Anticipo aprobado',
      render: row => formatCurrency(row.anticipoAprobado),
    },
    { key: 'solicitante', header: 'Solicitante' },
    { key: 'fechaSolicitud', header: 'Fecha de Solicitud' },
    {
      key: 'estadoSolicitud',
      header: 'Estado de Solicitud',
      render: row => <StatusBadge status={row.estadoSolicitud} />,
    },
  ];

  const confirmarEliminacion = () => {
    if (deleteId) {
      deleteAnticipo(deleteId).then(() => {
        setAnticipos(prev => prev.filter(a => a.id !== deleteId));
        setDeleteId(null);
      }).catch((err: any) => {
        notify(`Error al eliminar: ${err.message}`, 'error');
        setDeleteId(null);
      });
    }
  };

  // Compute status metrics based on state anticipos
  const radicadas = anticipos.length;
  const aprobadas = anticipos.filter(a => a.estadoSolicitud === 'Pagado').length;
  const rechazadas = anticipos.filter(a => a.estadoSolicitud === 'Rechazado' || a.estadoSolicitud === 'Cancelado').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1F36]">Gestionar Anticipos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panel para cargar y gestionar anticipos</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setTab(i)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === i
                  ? 'text-[#E8450A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E8450A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 ? (
        <div className="space-y-6">
          {/* Acciones Rapidas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Acciones Rapidas
            </h2>
            <div className="flex gap-3">
              {canCreate && <button
                onClick={() => setTab(1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
              >
                <FileText size={16} />
                Solicitar Anticipo
              </button>}
              <button
                onClick={() => notify('El informe se está preparando para descarga.', 'info')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1A1F36] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                Descargar Informe
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<FileCheck size={22} />} label="Radicadas" value={radicadas} variant="default" />
            <StatCard icon={<FileCheck size={22} />} label="Aprobadas" value={aprobadas} variant="success" />
            <StatCard icon={<FileCheck size={22} />} label="Rechazadas" value={rechazadas} variant="danger" />
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <SearchInput
                placeholder="Buscar N° Solicitud"
                value={search}
                onChange={setSearch}
              />
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
                <Filter size={14} />
                Filtros
              </button>
            </div>
            <DataTable
              columns={columns}
              data={filtered}
              onRowAction={(action, row) => {
                const solId = row.id;
                if (action === 'Ver detalle') navigate(`/gestor-anticipos/${solId}`);
                if (action === 'Editar') navigate(`/gestor-anticipos/${solId}?edit=true`);
                if (action === 'Eliminar') setDeleteId(row.id);
              }}
            />
          </div>
        </div>
      ) : (
        <SolicitarAnticipo />
      )}
      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarEliminacion}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
