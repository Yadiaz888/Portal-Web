import { useState, useEffect } from 'react';
import { Plus, Calendar, ArrowLeft } from 'lucide-react';
import FileDropZone from '../../components/UI/FileDropZone';
import { Factura } from '../../models/Factura';
import StatusBadge from '../../components/UI/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const tiposGasto = ['Transporte', 'Alimentación', 'Hospedaje', 'Comunicaciones', 'Gastos menores', 'Otros'];

interface RegistrarFacturaProps {
  mode?: 'create' | 'view' | 'edit';
  initialData?: Factura | null;
  onSave?: (factura: Partial<Factura>) => void;
  onCancel?: () => void;
}

export default function RegistrarFactura({
  mode = 'create',
  initialData,
  onSave,
  onCancel,
}: RegistrarFacturaProps) {
  const isReadOnly = mode === 'view';
  const { user } = useAuth();
  const { notify } = useToast();
  
  const [tipoProveedor, setTipoProveedor] = useState<'Proveedor Extranjero' | 'Caja Menor'>('Proveedor Extranjero');
  const [estadoFactura, setEstadoFactura] = useState<Factura['estadoLegalizacion']>('Creada');
  const [form, setForm] = useState({
    tipoGasto: '',
    nFactura: '',
    montoTotal: '',
    fechaInicio: '',
    tipoComprobante: '',
    descripcion: '',
  });

  useEffect(() => {
    if (initialData) {
      let parsedDate = '';
      if (initialData.fechaSolicitud) {
        const parts = initialData.fechaSolicitud.split(' ');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const year = parts[2];
          const monthsMap: Record<string, string> = {
            enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
            julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
          };
          const month = monthsMap[parts[1].toLowerCase()] || '01';
          parsedDate = `${year}-${month}-${day}`;
        } else {
          try {
            const d = new Date(initialData.fechaSolicitud);
            if (!isNaN(d.getTime())) {
              parsedDate = d.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      setForm({
        tipoGasto: initialData.tipoGasto || '',
        nFactura: initialData.nFactura || '',
        montoTotal: initialData.monto ? String(initialData.monto) : '',
        fechaInicio: parsedDate,
        tipoComprobante: initialData.tipoComprobante || '',
        descripcion: initialData.descripcion || '',
      });

      if (initialData.tipoProveedor) {
        setTipoProveedor(initialData.tipoProveedor);
      }
      
      if (initialData.estadoLegalizacion) {
        setEstadoFactura(initialData.estadoLegalizacion);
      }
    }
  }, [initialData]);

  const handleUpdateEstado = (nuevoEstado: Factura['estadoLegalizacion']) => {
    setEstadoFactura(nuevoEstado);
    if (onSave && initialData) {
      onSave({
        ...initialData,
        estadoLegalizacion: nuevoEstado,
      });
      notify(`Estado de la factura actualizado a: "${nuevoEstado}"`, 'success');
    }
  };

  const setField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.tipoGasto || !form.nFactura || !form.montoTotal) {
      notify('Por favor complete los campos obligatorios: Tipo de Gasto, No. Factura y Monto Total.', 'error');
      return;
    }
    
    if (onSave) {
      onSave({
        id: initialData?.id || Date.now().toString(),
        nFactura: form.nFactura,
        tipoGasto: form.tipoGasto,
        monto: Number(form.montoTotal) || 0,
        fechaSolicitud: form.fechaInicio 
          ? new Date(form.fechaInicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) 
          : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        estadoLegalizacion: initialData?.estadoLegalizacion || 'Creada',
        tipoProveedor: tipoProveedor,
        tipoComprobante: form.tipoComprobante,
        descripcion: form.descripcion,
      });
    }
  };

  const handleLimpiar = () => {
    setForm({
      tipoGasto: '',
      nFactura: '',
      montoTotal: '',
      fechaInicio: '',
      tipoComprobante: '',
      descripcion: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-sm">🧾</span>
          </div>
          <h3 className="text-base font-bold text-[#1A1F36]">
            {mode === 'view' ? 'Detalle de Factura' : mode === 'edit' ? 'Editar Factura' : 'Detalle De Factura'}
          </h3>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Radio */}
        <div className="flex gap-6 mb-6">
          {(['Proveedor Extranjero', 'Caja Menor'] as const).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipoProveedor"
                value={t}
                disabled={isReadOnly}
                checked={tipoProveedor === t}
                onChange={() => setTipoProveedor(t)}
                className="accent-[#E8450A]"
              />
              <span className="text-sm font-medium text-gray-700">{t}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Datos del Gasto
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de Gasto *</label>
                <select
                  value={form.tipoGasto}
                  disabled={isReadOnly}
                  onChange={e => setField('tipoGasto', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Seleccionar</option>
                  {tiposGasto.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">N° Factura *</label>
                <input
                  value={form.nFactura}
                  disabled={isReadOnly}
                  onChange={e => setField('nFactura', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Monto Total *</label>
                <input
                  type="number"
                  value={form.montoTotal}
                  disabled={isReadOnly}
                  onChange={e => setField('montoTotal', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha de Inicio</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={form.fechaInicio}
                    disabled={isReadOnly}
                    onChange={e => setField('fechaInicio', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de Comprobante</label>
                <input
                  type="text"
                  placeholder="Ej. Factura, Recibo, etc."
                  value={form.tipoComprobante}
                  disabled={isReadOnly}
                  onChange={e => setField('tipoComprobante', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                <textarea
                  value={form.descripcion}
                  disabled={isReadOnly}
                  onChange={e => setField('descripcion', e.target.value)}
                  rows={3}
                  placeholder="Descripción del gasto"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <FileDropZone label="Agrega una factura" buttonLabel="Cargar Documento" />
            
            {/* Acciones de Aprobación */}
            {(mode === 'view' || mode === 'edit') && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Flujo de Aprobación
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Estado actual:</span>
                  <StatusBadge status={estadoFactura} />
                </div>
                
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {estadoFactura === 'Creada' && (
                    <button
                      onClick={() => handleUpdateEstado('Enviado a Aprobacion')}
                      className="w-full py-2 bg-[#E8450A] text-white text-xs font-semibold rounded-lg hover:bg-[#E8450A]/90 transition-colors"
                    >
                      Enviar a Aprobación
                    </button>
                  )}
                  {estadoFactura === 'Enviado a Aprobacion' && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateEstado('Aprobado Jefe')}
                        className="flex-1 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Aprobar (Jefe)
                      </button>
                      <button
                        onClick={() => handleUpdateEstado('Rechazado')}
                        className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                  {estadoFactura === 'Aprobado Jefe' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateEstado('Aprobado Contabilidad')}
                        className="flex-1 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Aprobar (Contabilidad)
                      </button>
                      <button
                        onClick={() => handleUpdateEstado('Rechazado')}
                        className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                  {estadoFactura === 'Aprobado Contabilidad' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateEstado('En validacion de pago')}
                        className="flex-1 py-2 bg-[#1A1F36] text-white text-xs font-semibold rounded-lg hover:bg-[#1A1F36]/90 transition-colors"
                      >
                        Enviar a validacion de pago
                      </button>
                      <button
                        onClick={() => handleUpdateEstado('Rechazado')}
                        className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                  {estadoFactura === 'En validacion de pago' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleUpdateEstado('Pagada')}
                        className="w-full py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirmar pago aprobado por pasarela
                      </button>
                      <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                        Paso simulado: aqui se validaria la respuesta exitosa de la pasarela de pagos.
                      </p>
                    </div>
                  )}
                  {estadoFactura === 'Pagada' && (
                    <p className="text-xs text-green-600 font-semibold text-center bg-green-50 py-1.5 rounded-lg border border-green-100">
                      ✓ Factura Pagada/Completada
                    </p>
                  )}
                  {estadoFactura === 'Rechazado' && (
                    <p className="text-xs text-red-600 font-semibold text-center bg-red-50 py-1.5 rounded-lg border border-red-100">
                      ✗ Factura Rechazada
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
          {!isReadOnly ? (
            <>
              {mode === 'create' ? (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1A1F36] rounded-lg hover:bg-[#1A1F36]/90 transition-colors"
                >
                  <Plus size={16} />
                  Nuevo gasto
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
                >
                  Guardar Cambios
                </button>
              )}
              {mode === 'create' && (
                <button
                  onClick={handleLimpiar}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver al listado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
