import { useState, useEffect } from 'react';
import {
  Plus, Calendar, ArrowLeft, CheckCircle2, XCircle,
  Send, Clock, BadgeCheck, Loader2, Search, UploadCloud,
  FileText, ScanLine, FileCheck
} from 'lucide-react';
import FileDropZone from '../../components/UI/FileDropZone';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  GastoItem, GastoStatus,
  createGasto, updateGasto,
  liquidateGasto, rejectGasto,
  sendGastoToManager, sendGastoToAccountant,
} from '../../api/gastos';
import { searchSapFactura, extractXmlData } from '../../api/sap';
import { extractOcrData } from '../../api/ocr';
import { uploadGastoArchivo } from '../../api/archivos';

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

const ORIGEN_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  ELECTRONICA: 'Electrónica (SAP)',
  NO_ELECTRONICA: 'Física (OCR)',
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

interface GastoFormState {
  id: string;
  form: {
    tipo: 'RECIBO' | 'FACTURA' | 'OTRO';
    origen: 'MANUAL' | 'ELECTRONICA' | 'NO_ELECTRONICA';
    amount: string;
    currency: string;
    description: string;
    nitProveedor: string;
    razonSocial: string;
    numeroFactura: string;
    fechaEmision: string;
    subtotal: string;
    iva: string;
    sapDocId: string;
    ocrConfidence: string;
  };
  attachedFile: File | null;
  filePreviewUrl: string | null;
  sapSearchTerm: string;
  sapSearchFecha: string;
  sapResults: any[];
}

interface RegistrarGastoProps {
  mode?: 'create' | 'view' | 'edit';
  initialData?: GastoItem | null;
  onSuccess?: (gastos: GastoItem | GastoItem[]) => void;
  onCancel?: () => void;
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

  const createEmptyForm = (): GastoFormState => ({
    id: Math.random().toString(36).substring(7),
    form: {
      tipo: 'FACTURA',
      origen: 'ELECTRONICA',
      amount: '',
      currency: 'COP',
      description: '',
      nitProveedor: '',
      razonSocial: '',
      numeroFactura: '',
      fechaEmision: '',
      subtotal: '',
      iva: '',
      sapDocId: '',
      ocrConfidence: '',
    },
    attachedFile: null,
    filePreviewUrl: null,
    sapSearchTerm: '',
    sapSearchFecha: '',
    sapResults: [],
  });

  const [formsList, setFormsList] = useState<GastoFormState[]>([createEmptyForm()]);
  const [activeIndex, setActiveIndex] = useState(0);

  const currentFormState = formsList[activeIndex] || formsList[0];
  const form = currentFormState.form;
  const attachedFile = currentFormState.attachedFile;
  const filePreviewUrl = currentFormState.filePreviewUrl;
  const sapSearchTerm = currentFormState.sapSearchTerm;
  const sapSearchFecha = currentFormState.sapSearchFecha;
  const sapResults = currentFormState.sapResults;

  const [isSearchingSap, setIsSearchingSap] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  useEffect(() => {
    if (initialData) {
      setGasto(initialData);
      setFormsList([{
        id: 'edit-1',
        form: {
          tipo: initialData.tipo,
          origen: initialData.origen,
          amount: String(initialData.amount),
          currency: initialData.currency ?? 'COP',
          description: initialData.description ?? '',
          nitProveedor: initialData.nitProveedor ?? '',
          razonSocial: initialData.razonSocial ?? '',
          numeroFactura: initialData.numeroFactura ?? '',
          fechaEmision: initialData.fechaEmision ? new Date(initialData.fechaEmision).toISOString().split('T')[0] : '',
          subtotal: initialData.subtotal ? String(initialData.subtotal) : '',
          iva: initialData.iva ? String(initialData.iva) : '',
          sapDocId: initialData.sapDocId ?? '',
          ocrConfidence: initialData.ocrConfidence ? String(initialData.ocrConfidence) : '',
        },
        attachedFile: null,
        filePreviewUrl: null,
        sapSearchTerm: '',
        sapSearchFecha: '',
        sapResults: []
      }]);
    }
  }, [initialData]);

  const updateCurrentForm = (updater: (prev: GastoFormState) => Partial<GastoFormState>) => {
    setFormsList(prev => {
      const newList = [...prev];
      if (!newList[activeIndex]) return prev;
      newList[activeIndex] = { ...newList[activeIndex], ...updater(newList[activeIndex]) };
      return newList;
    });
  };

