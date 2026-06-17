import { useEffect, useState } from 'react';
import {
  Receipt, Download, Filter, FileText, TrendingUp,
  CheckCircle2, XCircle, Clock, Loader2,
} from 'lucide-react';
import { GastoItem, GastoStatus, getGastos, deleteGasto } from '../../api/gastos';
import DataTable, { Column } from '../../components/UI/DataTable';
import StatCard from '../../components/UI/StatCard';
import SearchInput from '../../components/UI/SearchInput';
import Modal from '../../components/UI/Modal';
import { formatCurrency } from '../../utils/formatters';
import RegistrarGasto from './RegistrarGasto';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<GastoStatus, string> = {
  CREADO: 'Creado',
  ENVIADO_A_JEFE: 'Env. a Jefe',
  ENVIADO_A_CONTABILIDAD: 'Env. a Contabilidad',
  LIQUIDADO: 'Liquidado',
  RECHAZADO: 'Rechazado',
};

const STATUS_COLORS: Record<GastoStatus, string> = {
  CREADO: 'bg-gray-100 text-gray-600 border-gray-200',
  ENVIADO_A_JEFE: 'bg-blue-50 text-blue-700 border-blue-100',
  ENVIADO_A_CONTABILIDAD: 'bg-amber-50 text-amber-700 border-amber-100',
  LIQUIDADO: 'bg-green-50 text-green-700 border-green-100',
  RECHAZADO: 'bg-red-50 text-red-700 border-red-100',
};

const TIPO_LABELS: Record<string, string> = {
  RECIBO: 'Recibo',
  FACTURA: 'Factura',
  OTRO: 'Otro',
};

