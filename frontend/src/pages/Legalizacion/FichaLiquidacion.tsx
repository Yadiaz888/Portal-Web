import { useState, useEffect } from 'react';
import { Plus, Download, Mail, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { FichaLiquidacion as FichaModel } from '../../models/Gasto';
import { formatCurrency } from '../../utils/formatters';
import Modal from '../../components/UI/Modal';
import { updateLegalizacion } from '../../api/legalizacion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface FichaLiquidacionProps {
  ficha: FichaModel;
  onNuevoGasto: () => void;
  onEliminarGastos: (indices: number[]) => void;
  isReadOnly?: boolean;
  solicitudId?: string;
  estadoActual?: string;
  onStatusChange?: () => void;
}

export default function FichaLiquidacion({ 
  ficha, 
  onNuevoGasto, 
  onEliminarGastos,
  isReadOnly,
  solicitudId,
  estadoActual,
  onStatusChange,
}: FichaLiquidacionProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [estado, setEstado] = useState<string>('Creado');

  // Load initial status from props
  useEffect(() => {
    if (estadoActual) {
      setEstado(estadoActual);
    }
  }, [estadoActual]);

  const handleUpdateEstado = (nuevoEstado: 'Creado' | 'Enviado a Aprobacion' | 'Aprobado Jefe' | 'Aprobado Contabilidad' | 'En validacion de pago' | 'Pagado' | 'Rechazado' | 'Cancelado') => {
    if (solicitudId) {
      updateLegalizacion(solicitudId, { estadoLegalizacion: nuevoEstado as any })
        .then(updated => {
          setEstado(updated.estadoLegalizacion);
          notify(`Estado de legalización actualizado a: "${updated.estadoLegalizacion}"`, 'success');
          onStatusChange?.();
        })
        .catch(err => notify('Error: ' + err.message, 'error'));
    }
  };

  const toggleAll = () => {
    if (selectedIndices.length === ficha.detalleFacturas.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(ficha.detalleFacturas.map((_, i) => i));
    }
  };

  const toggleIndex = (idx: number) => {
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleEliminar = () => {
    onEliminarGastos(selectedIndices);
    setDeleteModalOpen(false);
    setSelectedIndices([]);
  };

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liquidación */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Liquidación de Anticipo
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Anticipo aprobado</p>
              <p className="text-2xl font-bold text-[#1A1F36]">{formatCurrency(ficha.anticipoAprobado)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Gastos liquidados</p>
              <p className="text-2xl font-bold text-[#E8450A]">{formatCurrency(ficha.gastosLiquidados)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Saldo</p>
              <p className="text-2xl font-bold text-[#1A1F36]">{formatCurrency(ficha.saldo)}</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Acciones de Legalización
          </h3>
          <div className="space-y-2">
            {isReadOnly ? (
              <div className="p-3 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg text-center">
                Modo lectura. Estado: {estado}
              </div>
            ) : (
              <>
                {estado === 'Creado' && (
                  <button 
                    onClick={() => handleUpdateEstado('Enviado a Aprobacion')}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
                  >
                    <Mail size={16} />
                    Enviar a Aprobación
                  </button>
                )}
                {estado === 'Enviado a Aprobacion' && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleUpdateEstado('Aprobado Jefe')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Aprobar (Jefe)
                    </button>
                    <button 
                      onClick={() => handleUpdateEstado('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar Legalización
                    </button>
                  </div>
                )}
                {estado === 'Aprobado Jefe' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleUpdateEstado('Aprobado Contabilidad')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Aprobar (Contabilidad)
                    </button>
                    <button 
                      onClick={() => handleUpdateEstado('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar Legalización
                    </button>
                  </div>
                )}
                {estado === 'Aprobado Contabilidad' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleUpdateEstado('En validacion de pago')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-[#1A1F36] hover:bg-[#1A1F36]/90 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Enviar a validacion de pago
                    </button>
                    <button 
                      onClick={() => handleUpdateEstado('Rechazado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                      Rechazar Legalización
                    </button>
                  </div>
                )}
                {estado === 'En validacion de pago' && (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateEstado('Pagado')}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                      Confirmar pago aprobado por pasarela
                    </button>
                    <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                      Paso simulado: aqui se validaria la respuesta exitosa de la pasarela de pagos.
                    </p>
                  </div>
                )}
                {estado === 'Pagado' && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg text-center">
                    ✓ Legalización Aprobada
                  </div>
                )}
                {estado === 'Rechazado' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                    ✗ Legalización Rechazada
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => notify('El informe se está preparando para descarga.', 'info')}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-[#1A1F36] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Descargar Informe
            </button>
          </div>
        </div>
      </div>

      {/* Detalle de Facturas */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1A1F36]">Detalle de Facturas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {!isReadOnly && (
                  <th className="px-5 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedIndices.length === ficha.detalleFacturas.length && ficha.detalleFacturas.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-[#E8450A] focus:ring-[#E8450A]"
                    />
                  </th>
                )}
                {['N°', 'Fecha de gasto', 'Concepto', 'Proveedor', 'N° Factura', 'Valor'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ficha.detalleFacturas.map((row, idx) => (
                <tr key={row.n} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {!isReadOnly && (
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIndices.includes(idx)}
                        onChange={() => toggleIndex(idx)}
                        className="rounded border-gray-300 text-[#E8450A] focus:ring-[#E8450A]"
                      />
                    </td>
                  )}
                  <td className="px-5 py-3 text-gray-700">{row.n}</td>
                  <td className="px-5 py-3 text-gray-700">{row.fechaGasto}</td>
                  <td className="px-5 py-3 text-gray-700">{row.concepto}</td>
                  <td className="px-5 py-3 text-gray-700">{row.proveedor}</td>
                  <td className="px-5 py-3 text-gray-700">{row.nFactura}</td>
                  <td className="px-5 py-3 text-gray-700">{formatCurrency(row.valor)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={isReadOnly ? 5 : 6} className="px-5 py-3 text-gray-700 text-right">Total Gastos Liquidados</td>
                <td className="px-5 py-3 text-[#1A1F36]">
                  {formatCurrency(ficha.detalleFacturas.reduce((acc, r) => acc + r.valor, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Acciones tabla */}
        {!isReadOnly && (
          <div className="flex gap-3 p-5 border-t border-gray-100">
            <button 
              onClick={onNuevoGasto}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1A1F36] rounded-lg hover:bg-[#1A1F36]/90 transition-colors"
            >
              <Plus size={16} />
              Nuevo gasto
            </button>
            <button 
              disabled={selectedIndices.length === 0}
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              Eliminar seleccionados
            </button>
            <button 
              onClick={() => handleUpdateEstado('Enviado a Aprobacion')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors"
            >
              <Mail size={16} />
              Enviar a aprobacion
            </button>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar {selectedIndices.length} {selectedIndices.length === 1 ? 'registro' : 'registros'}? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
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