  const setForm = (updater: Partial<GastoFormState['form']> | ((prev: GastoFormState['form']) => Partial<GastoFormState['form']>)) => {
    updateCurrentForm(prev => {
      const newForm = typeof updater === 'function' ? updater(prev.form) : updater;
      return { form: { ...prev.form, ...newForm } };
    });
  };

  const setField = <K extends keyof typeof form>(k: K, v: typeof form[K]) => {
    updateCurrentForm(prev => ({ form: { ...prev.form, [k]: v } }));
  };

  const setAttachedFile = (file: File | null) => {
    updateCurrentForm(prev => {
      if (prev.filePreviewUrl) URL.revokeObjectURL(prev.filePreviewUrl);
      return {
        attachedFile: file,
        filePreviewUrl: file ? URL.createObjectURL(file) : null
      };
    });
  };

  const setSapSearchTerm = (val: string) => updateCurrentForm(() => ({ sapSearchTerm: val }));
  const setSapSearchFecha = (val: string) => updateCurrentForm(() => ({ sapSearchFecha: val }));
  const setSapResults = (val: any[]) => updateCurrentForm(() => ({ sapResults: val }));

  // ─── Simuladores SAP y OCR ────────────────────────────────────────────────

  const handleSapSearch = async () => {
    setIsSearchingSap(true);
    setSapResults([]); // clear previous results
    try {
      const results = await searchSapFactura(sapSearchTerm, sapSearchFecha);
      setSapResults(results);
      if (results.length === 0) {
        notify('No se encontraron facturas con esos criterios', 'info');
      }
    } catch (err: any) {
      notify(err.response?.data?.message ?? 'Error buscando en SAP', 'error');
    } finally {
      setIsSearchingSap(false);
    }
  };

