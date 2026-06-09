interface StatusBadgeProps {
  status: string;
}

const styleMap: Record<string, string> = {
  Creado: 'border border-gray-300 text-gray-600 bg-white',
  Creada: 'border border-gray-300 text-gray-600 bg-white',
  'Enviado a Aprobacion': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Aprobado Jefe': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'Aprobado Contabilidad': 'bg-blue-50 text-blue-700 border border-blue-200',
  'En validacion de pago': 'bg-sky-50 text-sky-700 border border-sky-200',
  Aprobado: 'border border-green-500 text-green-700 bg-white',
  Pagado: 'border border-green-500 text-green-700 bg-green-50',
  Pagada: 'border border-green-500 text-green-700 bg-green-50',
  Rechazado: 'bg-red-50 text-red-600 border border-red-200',
  Cancelado: 'bg-gray-50 text-gray-600 border border-gray-200',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = styleMap[status] ?? 'border border-gray-300 text-gray-600 bg-white';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
