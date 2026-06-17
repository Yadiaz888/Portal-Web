import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import SolicitarAnticipo from './SolicitarAnticipo';
import { getAnticipos } from '../../api/anticipos';
import { Anticipo } from '../../models/Anticipo';

export default function AnticipoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const navigate = useNavigate();
  const [anticipo, setAnticipo] = useState<Anticipo | null>(null);

  const loadAnticipo = () => {
    if (id) {
      getAnticipos().then(list => {
        const found = list.find(a => a.id === id || a.nSolicitud.replace('N°', '').trim() === id);
        if (found) {
          setAnticipo({ ...found });
        }
      });
    }
  };

  useEffect(() => {
    loadAnticipo();
  }, [id]);

  const steps = [
    { label: 'Solicitud Creada', active: anticipo?.estadoSolicitud !== 'Rechazado', completed: anticipo?.estadoSolicitud !== 'Rechazado' },
    { 
      label: 'Aprobación de Jefe Inmediato', 
      active: anticipo?.estadoSolicitud === 'Enviado a Aprobacion', 
      completed: ['Aprobado Jefe', 'Aprobado Contabilidad', 'En validacion de pago', 'Pagado'].includes(anticipo?.estadoSolicitud || '')
    },
    { 
      label: 'Aprobación de Contabilidad', 
      active: anticipo?.estadoSolicitud === 'Aprobado Jefe', 
      completed: ['Aprobado Contabilidad', 'En validacion de pago', 'Pagado'].includes(anticipo?.estadoSolicitud || '')
    },
    { 
      label: 'En proceso de pago', 
      active: anticipo?.estadoSolicitud === 'Aprobado Contabilidad',
      completed: ['En validacion de pago', 'Pagado'].includes(anticipo?.estadoSolicitud || '')
    },
    {
      label: 'Validacion pasarela',
      active: anticipo?.estadoSolicitud === 'En validacion de pago',
      completed: anticipo?.estadoSolicitud === 'Pagado'
    },
    { 
      label: 'Anticipo Pagado', 
      active: anticipo?.estadoSolicitud === 'Pagado', 
      completed: anticipo?.estadoSolicitud === 'Pagado'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/gestor-anticipos')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1A1F36] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1F36]">Detalle de Anticipo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Anticipo N° {id}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
        <h3 className="text-base font-bold text-[#1A1F36] mb-6">Estado de Solicitud</h3>
        
        {anticipo?.estadoSolicitud === 'Rechazado' && (
          <div className="mb-6 w-full max-w-4xl p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
            Esta solicitud de anticipo ha sido rechazada/cancelada.
          </div>
        )}

        <div className="flex items-center justify-center w-full max-w-4xl">
          {steps.map((step, idx, arr) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center w-32 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 z-10 bg-white ${
                  step.completed 
                    ? 'border-green-500 text-green-500' 
                    : step.active 
                    ? 'border-[#B0003A] text-[#B0003A]' 
                    : 'border-gray-200 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 size={20} className="fill-green-50 text-green-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-current" />
                  )}
                </div>
                <span className={`text-xs text-center font-medium ${
                  step.completed 
                    ? 'text-green-600' 
                    : step.active 
                    ? 'text-[#1A1F36]' 
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div className="w-16 h-[2px] bg-gray-200 -mt-6 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <SolicitarAnticipo mode={isEditing ? 'edit' : 'view'} id={id} onStatusChange={loadAnticipo} />
    </div>
  );
}
