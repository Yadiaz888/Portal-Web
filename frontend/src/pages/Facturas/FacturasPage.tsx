import { useEffect, useState } from 'react';
import { Receipt, Download, Filter, CreditCard } from 'lucide-react';
import { Factura } from '../../models/Factura';
import { getFacturas, createFactura, updateFactura, deleteFactura } from '../../api/facturas';
import DataTable, { Column } from '../../components/UI/DataTable';
import StatusBadge from '../../components/UI/StatusBadge';
import StatCard from '../../components/UI/StatCard';
import SearchInput from '../../components/UI/SearchInput';
import Modal from '../../components/UI/Modal';
import { formatCurrency } from '../../utils/formatters';
import RegistrarFactura from './RegistrarFactura';
import { useToast } from '../../context/ToastContext';

const tabs = ['General', 'Registrar Factura'];

export default function FacturasPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [formMode, setFormMode] = useState<'list' | 'create' | 'view' | 'edit'>('list');
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    getFacturas().then(setFacturas);
  }, []);

  const filtered = facturas.filter(f =>
    f.nFactura.toLowerCase().includes(search.toLowerCase()) ||
    f.tipoGasto.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Factura>[] = [
    { key: 'nFactura', header: 'N° Factura' },
    { key: 'tipoGasto', header: 'Tipo de gasto' },
    {
      key: 'tipoProveedor',
      header: 'Tipo Proveedor',
      render: row => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          row.tipoProveedor === 'Caja Menor'
            ? 'bg-blue-50 text-blue-700 border border-blue-100'
            : 'bg-purple-50 text-purple-700 border border-purple-100'
        }`}>
          {row.tipoProveedor || 'Proveedor Extranjero'}
        </span>
      )
    },
    { key: 'solicitante', header: 'Solicitante' },
    { key: 'monto', header: 'Monto', render: row => formatCurrency(row.monto) },
    { key: 'fechaSolicitud', header: 'Fecha de Solicitud' },
    {
      key: 'estadoLegalizacion',
      header: 'Estado de Legalización',
      render: row => <StatusBadge status={row.estadoLegalizacion} />,
    },
  ];

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index === 0) {
      setFormMode('list');
      setSelectedFactura(null);
    } else {
      setFormMode('create');
      setSelectedFactura(null);
    }
  };

  const handleSaveFactura = (newData: Partial<Factura>) => {
    if (formMode === 'create') {
      createFactura(newData).then(newFactura => {
        setFacturas(prev => [newFactura, ...prev]);
      });
    } else if (selectedFactura) {
      updateFactura(selectedFactura.id, newData).then(updated => {
        setFacturas(prev => prev.map(f => f.id === selectedFactura.id ? updated : f));
      });
    }
    setFormMode('list');
    setSelectedFactura(null);
    setActiveTab(0);
  };

  const confirmarEliminacion = () => {
    if (deleteId) {
      deleteFactura(deleteId).then(() => {
        setFacturas(prev => prev.filter(f => f.id !== deleteId));
        setDeleteId(null);
      });
    }
  };

  // Compute status metrics based on state facturas
  const radicadas = facturas.length;
  const pagas = facturas.filter(f => f.estadoLegalizacion === 'Pagada').length;
  const rechazadas = facturas.filter(f => f.estadoLegalizacion === 'Rechazado').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1F36]">Registro de Facturas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panel para legalizar los partidos de gastos de cada viaje</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => handleTabChange(i)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === i
                  ? 'text-[#E8450A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E8450A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'Registrar Factura' && formMode === 'view'
                ? 'Detalle de Factura'
                : tab === 'Registrar Factura' && formMode === 'edit'
                ? 'Editar Factura'
                : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 && formMode === 'list' ? (
        <div className="space-y-6">
          {/* Acciones Rapidas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Acciones Rapidas
            </h2>
            <div className="flex gap-3">
              <button 
                onClick={() => handleTabChange(1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
              >
                <Receipt size={16} />
                Registrar factura
              </button>
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
            <StatCard icon={<CreditCard size={22} />} label="Facturas Radicadas" value={radicadas} variant="default" />
            <StatCard icon={<CreditCard size={22} />} label="Facturas pagas" value={pagas} variant="success" />
            <StatCard icon={<CreditCard size={22} />} label="Facturas Rechazadas" value={rechazadas} variant="danger" />
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
                if (action === 'Ver detalle') {
                  setSelectedFactura(row);
                  setFormMode('view');
                  setActiveTab(1);
                } else if (action === 'Editar') {
                  setSelectedFactura(row);
                  setFormMode('edit');
                  setActiveTab(1);
                } else if (action === 'Eliminar') {
                  setDeleteId(row.id);
                }
              }}
              actionItems={['Ver detalle', 'Editar', 'Eliminar']}
            />
          </div>
        </div>
      ) : (
        <RegistrarFactura
          mode={formMode === 'list' ? 'create' : formMode}
          initialData={selectedFactura}
          onSave={handleSaveFactura}
          onCancel={() => {
            setFormMode('list');
            setSelectedFactura(null);
            setActiveTab(0);
          }}
        />
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
