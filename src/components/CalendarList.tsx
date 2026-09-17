import React from 'react';
import { TurnoTipo, VistaTipo, EstadoDia, CalendarDayItem } from '../types';
import { MESES_NOMBRES, minsATexto } from '../utils/time';

interface CalendarListProps {
  vistaActual: VistaTipo;
  anio: number;
  mes: number;
  dias: CalendarDayItem[];
  horasPorMesAno: number[];
  turno: TurnoTipo;
  onInputChange: (claveId: string, campo: 'e1' | 's1' | 'e2' | 's2', valor: string) => void;
  onInputBlur: (claveId: string, campo: 'e1' | 's1' | 'e2' | 's2') => void;
  onEstadoChange: (claveId: string, estado: EstadoDia) => void;
  onOpenAudit: (diaItem: CalendarDayItem) => void;
  onOpenNota: (diaItem: CalendarDayItem) => void;
  onSeleccionarMesAno: (mesIndex: number) => void;
}

export const CalendarList: React.FC<CalendarListProps> = ({
  vistaActual,
  mes,
  dias,
  horasPorMesAno,
  turno,
  onInputChange,
  onInputBlur,
  onEstadoChange,
  onOpenAudit,
  onOpenNota,
  onSeleccionarMesAno,
}) => {
  if (vistaActual === 'ano') {
    return (
      <div
        id="lista-dias"
        className="calendario-scroll bg-white rounded-md p-1 shadow-xs flex-1 overflow-y-auto flex flex-col gap-1 w-full"
      >
        {MESES_NOMBRES.map((nombreMes, mIndex) => {
          const esMesActual = mIndex === mes;
          const minsMes = horasPorMesAno[mIndex] || 0;
          return (
            <div
              key={mIndex}
              id={`fila-mes-${mIndex}`}
              onClick={() => onSeleccionarMesAno(mIndex)}
              className={`flex justify-between items-center py-2.5 px-3.5 border-b border-gray-100 rounded-md cursor-pointer transition-colors shrink-0 ${
                esMesActual ? 'bg-[#fff3cd]' : 'bg-[#fafafa] hover:bg-[#e2f3ee]'
              }`}
            >
              <span className="font-bold text-gray-800 text-xs sm:text-sm">
                📅 {nombreMes}
              </span>
              <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--teal-header)' }}>
                {minsATexto(minsMes)} hrs ➜
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  const esPartido = turno === 'partido';

  return (
    <div
      id="lista-dias"
      className="calendario-scroll bg-white rounded-md p-1 shadow-xs flex-1 overflow-y-auto flex flex-col gap-1 w-full"
    >
      {dias.map((diaItem) => {
        const data = diaItem.data;
        const tieneNota = Boolean(data.nota && data.nota.trim() !== '');

        const valE1 = data.e1 || '';
        const valS1 = data.s1 || '';
        const valE2 = data.e2 || '';
        const valS2 = data.s2 || '';

        const hayContenido = Boolean(valE1 || valS1 || valE2 || valS2);
        let tieneManual = false;
        if (data.origen && typeof data.origen === 'object') {
          tieneManual = Object.keys(data.origen).some((k) => data.origen?.[k] === 'MANUAL' && (data as any)[k]);
        }
        const tieneGps = Boolean(data.gps && Object.keys(data.gps).length > 0);
        const mostrarIconoInfo = hayContenido && (tieneManual || tieneGps);

        return (
          <React.Fragment key={diaItem.claveId}>
            {vistaActual === 'mes' && diaItem.diaSemana === 'Lun' && diaItem.dia !== 1 && (
              <div className="w-full text-[10px] font-bold text-[#007d7a] uppercase tracking-wider py-0.5 px-2 bg-[#e8f6f2] rounded mt-1 mb-0.5 flex items-center gap-1 border border-[#ccefe2]">
                <span>🗓️ Semana desde Lunes {diaItem.dia}</span>
              </div>
            )}
            <div
              id={`fila-${diaItem.dia}`}
              className={`fila-dia flex items-center justify-between py-1 px-1.5 border-b rounded-md gap-1 w-full shrink-0 tipo-${data.est} transition-all ${
                diaItem.esHoy
                  ? 'border-[#007d7a] ring-2 ring-[#007d7a] bg-[#e6f7f2] shadow-sm'
                  : 'border-gray-100 bg-[#fafafa]'
              }`}
            >
              {/* Label día */}
              <div
                onClick={() => {
                  const el = document.getElementById(`fila-${diaItem.dia}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`font-bold capitalize shrink-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-teal-700 flex items-center gap-1 ${
                  diaItem.esHoy ? 'text-[#007d7a]' : 'text-gray-700'
                } ${
                  esPartido ? 'w-[56px] text-[11px]' : 'w-[64px] text-[12px]'
                }`}
                title={`${diaItem.diaSemana} ${diaItem.dia}${diaItem.esHoy ? ' (Hoy)' : ''}`}
              >
                <span>{diaItem.diaSemana} {diaItem.dia}</span>
                {diaItem.esHoy && (
                  <span className="text-[9px] px-1 py-0.5 bg-[#007d7a] text-white rounded font-black tracking-tighter leading-none">
                    HOY
                  </span>
                )}
              </div>

            {/* Inputs */}
            <div className={`flex items-center justify-center flex-1 ${esPartido ? 'gap-0.5' : 'gap-1'}`}>
              <input
                type="text"
                id={`e1-${diaItem.dia}`}
                placeholder={esPartido ? 'M.E' : 'Ent'}
                value={valE1}
                onChange={(e) => onInputChange(diaItem.claveId, 'e1', e.target.value)}
                onBlur={() => onInputBlur(diaItem.claveId, 'e1')}
                className={`text-center font-bold border border-gray-500 rounded focus:outline-none focus:border-teal-700 bg-[var(--box-empty)] ${
                  esPartido
                    ? 'w-[29px] h-[25px] text-[10px] p-0'
                    : 'w-[42px] h-[26px] text-xs'
                }`}
              />

              <input
                type="text"
                id={`s1-${diaItem.dia}`}
                placeholder={esPartido ? 'M.S' : 'Sal'}
                value={valS1}
                onChange={(e) => onInputChange(diaItem.claveId, 's1', e.target.value)}
                onBlur={() => onInputBlur(diaItem.claveId, 's1')}
                className={`text-center font-bold border border-gray-500 rounded focus:outline-none focus:border-teal-700 bg-[var(--box-empty)] ${
                  esPartido
                    ? 'w-[29px] h-[25px] text-[10px] p-0'
                    : 'w-[42px] h-[26px] text-xs'
                }`}
              />

              {esPartido && (
                <>
                  <input
                    type="text"
                    id={`e2-${diaItem.dia}`}
                    placeholder="T.E"
                    value={valE2}
                    onChange={(e) => onInputChange(diaItem.claveId, 'e2', e.target.value)}
                    onBlur={() => onInputBlur(diaItem.claveId, 'e2')}
                    className="w-[29px] h-[25px] text-[10px] p-0 text-center font-bold border border-gray-500 rounded focus:outline-none focus:border-teal-700 bg-[var(--box-empty)]"
                  />
                  <input
                    type="text"
                    id={`s2-${diaItem.dia}`}
                    placeholder="T.S"
                    value={valS2}
                    onChange={(e) => onInputChange(diaItem.claveId, 's2', e.target.value)}
                    onBlur={() => onInputBlur(diaItem.claveId, 's2')}
                    className="w-[29px] h-[25px] text-[10px] p-0 text-center font-bold border border-gray-500 rounded focus:outline-none focus:border-teal-700 bg-[var(--box-empty)]"
                  />
                </>
              )}

              {/* Selector Estado */}
              <select
                id={`est-${diaItem.dia}`}
                value={data.est}
                onChange={(e) => onEstadoChange(diaItem.claveId, e.target.value as EstadoDia)}
                className={`border border-gray-500 rounded font-bold bg-[#eae7c9] focus:outline-none cursor-pointer ${
                  esPartido
                    ? 'w-[72px] h-[25px] text-[10px] px-0.5'
                    : 'w-[80px] h-[26px] text-[11px] px-1'
                }`}
              >
                <option value="defecto">- Tipo -</option>
                <option value="trabajo">TRABAJO</option>
                <option value="vacaciones">VACAC.</option>
                <option value="libre">LIBRE</option>
                <option value="baja">BAJA M.</option>
              </select>
            </div>

            {/* Total horas */}
            <div
              id={`t-${diaItem.dia}`}
              onClick={() => onOpenAudit(diaItem)}
              className={`flex items-center justify-end font-bold text-gray-800 shrink-0 gap-0.5 cursor-pointer py-0.5 hover:opacity-80 ${
                esPartido ? 'w-[56px] text-xs' : 'w-[76px] text-xs'
              }`}
              title="Ver registro y auditoría GPS"
            >
              {mostrarIconoInfo && (
                <span
                  className="text-[11px] font-bold mr-0.5"
                  style={{ color: 'var(--teal-header)' }}
                >
                  ℹ️
                </span>
              )}
              <span
                className={`font-mono text-right font-bold ${
                  esPartido ? 'w-[36px] text-xs' : 'w-[42px] text-[13px]'
                }`}
              >
                {data.t || '00:00'}
              </span>
            </div>

            {/* Botón Nota */}
            <button
              id={`icononota-${diaItem.dia}`}
              onClick={() => onOpenNota(diaItem)}
              className="text-base cursor-pointer p-0.5 bg-transparent border-none shrink-0 relative hover:scale-110 active:scale-95 transition-transform"
              aria-label="Nota del día"
            >
              {tieneNota ? (
                <span className="relative inline-block filter-none">
                  📝
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-600 rounded-full" />
                </span>
              ) : (
                <span className="grayscale opacity-60">💬</span>
              )}
            </button>
          </div>
        </React.Fragment>
      );
    })}
    </div>
  );
};
