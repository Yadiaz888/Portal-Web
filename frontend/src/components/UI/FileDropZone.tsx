import { Folder, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface UploadedFile {
  id?: number;
  name: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface FileDropZoneProps {
  onFileSelect?: (file: File) => void;
  label?: string;
  buttonLabel?: string;
  disabled?: boolean;
  accept?: string;
  uploadStatus?: UploadedFile[];
}

export default function FileDropZone({
  onFileSelect,
  label = 'Agrega una factura',
  buttonLabel = 'Buscar Documentos',
  disabled,
  accept = '.pdf,.jpg,.jpeg,.png',
  uploadStatus = [],
}: FileDropZoneProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 w-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
        <Folder size={40} className="text-gray-300" />
        <p className="text-sm text-gray-500 text-center">{label}</p>
        <p className="text-xs text-center text-gray-400">
          Suelta los archivos aquí o haga clic en el{' '}
          <label className="text-[#E8450A] cursor-pointer underline">
            enlace
            <input type="file" className="hidden" onChange={handleChange} accept={accept} />
          </label>
        </p>
      </div>
      <label className="w-full">
        <input type="file" className="hidden" onChange={handleChange} accept={accept} />
        <span className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-[#1A1F36] border border-[#1A1F36] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          {buttonLabel}
        </span>
      </label>
      {uploadStatus.length > 0 && (
        <div className="w-full space-y-2">
          {uploadStatus.map((f, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              f.status === 'done' ? 'bg-green-50 text-green-700' :
              f.status === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {f.status === 'uploading' && <Loader2 size={14} className="animate-spin shrink-0" />}
              {f.status === 'done' && <CheckCircle size={14} className="shrink-0" />}
              {f.status === 'error' && <AlertCircle size={14} className="shrink-0" />}
              <span className="truncate flex-1">{f.name}</span>
              {f.error && <span className="text-red-500 text-xs">{f.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
