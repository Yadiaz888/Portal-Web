import { useState, useEffect } from 'react';
import {
  Plus, Calendar, ArrowLeft, CheckCircle2, XCircle,
  Send, Clock, BadgeCheck, Loader2
} from 'lucide-react';
import FileDropZone from '../../components/UI/FileDropZone';
import StatusBadge from '../../components/UI/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  GastoItem, GastoStatus,
  createGasto, updateGasto,
  sendGastoToManager, sendGastoToAccountant,
  liquidateGasto, rejectGasto,
} from '../../api/gastos';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<GastoStatus, string> = {
  CREADO: 'Creado',
  ENVIADO_A_JEFE: 'Enviado a Jefe',
  ENVIADO_A_CONTABILIDAD: 'Enviado a Contabilidad',
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

// ─── Timeline step ────────────────────────────────────────────────────────────

const STEPS: { key: GastoStatus; label: string }[] = [
  { key: 'CREADO', label: 'Creado' },
  { key: 'ENVIADO_A_JEFE', label: 'Jefe' },
  { key: 'ENVIADO_A_CONTABILIDAD', label: 'Contabilidad' },
  { key: 'LIQUIDADO', label: 'Liquidado' },
];

const STEP_ORDER: Record<GastoStatus, number> = {
  CREADO: 0,
  ENVIADO_A_JEFE: 1,
  ENVIADO_A_CONTABILIDAD: 2,
  LIQUIDADO: 3,
  RECHAZADO: -1,
};

function ProgressTimeline({ status }: { status: GastoStatus }) {
  const currentIdx = STEP_ORDER[status] ?? -1;
  const isRejected = status === 'RECHAZADO';

  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => {
        const done = !isRejected && currentIdx > i;
        const active = !isRejected && currentIdx === i;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all
                ${done ? 'bg-green-500 border-green-500 text-white' :
                  active ? 'bg-[#E8450A] border-[#E8450A] text-white shadow-md shadow-[#E8450A]/30' :
                  'bg-white border-gray-200 text-gray-400'}`}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`mt-1 text-[10px] font-semibold whitespace-nowrap
                ${done ? 'text-green-600' : active ? 'text-[#E8450A]' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-14px]
                ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RegistrarGastoProps {
  mode?: 'create' | 'view' | 'edit';
  initialData?: GastoItem | null;
  /** called after a successful save/create or state transition */
  onSuccess?: (gasto: GastoItem) => void;
  onCancel?: () => void;
  /** legalizacionId required when creating */
  defaultLegalizacionId?: number;
}

export default function RegistrarGasto({
  mode = 'create',
  initialData,
  onSuccess,
  onCancel,
  defaultLegalizacionId,
}: RegistrarGastoProps) {
  const isReadOnly = mode === 'view';
  const { user } = useAuth();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [gasto, setGasto] = useState<GastoItem | null>(initialData ?? null);

  const role: string = (user as any)?.role?.name ?? (user as any)?.role ?? '';
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isAccountant = role === 'ACCOUNTANT';
  const currentUserId = user?.id;

  const currentStatus: GastoStatus = gasto?.status ?? 'CREADO';
  const isCreator = gasto?.createdById === currentUserId;

  const [form, setForm] = useState({
    tipo: 'FACTURA' as 'RECIBO' | 'FACTURA' | 'OTRO',
    amount: '',
    description: '',
    currency: 'COP',
  });

  useEffect(() => {
    if (initialData) {
      setGasto(initialData);
      setForm({
        tipo: initialData.tipo,
        amount: String(initialData.amount),
        description: initialData.description ?? '',
        currency: initialData.currency ?? 'COP',
      });
    }
  }, [initialData]);

  const setField = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // ─── Create / Edit ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      notify('El monto debe ser mayor a cero.', 'error');
      return;
    }
    setLoading(true);
    try {
      let saved: GastoItem;
      if (mode === 'create') {
        const legId = defaultLegalizacionId ?? gasto?.legalizacionId;
        if (!legId) {
          notify('No se encontró la legalización asociada.', 'error');
          return;
        }
        saved = await createGasto({
          amount: Number(form.amount),
          currency: form.currency,
          description: form.description || undefined,
          tipo: form.tipo,
          legalizacionId: legId,
        });
        notify('Gasto registrado correctamente.', 'success');
      } else {
        if (!gasto) return;
        saved = await updateGasto(gasto.id, {
          amount: Number(form.amount),
          description: form.description || undefined,
          tipo: form.tipo,
        });
        notify('Gasto actualizado correctamente.', 'success');
      }
      setGasto(saved);
      onSuccess?.(saved);
    } catch (err: any) {
      notify(err.response?.data?.message ?? err.message ?? 'Error al guardar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Transitions ────────────────────────────────────────────────────────

  const doTransition = async (
    action: () => Promise<GastoItem>,
    successMsg: string,
  ) => {
    setLoading(true);
    try {
      const updated = await action();
      setGasto(updated);
      notify(successMsg, 'success');
      onSuccess?.(updated);
    } catch (err: any) {
      notify(err.response?.data?.message ?? err.message ?? 'Error al cambiar estado.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Button visibility matrix ───────────────────────────────────────────
  // CREADO        → "Enviar a aprobación" visible para creator/ADMIN
  // ENVIADO_A_JEFE→ "Enviar a contabilidad" visible para MANAGER/ADMIN
  // ENVIADO_A_CONTABILIDAD → "Aprobar (Liquidar)" + "Rechazar" para ACCOUNTANT/ADMIN
  // RECHAZADO/LIQUIDADO → solo info

  const canSendToManager =
    currentStatus === 'CREADO' && (isCreator || isAdmin);

  const canSendToAccountant =
    currentStatus === 'ENVIADO_A_JEFE' && (isManager || isAdmin);

  const canLiquidate =
    currentStatus === 'ENVIADO_A_CONTABILIDAD' && (isAccountant || isAdmin);

  const canReject =
    ['ENVIADO_A_JEFE', 'ENVIADO_A_CONTABILIDAD'].includes(currentStatus) &&
    (isAccountant || isAdmin || isManager);

  const canEdit =
    mode === 'edit' && currentStatus === 'CREADO' && (isCreator || isAdmin);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <span className="text-sm">🧾</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1F36]">
              {mode === 'create' ? 'Nuevo Gasto' :
                mode === 'edit' ? 'Editar Gasto' :
                'Detalle del Gasto'}
            </h3>
            {gasto && (
              <p className="text-xs text-gray-400">ID #{gasto.id} · {gasto.createdBy?.name ?? gasto.createdBy?.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gasto && (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[currentStatus]}`}>
              {STATUS_LABELS[currentStatus]}
            </span>
          )}
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
      </div>

      <div className="p-6">
        {/* Timeline (solo en view/edit cuando hay gasto) */}
        {gasto && (mode === 'view' || mode === 'edit') && (
          <ProgressTimeline status={currentStatus} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Formulario ── */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Datos del Gasto
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de Comprobante *</label>
                <select
                  value={form.tipo}
                  disabled={isReadOnly || (!canEdit && mode !== 'create')}
                  onChange={e => setField('tipo', e.target.value as typeof form.tipo)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {Object.entries(TIPO_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Monto *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    value={form.amount}
                    disabled={isReadOnly || (!canEdit && mode !== 'create')}
                    onChange={e => setField('amount', e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Moneda */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Moneda</label>
                <select
                  value={form.currency}
                  disabled={isReadOnly || (!canEdit && mode !== 'create')}
                  onChange={e => setField('currency', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              {/* Fecha (readonly, viene del backend) */}
              {gasto && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha de Registro</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={new Date(gasto.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      readOnly
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                <textarea
                  value={form.description}
                  disabled={isReadOnly || (!canEdit && mode !== 'create')}
                  onChange={e => setField('description', e.target.value)}
                  rows={3}
                  placeholder="Descripción del gasto..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* ── Panel derecho: archivo + flujo ── */}
          <div className="space-y-4">
            <FileDropZone label="Agregar soporte" buttonLabel="Cargar Documento" />

            {/* Flujo de aprobación */}
            {(mode === 'view' || mode === 'edit') && gasto && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Flujo de Aprobación
                </h4>

                {/* Estado actual */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Estado actual:</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_COLORS[currentStatus]}`}>
                    {STATUS_LABELS[currentStatus]}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {/* CREADO: Editar + Enviar a jefe */}
                  {currentStatus === 'CREADO' && (isCreator || isAdmin) && (
                    <>
                      <p className="text-xs text-gray-400 italic">
                        Revisa los datos antes de enviar a aprobación.
                      </p>
                      {canSendToManager && (
                        <button
                          disabled={loading}
                          onClick={() => doTransition(
                            () => sendGastoToManager(gasto.id),
                            'Gasto enviado a aprobación del jefe.'
                          )}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-[#E8450A] text-white text-xs font-semibold rounded-lg hover:bg-[#E8450A]/90 transition-colors disabled:opacity-60"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          Enviar a Aprobación
                        </button>
                      )}
                    </>
                  )}

                  {/* ENVIADO_A_JEFE: Enviar a contabilidad (MANAGER/ADMIN) */}
                  {canSendToAccountant && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 italic">
                        Como jefe, puedes enviar este gasto a contabilidad.
                      </p>
                      <button
                        disabled={loading}
                        onClick={() => doTransition(
                          () => sendGastoToAccountant(gasto.id),
                          'Gasto enviado a contabilidad.'
                        )}
                        className="w-full py-2 flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Enviar a Contabilidad
                      </button>
                      {canReject && (
                        <button
                          disabled={loading}
                          onClick={() => doTransition(
                            () => rejectGasto(gasto.id, 'Rechazado por jefe'),
                            'Gasto rechazado.'
                          )}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Rechazar
                        </button>
                      )}
                    </div>
                  )}

                  {/* ENVIADO_A_CONTABILIDAD: Aprobar (liquidar) + Rechazar (ACCOUNTANT/ADMIN) */}
                  {currentStatus === 'ENVIADO_A_CONTABILIDAD' && (isAccountant || isAdmin) && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 italic">
                        Como contabilidad, puedes aprobar o rechazar este gasto.
                      </p>
                      {canLiquidate && (
                        <button
                          disabled={loading}
                          onClick={() => doTransition(
                            () => liquidateGasto(gasto.id),
                            '¡Gasto liquidado exitosamente!'
                          )}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                          Aprobar y Liquidar
                        </button>
                      )}
                      {canReject && (
                        <button
                          disabled={loading}
                          onClick={() => doTransition(
                            () => rejectGasto(gasto.id, 'Rechazado por contabilidad'),
                            'Gasto rechazado.'
                          )}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Rechazar
                        </button>
                      )}
                    </div>
                  )}

                  {/* LIQUIDADO */}
                  {currentStatus === 'LIQUIDADO' && (
                    <p className="text-xs text-green-700 font-semibold text-center bg-green-50 py-2 rounded-lg border border-green-100 flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> Gasto Liquidado
                    </p>
                  )}

                  {/* RECHAZADO */}
                  {currentStatus === 'RECHAZADO' && (
                    <p className="text-xs text-red-700 font-semibold text-center bg-red-50 py-2 rounded-lg border border-red-100 flex items-center justify-center gap-1">
                      <XCircle size={14} /> Gasto Rechazado
                    </p>
                  )}

                  {/* Usuario sin acciones en este estado */}
                  {!canSendToManager && !canSendToAccountant && !canLiquidate && !canReject &&
                    !['LIQUIDADO', 'RECHAZADO'].includes(currentStatus) && (
                    <p className="text-xs text-gray-400 text-center bg-gray-50 py-2 rounded-lg border border-gray-100 flex items-center justify-center gap-1">
                      <Clock size={12} /> Esperando acción del siguiente responsable
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Botones inferiores ── */}
        <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
          {mode === 'create' && (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1A1F36] rounded-lg hover:bg-[#1A1F36]/90 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Registrar Gasto
              </button>
              <button
                onClick={() => setForm({ tipo: 'FACTURA', amount: '', description: '', currency: 'COP' })}
                className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
            </>
          )}
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#E8450A] rounded-lg hover:bg-[#E8450A]/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Guardar Cambios
            </button>
          )}
          {isReadOnly && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver al listado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
