import React from 'react';

export interface SemanaItem {
  numero: number;
  diaInicio: number;
  fechaTarget?: Date;
  horasTexto: string;
  activa: boolean;
}

interface ActionZoneProps {
  onFichar: () => void;
  semanas: SemanaItem[];
  onSeleccionarSemana: (sem: SemanaItem) => void;
}

export const ActionZone: React.FC<ActionZoneProps> = ({
  onFichar,
  semanas,
  onSeleccionarSemana,
}) => {
  return (
    <div
      id="zona-accion-superior"
      className="flex flex-col bg-white p-2 rounded-md shadow-xs gap-2 w-full shrink-0"
    >
      <div className="flex flex-row gap-2 w-full justify-center shrink-0">
        <button
          id="btn-fichar-principal"
          onClick={onFichar}
          className="bg-[#ffaa3b] hover:bg-[#ff9f24] active:bg-[#e59530] active:scale-[0.98] border border-[#333] rounded-md py-3 px-2 text-base font-black text-gray-900 cursor-pointer shadow-sm leading-tight w-full flex items-center justify-center text-center min-h-[46px] transition-all tracking-wide"
        >
          🕒 FICHAR
        </button>
      </div>

      {semanas.length > 0 && (
        <div id="desglose-semanas" className="flex w-full gap-1 overflow-x-auto pb-0.5">
          {semanas.map((sem) => (
            <button
              key={sem.numero}
              id={`btn-semana-${sem.numero}`}
              onClick={() => onSeleccionarSemana(sem)}
              className={`flex-1 min-w-[54px] border rounded py-1 px-0.5 text-center cursor-pointer transition-all whitespace-nowrap text-[11px] font-bold ${
                sem.activa
                  ? 'bg-[#ccefe2] border-[#007d7a] shadow-inner ring-1 ring-[#007d7a]'
                  : 'bg-[#eef0f2] border-gray-300 hover:bg-gray-200'
              }`}
            >
              Sem. {sem.numero}
              <span
                className="block text-[11px] font-bold mt-0.5"
                style={{ color: 'var(--teal-header)' }}
              >
                {sem.horasTexto}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
