import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Mail, Plane, Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAnticipos, createAnticipo, updateAnticipo } from '../../api/anticipos';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';


const tiposAnticipo = [
  '01 – Viaje',
  '02 – Trabajo de Campo',
  '03 – Visitas a clientes o proveedores',
  '04 – Capacitación',
  '05 – Representación institucional',
  '06 – Seminarios / Congresos',
  '07 – Soporte técnico o logístico',
  '08 – Auditorías / Inspecciones',
];

const paises = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Ecuador', 'Perú', 'Venezuela', 'México', 'España',
];

interface Destino {
  id: number;
  origen: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  collapsed: boolean;
}

interface SolicitarAnticipoProps {
  mode?: 'create' | 'view' | 'edit';
  id?: string;
  onStatusChange?: () => void;
}

export default function SolicitarAnticipo({ mode = 'create', id, onStatusChange }: SolicitarAnticipoProps) {
  const isReadOnly = mode === 'view';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const [nombre, setNombre] = useState(user?.name || 'Jhoana Batista');
  const [identificacion, setIdentificacion] = useState(user?.email || 'CC – 1010123845');

  const [tipoAnticipo, setTipoAnticipo] = useState('');
  const [pais, setPais] = useState('');
  const [paisSearch, setPaisSearch] = useState('');
  const [paisOpen, setPaisOpen] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [monto, setMonto] = useState(0);
  const [editandoMonto, setEditandoMonto] = useState(false);
  const [montoInput, setMontoInput] = useState('0');
  const [currentEstado, setCurrentEstado] = useState<string>('Creado');

  const formVacio = !tipoAnticipo || !concepto;

  useEffect(() => {
    if (id) {
      getAnticipos().then(list => {
        const found = list.find(a => a.id === id || a.nSolicitud.replace('N°', '').trim() === id);
        if (found) {
          setConcepto(found.concepto || '');
          setMonto(found.anticipoAprobado || 0);
          setMontoInput(String(found.anticipoAprobado || 0));
          setTipoAnticipo('01 – Viaje');
          setPais('Colombia');
          setDestinos([
            { id: 1, origen: 'Bogotá', destino: 'Medellín', fechaInicio: '2024-04-12', fechaFin: '2024-04-15', collapsed: false }
          ]);
          setCurrentEstado(found.estadoSolicitud || 'Creado');
        }
      });
    }
  }, [id]);

  const handleSave = () => {
    if (!tipoAnticipo || !concepto) return;

    if (mode === 'create') {
      const newItem = {
        concepto,
        anticipoAprobado: Number(montoInput) || 0,
        fechaSolicitud: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        estadoSolicitud: 'Enviado a Aprobacion' as const,
      };
      createAnticipo(newItem).then(() => {
        notify('Anticipo solicitado y enviado a aprobacion del jefe inmediato.', 'success');
        navigate('/gestor-anticipos');
      });
    } else if (mode === 'edit' && id) {
      getAnticipos().then(list => {
        const found = list.find(a => a.id === id || a.nSolicitud.replace('N°', '').trim() === id);
        if (found) {
          updateAnticipo(found.id, {
            concepto,
            anticipoAprobado: Number(montoInput) || found.anticipoAprobado,
            estadoSolicitud: 'Enviado a Aprobacion',
          }).then(() => {
            notify('Solicitud de anticipo actualizada con éxito.', 'success');
            navigate('/gestor-anticipos');
          });
        }
      });
    }
  };

  const handleUpdateStatus = (nuevoEstado: string) => {
    if (id) {
      getAnticipos().then(list => {
        const found = list.find(a => a.id === id || a.nSolicitud.replace('N°', '').trim() === id);
        if (found) {
          updateAnticipo(found.id, { estadoSolicitud: nuevoEstado as any }).then(() => {
            setCurrentEstado(nuevoEstado);
            notify(`Estado de la solicitud actualizado a: "${nuevoEstado}"`, 'success');
            onStatusChange?.();
          }).catch((err: any) => {
            notify(`Error al actualizar estado: ${err.message}`, 'error');
          });
        }
      });
    }
  };

  const addDestino = () => {
    setDestinos(prev => [
      ...prev,
      { id: Date.now(), origen: '', destino: '', fechaInicio: '', fechaFin: '', collapsed: false },
    ]);
  };

  const updateDestino = (id: number, field: keyof Destino, value: string | boolean) => {
    setDestinos(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const filteredPaises = paises.filter(p => p.toLowerCase().includes(paisSearch.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#1A1F36] mb-5">
          {mode === 'create' ? 'Formulario de Solicitud de Anticipo' : 'Información de Solicitud'}
        </h2>

        {/* Datos Generales */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Datos Generales del Solicitante
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre Completo</label>
              <input
                disabled={isReadOnly}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">N° Identificación</label>
              <input
                disabled={isReadOnly}
                value={identificacion}
                onChange={e => setIdentificacion(e.target.value)}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
              />
            </div>
          </div>
        </div>

        {/* Datos de Solicitud */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Datos de Solicitud
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo de anticipo</label>
              <select
                disabled={isReadOnly}
                value={tipoAnticipo}
                onChange={e => setTipoAnticipo(e.target.value)}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
              >
                <option value="">Seleccionar tipo</option>
                {tiposAnticipo.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="text-xs text-gray-500 mb-1 block">País</label>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => !isReadOnly && setPaisOpen(!paisOpen)}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-left flex items-center justify-between ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
              >
                <span className={pais ? (isReadOnly ? 'text-gray-500' : 'text-gray-800') : 'text-gray-400'}>{pais || 'Seleccionar país'}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {paisOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      value={paisSearch}
                      onChange={e => setPaisSearch(e.target.value)}
                      placeholder="Buscar país..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E8450A]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredPaises.map(p => (
                      <button
                        key={p}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => { setPais(p); setPaisOpen(false); setPaisSearch(''); }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Concepto</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  placeholder="Ingrese el concepto"
                  className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Destinos */}
        {destinos.map((d, idx) => (
          <div key={d.id} className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => updateDestino(d.id, 'collapsed', !d.collapsed)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-[#1A1F36]">Información de Destino {idx + 1}</span>
              {d.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {!d.collapsed && (
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ciudad de Origen</label>
                  <div className="relative">
                    <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      disabled={isReadOnly}
                      value={d.origen}
                      onChange={e => updateDestino(d.id, 'origen', e.target.value)}
                      placeholder="Ciudad origen"
                      className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ciudad de Destino</label>
                  <div className="relative">
                    <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      disabled={isReadOnly}
                      value={d.destino}
                      onChange={e => updateDestino(d.id, 'destino', e.target.value)}
                      placeholder="Ciudad destino"
                      className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha de Inicio</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={d.fechaInicio}
                      onChange={e => updateDestino(d.id, 'fechaInicio', e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha de Fin</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={d.fechaFin}
                      onChange={e => updateDestino(d.id, 'fechaFin', e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A]'}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {!isReadOnly && (
          <button
            type="button"
            onClick={addDestino}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1A1F36] border border-[#1A1F36] rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
            Nuevo Destino
          </button>
        )}
      </div>

      {/* Panel lateral */}
      <div className="space-y-4">
        {/* Liquidación */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#1A1F36] mb-3">
            {isReadOnly ? 'Monto de anticipo solicitado' : 'Liquidación de Anticipo'}
          </h3>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
            {!isReadOnly && <p className="text-xs text-gray-400 mb-1">Monto de anticipo a solicitar:</p>}
            {editandoMonto ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={montoInput}
                  onChange={e => setMontoInput(e.target.value)}
                  className="flex-1 text-center text-xl font-bold border border-[#E8450A] rounded-lg px-2 py-1 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => { setMonto(Number(montoInput)); setEditandoMonto(false); }}
                  className="px-3 py-1.5 bg-[#E8450A] text-white text-xs font-semibold rounded-lg"
                >
                  OK
                </button>
              </div>
            ) : (
              <p className="text-3xl font-bold text-[#1A1F36]">
                ${monto.toLocaleString('es-CO')}.0
              </p>
            )}
          </div>
          {!isReadOnly && (
            <button
              onClick={() => { setEditandoMonto(true); setMontoInput(String(monto)); }}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A1F36] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
            >
              <Pencil size={14} />
              Editar Anticipo
            </button>
          )}
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#1A1F36] mb-3">Acciones</h3>
          <div className="space-y-2">
            {isReadOnly ? (
              <>
                {currentEstado === 'Creado' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus('Enviado a Aprobacion')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
                    >
                      <Mail size={16} />
                      Solicitar Anticipo
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={16} />
                      Cancelar Solicitud
                    </button>
                  </>
                )}
                {currentEstado === 'Enviado a Aprobacion' && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus('Aprobado Jefe')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Aprobar (Jefe Inmediato)
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar Solicitud
                    </button>
                  </>
                )}
                {currentEstado === 'Aprobado Jefe' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus('Aprobado Contabilidad')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Aprobar (Contabilidad)
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar Solicitud
                    </button>
                  </>
                )}
                {currentEstado === 'Aprobado Contabilidad' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus('En validacion de pago')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-[#1A1F36] hover:bg-[#1A1F36]/90 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Enviar a validacion de pago
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar Solicitud
                    </button>
                  </>
                )}
                {currentEstado === 'En validacion de pago' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('Pagado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Confirmar pago aprobado por pasarela
                    </button>
                    <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                      Paso simulado: aqui se validaria la respuesta exitosa de la pasarela de pagos.
                    </p>
                  </>
                )}
                {currentEstado === 'Pagado' && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg text-center">
                    ✓ Solicitud aprobada y pagada con éxito.
                  </div>
                )}
                {currentEstado === 'Rechazado' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                    ✗ Solicitud rechazada / cancelada.
                  </div>
                )}
                {currentEstado === 'Cancelado' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg text-center">
                    ⚠ Solicitud cancelada.
                  </div>
                )}

                {currentEstado !== 'Pagado' && currentEstado !== 'Rechazado' && currentEstado !== 'Cancelado' && (
                  <button 
                    onClick={() => navigate(`/gestor-anticipos/${id || '1'}?edit=true`, { replace: true })}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-[#1A1F36] border border-[#1A1F36] rounded-lg hover:bg-gray-50 transition-colors mt-2"
                  >
                    <Pencil size={16} />
                    Editar Solicitud
                  </button>
                )}
              </>

            ) : (
              <>
                <button
                  disabled={formVacio}
                  onClick={handleSave}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    formVacio
                      ? 'bg-[#E8450A]/40 text-white cursor-not-allowed'
                      : 'bg-[#E8450A] text-white hover:bg-[#E8450A]/90'
                  }`}
                >
                  <Mail size={16} />
                  Solicitar Anticipo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