  const handleSelectSapFactura = (data: any) => {
    setForm(prev => ({
      ...prev,
      tipo: 'FACTURA',
      nitProveedor: data.nitProveedor,
      razonSocial: data.razonSocial,
      numeroFactura: data.numeroFactura,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision).toISOString().split('T')[0] : '',
      subtotal: String(data.subtotal),
      iva: String(data.iva),
      amount: String(data.amount),
      description: data.description,
      sapDocId: data.sapDocId,
    }));
    setSapResults([]); // hide list after selection
    notify('Datos recuperados de SAP exitosamente', 'success');
  };

  const handleXmlUpload = async (file: File) => {
    setIsSearchingSap(true); // Reusamos el estado de carga
    try {
      const result = await extractXmlData(file);
      setAttachedFile(file);
      setForm(prev => ({
        ...prev,
        tipo: 'FACTURA',
        nitProveedor: result.nitProveedor || '',
        razonSocial: result.razonSocial || '',
        numeroFactura: result.numeroFactura || '',
        fechaEmision: result.fechaEmision ? new Date(result.fechaEmision).toISOString().split('T')[0] : '',
        subtotal: result.subtotal ? String(result.subtotal) : '',
        iva: result.iva ? String(result.iva) : '',
        amount: result.amount ? String(result.amount) : '',
        description: result.description || 'Lectura desde XML Electrónico',
      }));
      notify('Documento XML procesado exitosamente', 'success');
    } catch (err: any) {
      notify(err.response?.data?.message ?? 'Error procesando el archivo XML', 'error');
    } finally {
      setIsSearchingSap(false);
    }
  };

  const handleOcrUpload = async (file: File) => {
    setIsProcessingOcr(true);
    try {
      const result = await extractOcrData(file);
      const data = result.extractedData;
      setAttachedFile(file);
      setForm(prev => ({
        ...prev,
        tipo: 'FACTURA',
        nitProveedor: data.nitProveedor || '',
        razonSocial: data.razonSocial || '',
        numeroFactura: data.numeroFactura || '',
        fechaEmision: data.fechaEmision ? new Date(data.fechaEmision).toISOString().split('T')[0] : '',
        subtotal: data.subtotal ? String(data.subtotal) : '',
        iva: data.iva ? String(data.iva) : '',
        amount: data.amount ? String(data.amount) : '',
        description: data.description || 'Extracción por OCR',
        ocrConfidence: String(result.ocrConfidence),
      }));
      notify('Documento procesado por IA. Por favor verifica los datos extraídos.', 'info');
    } catch (err: any) {
      notify(err.response?.data?.message ?? 'Error procesando la imagen', 'error');
    } finally {
      setIsProcessingOcr(false);
    }
  };


  // ─── Create / Edit ──────────────────────────────────────────────────────

  const handleAddAnother = () => {
    for (let i = 0; i < formsList.length; i++) {
      if (!formsList[i].form.amount || Number(formsList[i].form.amount) <= 0) {
        setActiveIndex(i);
        notify(`Completa el monto del Gasto ${i + 1} antes de agregar otro.`, 'error');
        return;
      }
    }
    setFormsList([...formsList, createEmptyForm()]);
    setActiveIndex(formsList.length);
  };

  const handleSave = async () => {
    for (let i = 0; i < formsList.length; i++) {
      if (!formsList[i].form.amount || Number(formsList[i].form.amount) <= 0) {
        setActiveIndex(i);
        notify(`El monto debe ser mayor a cero en el Gasto ${i + 1}.`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const legId = defaultLegalizacionId ?? gasto?.legalizacionId;
        const savedGastos: GastoItem[] = [];
        
        for (let i = 0; i < formsList.length; i++) {
          const item = formsList[i];
          const payload = {
            amount: Number(item.form.amount),
            currency: item.form.currency,
            description: item.form.description || undefined,
            tipo: item.form.tipo,
            origen: item.form.origen,
            nitProveedor: item.form.nitProveedor || undefined,
            razonSocial: item.form.razonSocial || undefined,
            numeroFactura: item.form.numeroFactura || undefined,
            fechaEmision: item.form.fechaEmision ? new Date(item.form.fechaEmision).toISOString() : undefined,
            subtotal: item.form.subtotal ? Number(item.form.subtotal) : undefined,
            iva: item.form.iva ? Number(item.form.iva) : undefined,
            sapDocId: item.form.sapDocId || undefined,
            ocrConfidence: item.form.ocrConfidence ? Number(item.form.ocrConfidence) : undefined,
          };

          const saved = await createGasto({ ...payload, ...(legId ? { legalizacionId: legId } : {}) });
          if (item.attachedFile) {
            try {
              await uploadGastoArchivo(saved.id, item.attachedFile);
            } catch (err: any) {
              notify(`El gasto ${i+1} se guardó, pero falló la subida del archivo.`, 'error');
            }
          }
          savedGastos.push(saved);
        }
        
        notify(`${savedGastos.length} gasto(s) registrado(s) correctamente.`, 'success');
        onSuccess?.(savedGastos);
      } else {
        if (!gasto) return;
        const item = formsList[0];
        const payload = {
          amount: Number(item.form.amount),
          currency: item.form.currency,
          description: item.form.description || undefined,
          tipo: item.form.tipo,
          origen: item.form.origen,
          nitProveedor: item.form.nitProveedor || undefined,
          razonSocial: item.form.razonSocial || undefined,
          numeroFactura: item.form.numeroFactura || undefined,
          fechaEmision: item.form.fechaEmision ? new Date(item.form.fechaEmision).toISOString() : undefined,
          subtotal: item.form.subtotal ? Number(item.form.subtotal) : undefined,
          iva: item.form.iva ? Number(item.form.iva) : undefined,
          sapDocId: item.form.sapDocId || undefined,
          ocrConfidence: item.form.ocrConfidence ? Number(item.form.ocrConfidence) : undefined,
        };
        const saved = await updateGasto(gasto.id, payload);
        if (item.attachedFile) {
           await uploadGastoArchivo(saved.id, item.attachedFile);
        }
        notify('Gasto actualizado correctamente.', 'success');
        setGasto(saved);
        onSuccess?.(saved);
      }
    } catch (err: any) {
      notify(err.response?.data?.message ?? err.message ?? 'Error al guardar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Transitions ────────────────────────────────────────────────────────

  const doTransition = async (action: () => Promise<GastoItem>, successMsg: string) => {
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

  // ─── Permissions ────────────────────────────────────────────────────────
  const canSendToManager = currentStatus === 'CREADO' && (isCreator || isAdmin);
  const canSendToAccountant = currentStatus === 'ENVIADO_A_JEFE' && (isManager || isAdmin);
  const canLiquidate = currentStatus === 'ENVIADO_A_CONTABILIDAD' && (isAccountant || isAdmin);
  const canReject = ['ENVIADO_A_JEFE', 'ENVIADO_A_CONTABILIDAD'].includes(currentStatus) && (isAccountant || isAdmin || isManager);
  const canEdit = mode === 'edit' && currentStatus === 'CREADO' && (isCreator || isAdmin);


  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-[#E8450A]">
            <ReceiptIcon origen={form.origen} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1F36]">
              {mode === 'create' ? 'Nuevo Gasto' : mode === 'edit' ? 'Editar Gasto' : 'Detalle del Gasto'}
            </h3>
            {gasto && (
              <p className="text-xs text-gray-400 font-medium">ID #{gasto.id} · Creado por {gasto.createdBy?.name ?? gasto.createdBy?.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {gasto && (
            <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[currentStatus]}`}>
              {STATUS_LABELS[currentStatus]}
            </span>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
          )}
        </div>
      </div>

      {mode === 'create' && (
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto bg-white">
          {formsList.map((f, i) => (
            <button 
              key={f.id} 
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeIndex === i ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'}`}
            >
              Gasto {i + 1}
              {formsList.length > 1 && (
                <XCircle size={16} className="text-gray-400 hover:text-red-500 ml-1 transition-colors" onClick={(e) => { 
                  e.stopPropagation(); 
                  const newList = formsList.filter((_, idx) => idx !== i);
                  setFormsList(newList);
                  if (activeIndex >= newList.length - 1) setActiveIndex(newList.length - 2 >= 0 ? newList.length - 2 : 0);
                }} />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="p-6">
        {/* Timeline */}
        {gasto && (mode === 'view' || mode === 'edit') && (
          <ProgressTimeline status={currentStatus} />
        )}

        {/* Origen Selector (Solo en Create Mode) */}
        {mode === 'create' && (
          <div className="mb-8">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">¿Cómo deseas registrar este gasto?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OrigenOption 
                icon={<UploadCloud size={20} />} title="Factura Electrónica" desc="Obtener datos directo de SAP" 
                active={form.origen === 'ELECTRONICA'} onClick={() => { setField('origen', 'ELECTRONICA'); setAttachedFile(null); setSapSearchTerm(''); }} 
              />
              <OrigenOption 
                icon={<ScanLine size={20} />} title="Factura Física (OCR)" desc="Subir PDF/foto y extraer con IA" 
                active={form.origen === 'NO_ELECTRONICA'} onClick={() => { setField('origen', 'NO_ELECTRONICA'); setAttachedFile(null); setSapSearchTerm(''); }} 
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── Columna Izquierda: Asistentes (SAP/OCR) y Formulario ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Buscador SAP */}
            {(form.origen === 'ELECTRONICA' && (mode === 'create' || form.sapDocId)) && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2 text-sm">
                  <FileText size={16} />
                  Búsqueda Electrónica en SAP
                </div>
                {mode === 'create' && !form.sapDocId ? (
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar por NIT..."
                          value={sapSearchTerm}
                          onChange={e => setSapSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="date"
                          value={sapSearchFecha}
                          onChange={e => setSapSearchFecha(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                      <button 
                        onClick={handleSapSearch} disabled={isSearchingSap}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                      >
                        {isSearchingSap ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
                      </button>
                    </div>

                    {sapResults.length > 0 && (
                      <div className="mt-4 bg-white border border-blue-100 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-800">Resultados encontrados ({sapResults.length})</span>
                          <button onClick={() => setSapResults([])} className="text-gray-400 hover:text-red-500"><XCircle size={14} /></button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          <ul className="divide-y divide-gray-100">
                            {sapResults.map((res: any, idx: number) => (
                              <li key={idx} className="p-3 hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => handleSelectSapFactura(res)}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{res.razonSocial}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      <span>NIT: {res.nitProveedor}</span>
                                      <span>Factura: {res.numeroFactura}</span>
                                      <span>Emisión: {res.fechaEmision}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">${res.amount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">{res.sapDocId}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/50 px-3 py-2 rounded-lg mt-2 border border-blue-100 font-medium">
                    <FileCheck size={16} />
                    Documento vinculado a SAP ID: <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200">{form.sapDocId}</span>
                  </div>
                )}
              </div>
            )}

            {/* Subida OCR */}
            {form.origen === 'NO_ELECTRONICA' && mode === 'create' && (
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3 text-sm">
                  <ScanLine size={16} />
                  Extracción por IA (OCR)
                </div>
                {attachedFile ? (
                  <div className="border-2 border-green-200 bg-green-50/50 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-800 truncate">{attachedFile.name}</p>
                        <p className="text-xs text-green-600">{(attachedFile.size / 1024).toFixed(1)} KB · Se adjuntará al guardar</p>
                      </div>
                      <button type="button" onClick={() => setAttachedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <XCircle size={18} />
                      </button>
                    </div>
                    {form.ocrConfidence && (
                      <div className="mt-3 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-green-200">
                        <span className="text-xs font-medium text-green-800">Confianza de IA:</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{form.ocrConfidence}% Precisión</span>
                      </div>
                    )}
                    <label className="mt-3 flex items-center justify-center gap-2 text-xs text-purple-600 font-medium cursor-pointer hover:underline">
                      <input type="file" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleOcrUpload(e.target.files[0]);
                      }} />
                      Cambiar archivo
                    </label>
                  </div>
                ) : (
                  <>
                    <label className="border-2 border-dashed border-purple-200 bg-white rounded-xl p-8 text-center hover:bg-purple-50/30 transition-colors cursor-pointer block">
                      <input type="file" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleOcrUpload(e.target.files[0]);
                        }
                      }} />
                      {isProcessingOcr ? (
                        <div className="flex flex-col items-center text-purple-600">
                          <Loader2 size={32} className="animate-spin mb-3" />
                          <span className="text-sm font-medium">Analizando documento con Inteligencia Artificial...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                            <Plus size={24} />
                          </div>
                          <span className="text-sm font-medium text-gray-700 mb-1">Sube el PDF o foto de la factura física</span>
                          <span className="text-xs text-gray-400">PDF, JPG o PNG hasta 5MB. Se adjuntará automáticamente al guardar.</span>
                        </div>
                      )}
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Formulario de Datos */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-700">Detalles de la Factura</h4>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                {/* Fila 1: Proveedor */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">NIT del Proveedor</label>
                  <input type="text" value={form.nitProveedor} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('nitProveedor', e.target.value)} placeholder="Ej: 900.123.456-7" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Razón Social</label>
                  <input type="text" value={form.razonSocial} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('razonSocial', e.target.value)} placeholder="Ej: Proveedor S.A.S" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500" />
                </div>

                {/* Fila 2: Factura */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Número de Factura</label>
                  <input type="text" value={form.numeroFactura} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('numeroFactura', e.target.value)} placeholder="Ej: FE-1029" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Fecha de Emisión</label>
                  <input type="date" value={form.fechaEmision} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('fechaEmision', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500" />
                </div>

                {/* Fila 3: Valores */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Subtotal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input type="number" value={form.subtotal} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('subtotal', e.target.value)} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">IVA</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input type="number" value={form.iva} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('iva', e.target.value)} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500" />
                  </div>
                </div>

                <div className="col-span-2 border-t border-gray-100 pt-5 mt-2">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-gray-800 mb-1.5 block">Valor Total *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold">$</span>
                        <input type="number" value={form.amount} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('amount', e.target.value)} className="w-full pl-7 pr-3 py-2.5 text-base font-bold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-100 disabled:text-gray-600" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tipo de Documento</label>
                      <select value={form.tipo} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('tipo', e.target.value as typeof form.tipo)} className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] disabled:bg-gray-50/80 disabled:text-gray-500">
                        {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fila 5: Concepto */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Concepto / Descripción</label>
                  <textarea value={form.description} disabled={isReadOnly || (!canEdit && mode !== 'create')} onChange={e => setField('description', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8450A]/20 focus:border-[#E8450A] resize-none disabled:bg-gray-50/80 disabled:text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Columna Derecha: Archivo + Flujo ── */}
          <div className="space-y-5">
            {/* Archivo adjunto (preview del archivo cargado desde OCR) */}
            {attachedFile && filePreviewUrl && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700">Archivo Adjunto</h4>
                  <button type="button" onClick={() => setAttachedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <XCircle size={16} />
                  </button>
                </div>
                <div className="p-3">
                  {attachedFile.type.startsWith('image/') ? (
                    <img src={filePreviewUrl} alt="Preview" className="w-full rounded-lg border border-gray-200 max-h-64 object-contain bg-gray-50" />
                  ) : attachedFile.type === 'application/pdf' ? (
                    <iframe src={filePreviewUrl} title="PDF Preview" className="w-full h-64 rounded-lg border border-gray-200" />
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 font-medium truncate">{attachedFile.name}</p>
                  <span className="text-xs text-green-500 ml-auto whitespace-nowrap">{(attachedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}

            {/* Flujo de aprobación */}
            {(mode === 'view' || mode === 'edit') && gasto && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Flujo de Aprobación</h4>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Estado actual:</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${STATUS_COLORS[currentStatus]}`}>{STATUS_LABELS[currentStatus]}</span>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-200">
                  {currentStatus === 'CREADO' && (isCreator || isAdmin) && (
                    <>
                      <p className="text-xs text-gray-500">Revisa los datos antes de enviar a aprobación.</p>
                      {canSendToManager && (
                        <button disabled={loading} onClick={() => doTransition(() => sendGastoToManager(gasto.id), 'Gasto enviado al jefe.')} className="w-full py-2.5 flex items-center justify-center gap-2 bg-[#E8450A] text-white text-sm font-bold rounded-xl hover:bg-[#E8450A]/90 transition-colors shadow-sm disabled:opacity-50">
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar a Aprobación
                        </button>
                      )}
                    </>
                  )}

                  {canSendToAccountant && (
                    <div className="space-y-2">
                      <button disabled={loading} onClick={() => doTransition(() => sendGastoToAccountant(gasto.id), 'Gasto enviado a contabilidad.')} className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar a Contabilidad
                      </button>
                      {canReject && (
                        <button disabled={loading} onClick={() => doTransition(() => rejectGasto(gasto.id, 'Rechazado por jefe'), 'Gasto rechazado.')} className="w-full py-2.5 flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Rechazar
                        </button>
                      )}
                    </div>
                  )}

                  {currentStatus === 'ENVIADO_A_CONTABILIDAD' && (isAccountant || isAdmin) && (
                    <div className="space-y-2">
                      {canLiquidate && (
                        <button disabled={loading} onClick={() => doTransition(() => liquidateGasto(gasto.id), '¡Liquidado exitosamente!')} className="w-full py-2.5 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />} Aprobar y Liquidar
                        </button>
                      )}
                      {canReject && (
                        <button disabled={loading} onClick={() => doTransition(() => rejectGasto(gasto.id, 'Rechazado por contabilidad'), 'Gasto rechazado.')} className="w-full py-2.5 flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Rechazar
                        </button>
                      )}
                    </div>
                  )}

                  {currentStatus === 'LIQUIDADO' && (
                    <div className="bg-green-50 text-green-700 font-bold p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2 shadow-sm">
                      <CheckCircle2 size={18} /> Gasto Liquidado
                    </div>
                  )}

                  {currentStatus === 'RECHAZADO' && (
                    <div className="bg-red-50 text-red-700 font-bold p-3 rounded-xl border border-red-200 flex items-center justify-center gap-2 shadow-sm">
                      <XCircle size={18} /> Gasto Rechazado
                    </div>
                  )}

                  {!canSendToManager && !canSendToAccountant && !canLiquidate && !canReject && !['LIQUIDADO', 'RECHAZADO'].includes(currentStatus) && (
                    <div className="bg-gray-100 text-gray-500 font-medium p-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-sm">
                      <Clock size={16} /> Esperando revisión
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Botones inferiores ── */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {mode === 'create' && (
            <>
              <button onClick={handleAddAnother} type="button" className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#E8450A] bg-white border-2 border-[#E8450A]/20 rounded-xl hover:bg-[#E8450A]/5 transition-colors shadow-sm">
                <Plus size={18} /> Agregar Otro
              </button>
              <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#1A1F36] rounded-xl hover:bg-[#1A1F36]/90 transition-colors shadow-md disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Registrar {formsList.length > 1 ? `Gastos (${formsList.length})` : 'Gasto'}
              </button>
            </>
          )}
          {canEdit && (
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#E8450A] rounded-xl hover:bg-[#E8450A]/90 transition-colors shadow-md disabled:opacity-60">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null} Guardar Cambios
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componentes Auxiliares ───────────────────────────────────────────────────

function ReceiptIcon({ origen }: { origen: string }) {
  if (origen === 'ELECTRONICA') return <UploadCloud size={20} />;
  if (origen === 'NO_ELECTRONICA') return <ScanLine size={20} />;
  return <FileText size={20} />;
}

function OrigenOption({ icon, title, desc, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`cursor-pointer border-2 rounded-xl p-4 transition-all flex items-start gap-3 ${active ? 'border-[#E8450A] bg-[#E8450A]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
      <div className={`p-2 rounded-lg ${active ? 'bg-[#E8450A] text-white' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div>
        <h5 className={`text-sm font-bold ${active ? 'text-gray-900' : 'text-gray-700'}`}>{title}</h5>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
