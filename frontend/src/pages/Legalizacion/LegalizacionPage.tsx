import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Download, Filter, FileCheck } from 'lucide-react';
import { Legalizacion } from '../../models/Legalizacion';
import { getLegalizaciones, deleteLegalizacion } from '../../api/legalizacion';
import DataTable, { Column } from '../../components/UI/DataTable';
import StatusBadge from '../../components/UI/StatusBadge';
import StatCard from '../../components/UI/StatCard';
import SearchInput from '../../components/UI/SearchInput';
import Modal from '../../components/UI/Modal';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const cleanSolicitud = (value: string) => value.replace(/n(?:Â°|°|o|\.)/i, '').trim();

export default function LegalizacionPage() {
  const [legalizaciones, setLegalizaciones] = useState<Legalizacion[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    getLegalizaciones().then(setLegalizaciones);
  }, []);

  const handleOpenSearchModal = () => {
    setBusqueda('');
    setErrorBusqueda('');
    setModalOpen(true);
  };

  const handleBuscar = () => {
    if (!busqueda.trim()) {
      setErrorBusqueda('Por favor, ingresa un numero de solicitud.');
      return;
    }

    const cleanSearch = cleanSolicitud(busqueda);
    const match = legalizaciones.find(item => cleanSolicitud(item.nSolicitud) === cleanSearch || item.id === cleanSearch);

    if (!match) {
      setErrorBusqueda('La solicitud ingresada no existe o no fue encontrada.');
      return;
    }

    setErrorBusqueda('');
    setModalOpen(false);
    navigate(`/legalizacion-viaticos/${match.id}?mode=edit`);
  };

  const filtered = legalizaciones.filter(item =>
    item.nSolicitud.toLowerCase().includes(search.toLowerCase()) ||
    item.concepto.toLowerCase().includes(search.toLowerCase()) ||
    (item.solicitante || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Legalizacion>[] = [
    { key: 'nSolicitud', header: 'No. Solicitud' },
    { key: 'concepto', header: 'Concepto' },
    {
      key: 'monto',
      header: 'Monto',
      render: row => formatCurrency(row.monto),
    },
    { key: 'solicitante', header: 'Solicitante' },
    { key: 'fechaSolicitud', header: 'Fecha de Solicitud' },
    {
      key: 'estadoLegalizacion',
      header: 'Estado de Legalizacion',
      render: row => <StatusBadge status={row.estadoLegalizacion} />,
    },
  ];

  const confirmarEliminacion = () => {
    if (deleteId) {
      deleteLegalizacion(deleteId).then(() => {
        setLegalizaciones(prev => prev.filter(item => item.id !== deleteId));
        setDeleteId(null);
      });
    }
  };

  const radicados = legalizaciones.length;
  const aprobados = legalizaciones.filter(item => item.estadoLegalizacion === 'Pagado').length;
  const rechazados = legalizaciones.filter(item => item.estadoLegalizacion === 'Rechazado').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1F36]">Legalizacion de Viaticos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panel para legalizar los partidos de gastos de cada viaje</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {['General', 'Legalizar'].map((tab, i) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                i === 0
                  ? 'text-[#E8450A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E8450A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={i === 1 ? handleOpenSearchModal : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Acciones Rapidas
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleOpenSearchModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
            >
              <Receipt size={16} />
              Legalizar pagos
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

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<FileCheck size={22} />} label="Expedientes Radicados" value={radicados} variant="default" />
          <StatCard icon={<FileCheck size={22} />} label="Pagos Aprobados" value={aprobados} variant="success" />
          <StatCard icon={<FileCheck size={22} />} label="Pagos Rechazados" value={rechazados} variant="danger" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <SearchInput
              placeholder="Buscar No. Solicitud"
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
              if (action === 'Ver detalle') navigate(`/legalizacion-viaticos/${solId}?mode=view`);
              if (action === 'Legalizar') navigate(`/legalizacion-viaticos/${solId}?mode=edit`);
              if (action === 'Eliminar') setDeleteId(row.id);
            }}
            actionItems={['Ver detalle', 'Legalizar', 'Eliminar']}
          />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Selecciona una Solicitud">
        <div className="space-y-3">
          <input
            type="text"
            value={busqueda}
            onChange={e => {
              setBusqueda(e.target.value);
              setErrorBusqueda('');
            }}
            placeholder="Buscar por No. de Solicitud / Expediente"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]"
          />
          {errorBusqueda && (
            <p className="text-xs text-red-500 font-medium">{errorBusqueda}</p>
          )}
          <button
            onClick={handleBuscar}
            className="w-full py-2.5 bg-[#1A1F36] text-white text-sm font-semibold rounded-lg hover:bg-[#1A1F36]/90 transition-colors"
          >
            Buscar
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminacion">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Estas seguro de que deseas eliminar este registro? Esta accion no se puede deshacer.
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