function GastoStatusBadge({ status }: { status: GastoStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[status]}`}>
      {status === 'LIQUIDADO' && <CheckCircle2 size={11} />}
      {status === 'RECHAZADO' && <XCircle size={11} />}
      {['ENVIADO_A_JEFE', 'ENVIADO_A_CONTABILIDAD'].includes(status) && <Clock size={11} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

const TABS = ['General', 'Registrar Gasto'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GastosPage() {
  const { user } = useAuth();
  const role: string = (user as any)?.role?.name ?? (user as any)?.role ?? '';
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';

  const [activeTab, setActiveTab] = useState(0);
  const [formMode, setFormMode] = useState<'list' | 'create' | 'view' | 'edit'>('list');
  const [selected, setSelected] = useState<GastoItem | null>(null);
  const [gastos, setGastos] = useState<GastoItem[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const { notify } = useToast();

  const fetchGastos = async () => {
    setLoadingData(true);
    try {
      const data = await getGastos();
      setGastos(data);
    } catch (err: any) {
      notify(err.response?.data?.message ?? 'Error cargando gastos', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchGastos(); }, []);

  // Search filter
  const filtered = gastos.filter(g =>
    (g.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    TIPO_LABELS[g.tipo].toLowerCase().includes(search.toLowerCase()) ||
    STATUS_LABELS[g.status].toLowerCase().includes(search.toLowerCase()) ||
    (g.createdBy?.name ?? g.createdBy?.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const total = gastos.length;
  const liquidados = gastos.filter(g => g.status === 'LIQUIDADO').length;
  const rechazados = gastos.filter(g => g.status === 'RECHAZADO').length;
  const pendientes = gastos.filter(g => ['CREADO', 'ENVIADO_A_JEFE', 'ENVIADO_A_CONTABILIDAD'].includes(g.status)).length;

  // Table columns
  const columns: Column<GastoItem>[] = [
    { key: 'id', header: 'ID', render: row => <span className="text-xs font-mono text-gray-400">#{row.id}</span> },
    {
      key: 'tipo',
      header: 'Tipo',
      render: row => (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-100">
          {TIPO_LABELS[row.tipo]}
        </span>
      ),
    },
    {
      key: 'origen' as any,
      header: 'Origen',
      render: row => (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {row.origen === 'ELECTRONICA' ? 'Electrónica' : row.origen === 'NO_ELECTRONICA' ? 'Física (OCR)' : 'Manual'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: row => (
        <span className="font-semibold text-[#1A1F36]">
          {formatCurrency(row.amount)} {row.currency}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: row => (
        <span className="text-sm text-gray-600 max-w-[200px] truncate block">
          {row.description ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdBy' as any,
      header: 'Solicitante',
      render: row => (
        <span className="text-sm text-gray-600">
          {row.createdBy?.name ?? row.createdBy?.email ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: row => new Date(row.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'status',
      header: 'Estado',
      render: row => <GastoStatusBadge status={row.status} />,
    },
  ];

  const handleTabChange = (i: number) => {
    setActiveTab(i);
    if (i === 0) { setFormMode('list'); setSelected(null); }
    else { setFormMode('create'); setSelected(null); }
  };

  const handleSuccess = (updated: GastoItem | GastoItem[]) => {
    setGastos(prev => {
      let next = [...prev];
      const items = Array.isArray(updated) ? updated : [updated];
      for (const item of items) {
        const exists = next.find(g => g.id === item.id);
        if (exists) {
          next = next.map(g => g.id === item.id ? item : g);
        } else {
          next = [item, ...next];
        }
      }
      return next;
    });
    if (formMode === 'create') {
      setFormMode('list');
      setActiveTab(0);
    }
  };

  const confirmarEliminacion = async () => {
    if (deleteId === null) return;
    try {
      await deleteGasto(deleteId);
      setGastos(prev => prev.filter(g => g.id !== deleteId));
      notify('Gasto eliminado.', 'success');
    } catch (err: any) {
      notify(err.response?.data?.message ?? 'Error eliminando gasto', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  // Determine which action items to show per row and user role
  const getActionItems = (row: GastoItem) => {
    const items = ['Ver detalle'];
    const isCreator = row.createdById === user?.id;
    if ((isCreator || isAdmin) && row.status === 'CREADO') items.push('Editar');
    if ((isCreator || isAdmin) && ['CREADO', 'RECHAZADO'].includes(row.status)) items.push('Eliminar');
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1F36]">Registro de Gastos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gestiona y da seguimiento a los gastos del equipo
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => handleTabChange(i)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === i
                  ? 'text-[#E8450A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E8450A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'Registrar Gasto' && formMode === 'view' ? 'Detalle del Gasto' :
               tab === 'Registrar Gasto' && formMode === 'edit' ? 'Editar Gasto' :
               tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 && formMode === 'list' ? (
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Acciones Rápidas
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleTabChange(1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors shadow-sm"
              >
                <Receipt size={16} />
                Registrar Gasto
              </button>
              <button
                onClick={() => notify('El informe se está preparando.', 'info')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1A1F36] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                Descargar Informe
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FileText size={22} />} label="Total Gastos" value={total} variant="default" />
            <StatCard icon={<Clock size={22} />} label="En proceso" value={pendientes} variant="default" />
            <StatCard icon={<CheckCircle2 size={22} />} label="Liquidados" value={liquidados} variant="success" />
            <StatCard icon={<XCircle size={22} />} label="Rechazados" value={rechazados} variant="danger" />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-50">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <SearchInput
                placeholder="Buscar por descripción, tipo, estado..."
                value={search}
                onChange={setSearch}
              />
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
                <Filter size={14} />
                Filtros
              </button>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 size={24} className="animate-spin mr-2" />
                Cargando gastos...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                onRowAction={(action, row) => {
                  if (action === 'Ver detalle') {
                    setSelected(row);
                    setFormMode('view');
                    setActiveTab(1);
                  } else if (action === 'Editar') {
                    setSelected(row);
                    setFormMode('edit');
                    setActiveTab(1);
                  } else if (action === 'Eliminar') {
                    setDeleteId(row.id);
                  }
                }}
                actionItems={getActionItems}
              />
            )}
          </div>
        </div>
      ) : (
        <RegistrarGasto
          mode={formMode === 'list' ? 'create' : formMode}
          initialData={selected}
          onSuccess={handleSuccess}
          onCancel={() => {
            setFormMode('list');
            setSelected(null);
            setActiveTab(0);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
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
