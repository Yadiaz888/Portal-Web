import { useState } from 'react';
import { Search, Calendar, Plus } from 'lucide-react';
import FileDropZone from '../../components/UI/FileDropZone';

const tiposGasto = ['Transporte', 'Alimentación', 'Hospedaje', 'Comunicaciones', 'Gastos menores', 'Otros'];

interface GastoBlock {
  id: number;
  tipo: 'Documento fiscal' | 'Recibo';
  razonSocial: string;
  nFactura: string;
  tipoGasto: string;
  montoTotal: string;
  fechaInicio: string;
  tipoComprobante: string;
  descripcion: string;
  fileToUpload?: File;
}

function GastoDetalle({ n, block, onChange, onAgregar, onAgregarGasto, isReadOnly }: {
  n: number;
  block: GastoBlock;
  onChange: (field: keyof GastoBlock, value: any) => void;
  onAgregar: () => void;
  onAgregarGasto?: (gasto: any, file?: File) => Promise<void>;
  isReadOnly?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);

  const esFiscal = block.tipo === 'Documento fiscal';

  const handleAgregar = async () => {
    if (onAgregarGasto) {
      setSubmitting(true);
      try {
        await onAgregarGasto({
          fechaGasto: block.fechaInicio,
          concepto: block.tipoGasto || block.descripcion,
          proveedor: block.razonSocial,
          nFactura: block.nFactura,
          valor: Number(block.montoTotal) || 0,
          tipo: block.tipo
        }, block.fileToUpload);
        onAgregar();
      } finally {
        setSubmitting(false);
      }
    } else {
      onAgregar();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-sm">🧾</span>
        </div>
        <h3 className="text-base font-bold text-[#1A1F36]">Detalle De Gasto {n}</h3>
      </div>

      <div className="p-6">
        {/* Radio */}
        <div className="flex gap-6 mb-6">
          {(['Documento fiscal', 'Recibo'] as const).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tipo-${block.id}`}
                value={t}
                disabled={isReadOnly}
                checked={block.tipo === t}
                onChange={() => onChange('tipo', t)}
                className="accent-[#E8450A]"
              />
              <span className="text-sm font-medium text-gray-700">{t}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Buscar Proveedor - solo Documento fiscal */}
            {esFiscal && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Buscar Proveedor / Factura
                </h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Razón Social"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="N° Factura"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <button 
                    disabled={isReadOnly}
                    className="px-3 py-2 bg-[#1A1F36] text-white rounded-lg hover:bg-[#1A1F36]/90 transition-colors disabled:opacity-50"
                  >
                    <Search size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Razón Social</label>
                    <input
                      value={block.razonSocial}
                      disabled={isReadOnly}
                      onChange={e => onChange('razonSocial', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">N° Factura</label>
                    <input
                      value={block.nFactura}
                      disabled={isReadOnly}
                      onChange={e => onChange('nFactura', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Datos del Gasto */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Datos del Gasto
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {!esFiscal && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">N° Factura</label>
                    <input
                      value={block.nFactura}
                      disabled={isReadOnly}
                      onChange={e => onChange('nFactura', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                )}
                {esFiscal && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tipo de Gasto</label>
                    <select
                      value={block.tipoGasto}
                      disabled={isReadOnly}
                      onChange={e => onChange('tipoGasto', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Seleccionar</option>
                      {tiposGasto.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto Total</label>
                  <input
                    type="number"
                    value={block.montoTotal}
                    disabled={isReadOnly}
                    onChange={e => onChange('montoTotal', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha de Inicio</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={block.fechaInicio}
                      disabled={isReadOnly}
                      onChange={e => onChange('fechaInicio', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo de Comprobante</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={block.tipoComprobante}
                      disabled={isReadOnly}
                      onChange={e => onChange('tipoComprobante', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
                {!esFiscal && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tipo de Gasto</label>
                    <select
                      value={block.tipoGasto}
                      disabled={isReadOnly}
                      onChange={e => onChange('tipoGasto', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Seleccionar</option>
                      {tiposGasto.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                  <textarea
                    value={block.descripcion}
                    disabled={isReadOnly}
                    onChange={e => onChange('descripcion', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] resize-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File drop */}
          <div>
            <FileDropZone
              label="Agrega una factura"
              disabled={isReadOnly || submitting}
              buttonLabel={esFiscal ? 'Buscar Documentos' : 'Cargar Documento'}
              onFileSelect={(file) => onChange('fileToUpload', file)}
              uploadStatus={block.fileToUpload ? [{ name: block.fileToUpload.name, status: 'done' }] : []}
            />
          </div>
        </div>

        {/* Botones */}
        {!isReadOnly && (
          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
            {esFiscal ? (
              <button
                onClick={handleAgregar}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1A1F36] rounded-lg hover:bg-[#1A1F36]/90 transition-colors disabled:opacity-50"
              >
                Agregar
              </button>
            ) : (
              <button
                onClick={handleAgregar}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1A1F36] rounded-lg hover:bg-[#1A1F36]/90 transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                Nuevo gasto
              </button>
            )}
            <button className="px-4 py-2 text-sm font-semibold text-[#E8450A] border border-[#E8450A] rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50">
              Guardar
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegalizarGastos({ onAgregarGasto, isReadOnly }: { onAgregarGasto?: (gasto: any, file?: File) => Promise<void>, isReadOnly?: boolean }) {
  const [bloques, setBloques] = useState<GastoBlock[]>([
    {
      id: 1,
      tipo: 'Documento fiscal',
      razonSocial: '',
      nFactura: '',
      tipoGasto: '',
      montoTotal: '',
      fechaInicio: '',
      tipoComprobante: '',
      descripcion: '',
    },
  ]);

  const addBloque = () => {
    setBloques(prev => [
      ...prev,
      {
        id: Date.now(),
        tipo: 'Documento fiscal',
        razonSocial: '',
        nFactura: '',
        tipoGasto: '',
        montoTotal: '',
        fechaInicio: '',
        tipoComprobante: '',
        descripcion: '',
      },
    ]);
  };

  const updateBloque = (id: number, field: keyof GastoBlock, value: any) => {
    setBloques(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  return (
    <div>
      {bloques.map((block, idx) => (
        <GastoDetalle
          key={block.id}
          n={idx + 1}
          block={block}
          onChange={(field, value) => updateBloque(block.id, field, value)}
          onAgregar={addBloque}
          onAgregarGasto={onAgregarGasto}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
}
