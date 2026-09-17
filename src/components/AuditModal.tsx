import React from 'react';
import { FichajeData, TurnoTipo } from '../types';
import { MapPin, ExternalLink, RefreshCw } from 'lucide-react';

interface AuditModalProps {
  isOpen: boolean;
  titulo?: string;
  dia: number | null;
  mesNombre: string;
  data: FichajeData | null;
  turno: TurnoTipo;
  onClose: () => void;
  onAsignarGps?: (campo: 'e1' | 's1' | 'e2' | 's2') => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  isOpen,
  titulo,
  dia,
  mesNombre,
  data,
  turno,
  onClose,
  onAsignarGps,
}) => {
  if (!isOpen || dia === null || !data) return null;

  const bloquesInfo = [
    { id: 'e1' as const, label: turno === 'partido' ? '☀️ Entrada (Mañana)' : '🕒 Entrada', opcional: false },
    { id: 's1' as const, label: turno === 'partido' ? '☀️ Salida (Mañana)' : '🕒 Salida', opcional: false },
    { id: 'e2' as const, label: '🌙 Entrada (Tarde)', opcional: turno !== 'partido' },
    { id: 's2' as const, label: '🌙 Salida (Tarde)', opcional: turno !== 'partido' },
  ];

  const registrosActivos = bloquesInfo.filter((b) => {
    if (b.opcional) return false;
    const val = (data as any)[b.id];
    return Boolean(val && val.trim() !== '');
  });

  return (
    <div
      id="modal-audit-overlay"
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2.5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 w-full max-w-[400px] shadow-xl flex flex-col gap-3 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="modal-audit-titulo"
          className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1 flex justify-between items-center"
        >
          <span>{titulo || `Fichaje e Info: ${dia} de ${mesNombre}`}</span>
        </div>

        {/* Info de fecha de anotación / auditoría */}
        {(() => {
          let fechaAnotacionTxt = '';
          if (data.ultimaModificacion) {
            const d = new Date(data.ultimaModificacion);
            if (!isNaN(d.getTime())) {
              fechaAnotacionTxt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} (${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')})`;
            }
          } else if (data.fechaRegistro) {
            const d = new Date(data.fechaRegistro);
            if (!isNaN(d.getTime())) {
              fechaAnotacionTxt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} (${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')})`;
            }
          }

          return fechaAnotacionTxt ? (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-[11px] text-slate-700 flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">📝 Registrado / Modificado:</span>
                <span className="font-semibold text-slate-900">{fechaAnotacionTxt}</span>
              </div>
            </div>
          ) : null;
        })()}

        <div id="modal-audit-cuerpo" className="flex flex-col gap-2.5 my-1">
          {registrosActivos.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-500 italic">
              No hay horas registradas para este día.
            </div>
          ) : (
            registrosActivos.map((b) => {
              const horaValor = (data as any)[b.id] || '';
              let esManual = false;
              if (data.origen && typeof data.origen === 'object') {
                esManual = data.origen[b.id] === 'MANUAL';
              }

              const tipoTexto = esManual ? 'MANUAL' : 'AUTO';
              const colorFondo = esManual ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-green-100 text-green-800 border border-green-300';
              const coords = data.gps ? data.gps[b.id] : null;

              return (
                <div
                  key={b.id}
                  className="flex flex-col border border-gray-100 bg-gray-50/60 rounded-lg p-2.5 gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">
                      {b.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {horaValor}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colorFondo}`}
                      >
                        {tipoTexto}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px]">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin size={13} className={coords ? 'text-teal-600' : 'text-gray-400'} />
                      {coords ? (
                        <span className="font-mono text-[10px] font-medium text-gray-700">
                          {coords}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Sin coordenadas GPS</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {coords ? (
                        <a
                          href={`https://www.google.com/maps?q=${coords}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#007d7a] text-white px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 hover:bg-[#00605e] transition-colors"
                        >
                          <span>Ver mapa</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : onAsignarGps ? (
                        <button
                          onClick={() => onAsignarGps(b.id)}
                          className="bg-teal-50 text-teal-800 border border-teal-300 hover:bg-teal-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                          title="Obtener coordenadas ahora"
                        >
                          <RefreshCw size={10} />
                          <span>Capturar GPS</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {registrosActivos.length > 0 && (
            <div
              className="mt-1 pt-1.5 border-t border-dashed border-gray-300 text-right text-xs font-bold text-[#007d7a]"
            >
              Total Calculado: {data.t || '00:00'} hrs
            </div>
          )}
        </div>

        <div className="flex justify-end mt-1">
          <button
            id="btn-audit-cerrar"
            onClick={onClose}
            className="py-1.5 px-4 border-none rounded font-bold text-xs cursor-pointer bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
